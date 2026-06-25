// sections/DisposalInfo.tsx
import React, { useMemo } from 'react';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

interface DisposalInfoProps {
  equipment: Equipment;
  searchTerm?: string;
}

export function DisposalInfo({ equipment, searchTerm = '' }: DisposalInfoProps) {
  if (!equipment.disposal_act_number && !equipment.disposal_cert_number) {
    return null;
  }

  const items = useMemo(() => {
    const list: { label: string; value: string }[] = [];
    list.push({ label: '№ акта списания', value: equipment.disposal_act_number || '—' });
    if (equipment.disposal_act_date) {
      list.push({ label: 'Дата акта', value: format(new Date(equipment.disposal_act_date), 'dd.MM.yyyy') });
    }
    list.push({ label: '№ справки о ликвидации', value: equipment.disposal_cert_number || '—' });
    if (equipment.disposal_cert_date) {
      list.push({ label: 'Дата справки', value: format(new Date(equipment.disposal_cert_date), 'dd.MM.yyyy') });
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

  if (filteredItems.length === 0) return null;

  return (
    <Section title="Информация о списании">
      {filteredItems.map((item, idx) => {
        const Icon = item.label.includes('Дата') ? Calendar : FileText;
        return <EquipmentInfoItem key={idx} icon={Icon} label={item.label} value={item.value} />;
      })}
      {equipment.disposal_comments && (
        <div>
          <span className="equipment-info-item__label">Комментарии к списанию</span>
          <p className="equipment-info-item__value equipment-info-item__value--multiline">
            {equipment.disposal_comments}
          </p>
        </div>
      )}
    </Section>
  );
}