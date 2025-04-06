import React from 'react';
import { Calendar } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';

interface DatesInfoProps {
  equipment: Equipment;
}

export function DatesInfo({ equipment }: DatesInfoProps) {
  return (
    <InfoCard title="Даты">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoItem
          icon={Calendar}
          iconColor="text-blue-500"
          label="Дата производства"
          value={equipment.manufacturingDate}
        />
        <InfoItem
          icon={Calendar}
          iconColor="text-green-500"
          label="Дата покупки"
          value={equipment.purchaseDate}
        />
      </div>
    </InfoCard>
  );
}