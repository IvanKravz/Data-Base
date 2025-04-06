import React from 'react';
import { Hash, NotebookTabs } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import '.././style.css'

interface IdentificationInfoProps {
  equipment: Equipment;
}

export function IdentificationInfo({ equipment }: IdentificationInfoProps) {
  return (
    <InfoCard title="Идентификация">
      <div className="equipment-card-content">
        <InfoItem
          icon={Hash}
          iconColor="text-green-500"
          label="Серийный номер"
          value={equipment.serial_number}
        />
        <InfoItem
          icon={NotebookTabs}
          iconColor="text-orange-500"
          label="Инвентарный номер"
          value={equipment.inventory_number}
        />
      </div>
    </InfoCard>
  );
}