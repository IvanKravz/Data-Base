import React from 'react';
import { PenTool as Tool, Tag, Database } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import { getStatusIcon, getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';
import { EQUIPMENT_CATEGORIES } from '../../constants';

interface BasicInfoProps {
  equipment: Equipment;
}

export function BasicInfo({ equipment }: BasicInfoProps) {
  const StatusIcon = getStatusIcon(equipment.status);

  return (
    <InfoCard title="Основная информация">
      <InfoItem
        icon={Tool}
        iconColor="text-blue-500"
        label="Тип"
        value={equipment.type}
      />
      <InfoItem
        icon={Tag}
        iconColor="text-purple-500"
        label="Категория"
        value={EQUIPMENT_CATEGORIES[equipment.category]}
      />
      <InfoItem
        icon={StatusIcon}
        iconColor={getStatusColor(equipment.status)}
        label="Статус"
        value={getStatusLabel(equipment.status)}
      />
    </InfoCard>
  );
}