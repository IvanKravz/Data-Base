// sections/DatesInfo.tsx
import React, { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

interface DatesInfoProps {
  equipment: Equipment;
  searchTerm?: string;
}

export function DatesInfo({ equipment, searchTerm = '' }: DatesInfoProps) {
  const items = useMemo(() => {
    const list: { label: string; value: string }[] = [
      { label: 'Дата производства', value: format(new Date(equipment.manufacturing_date), 'dd.MM.yyyy') },
      { label: 'Дата ввода в эксплуатацию', value: format(new Date(equipment.exploitation_date), 'dd.MM.yyyy') },
    ];
    if (equipment.service_life) {
      list.push({ label: 'Срок службы', value: equipment.service_life });
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
    <Section title="Даты">
      {filteredItems.map((item, idx) => {
        const Icon = item.label === 'Срок службы' ? Clock : Calendar;
        return <EquipmentInfoItem key={idx} icon={Icon} label={item.label} value={item.value} />;
      })}
    </Section>
  );
}