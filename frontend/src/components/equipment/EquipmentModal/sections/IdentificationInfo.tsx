import React from 'react';
import { Database, Hash } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';

interface IdentificationInfoProps {
  equipment: Equipment;
}

export function IdentificationInfo({ equipment }: IdentificationInfoProps) {
  return (
    <InfoCard title="Идентификация">
      <InfoItem
        icon={Database}
        iconColor="text-green-500"
        label="Серийный номер"
        value={equipment.serialNumber}
      />
      <InfoItem
        icon={Hash}
        iconColor="text-orange-500"
        label="Инвентарный номер"
        value={equipment.inventoryNumber}
      />
    </InfoCard>
  );
}