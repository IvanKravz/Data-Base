import React from 'react';
import { Hash, Database } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';

interface IdentificationInfoProps {
  equipment: Equipment;
}

export function IdentificationInfo({ equipment }: IdentificationInfoProps) {
  return (
    <InfoCard title="Идентификация">
      <div className="space-y-4">
        <InfoItem
          icon={Hash}
          iconColor="text-green-500"
          label="Серийный номер"
          value={equipment.serialNumber}
        />
        <InfoItem
          icon={Database}
          iconColor="text-orange-500"
          label="Инвентарный номер"
          value={equipment.inventoryNumber}
        />
      </div>
    </InfoCard>
  );
}