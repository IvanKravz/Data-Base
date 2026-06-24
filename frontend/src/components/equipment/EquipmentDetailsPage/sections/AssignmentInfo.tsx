// AssignmentInfo.tsx
import React from 'react';
import { Building2, User, MapPin } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

interface AssignmentInfoProps {
  equipment: Equipment;
}

export function AssignmentInfo({ equipment }: AssignmentInfoProps) {
  const getDivisionValue = () => {
    const divisionName = equipment.division?.name || 'Не указано';
    const subdivisionName = equipment.subdivision?.name;
    return subdivisionName ? `${divisionName} - ${subdivisionName}` : divisionName;
  };

  return (
    <Section title="Принадлежность">
      <EquipmentInfoItem icon={Building2} label="Подразделение" value={getDivisionValue()} />
      {equipment.assigned_to && (
        <EquipmentInfoItem icon={User} label="Закреплено за" value={equipment.assigned_to.full_name} />
      )}
      {equipment.facility?.id && (
        <EquipmentInfoItem icon={MapPin} label="Объект" value={equipment.facility.name} />
      )}
    </Section>
  );
}