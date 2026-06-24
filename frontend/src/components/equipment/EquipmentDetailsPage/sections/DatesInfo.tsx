// DatesInfo.tsx
import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

interface DatesInfoProps {
  equipment: Equipment;
  hideTitle?: boolean;
}

export function DatesInfo({ equipment, hideTitle = false }: DatesInfoProps) {
  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'dd.MM.yyyy');
    } catch {
      return '—';
    }
  };

  return (
    <Section title="Даты" hideTitle={hideTitle}>
      <EquipmentInfoItem
        icon={Calendar}
        label="Дата производства"
        value={formatDate(equipment.manufacturing_date)}
      />
      <EquipmentInfoItem
        icon={Calendar}
        label="Дата ввода в эксплуатацию"
        value={formatDate(equipment.exploitation_date)}
      />
      {equipment.service_life && (
        <EquipmentInfoItem
          icon={Clock}
          label="Срок службы"
          value={equipment.service_life}
        />
      )}
    </Section>
  );
}