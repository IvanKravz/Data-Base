// sections/AdditionalInfo.tsx
import React, { useMemo } from 'react';
import { Shield, Target, Gift, Network } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

interface AdditionalInfoProps {
  equipment: Equipment;
  searchTerm?: string;
}

export function AdditionalInfo({ equipment, searchTerm = '' }: AdditionalInfoProps) {
  const getSecretLevelDisplay = (level: string) => {
    switch (level) {
      case 'OV': return 'ОВ';
      case 'SS': return 'СС';
      case 'SECRET': return 'Секретно';
      case 'DSP': return 'ДСП';
      default: return level;
    }
  };

  const items = useMemo(() => {
    const list: { label: string; value: string; icon: any }[] = [];
    if (equipment.secret_level) {
      list.push({ label: 'Степень секретности', value: getSecretLevelDisplay(equipment.secret_level), icon: Shield });
    }
    if (equipment.interest_organ) {
      list.push({ label: 'В чьих интересах', value: equipment.interest_organ.name, icon: Target });
    }
    if (equipment.is_free_use) {
      const value = equipment.free_use_act_number ? `Да (акт №${equipment.free_use_act_number})` : 'Да';
      list.push({ label: 'Безвозмездное пользование', value, icon: Gift });
    }
    if (equipment.is_network) {
      list.push({ label: 'Сетевое оборудование', value: 'Да', icon: Network });
    }
    return list;
  }, [equipment]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase().trim();
    return items.filter(item =>
      item.label.toLowerCase().includes(lower) ||
      item.value.toLowerCase().includes(lower)
    );
  }, [items, searchTerm]);

  // Если нет элементов, возвращаем null (родительская проверка покажет сообщение)
  if (filteredItems.length === 0) return null;

  return (
    <Section title="Дополнительная информация">
      {filteredItems.map((item, idx) => (
        <EquipmentInfoItem key={idx} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </Section>
  );
}