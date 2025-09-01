import React from 'react';
import { Calendar } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import { format } from 'date-fns';
import '.././style.css'

interface DatesInfoProps {
  equipment: Equipment;
}

export function DatesInfo({ equipment }: DatesInfoProps) {
  return (
    <InfoCard title="Даты">
      <div className="equipment-card-content">
        <InfoItem
          icon={Calendar}
          iconColor="text-blue-500"
          label="Дата производства"
          value={format(new Date(equipment.manufacturing_date), 'dd.MM.yyyy')}
        />
        <InfoItem
          icon={Calendar}
          iconColor="text-green-500"
          label="Дата ввода в эксплуатацию"
          value={format(new Date(equipment.exploitation_date), 'dd.MM.yyyy')}
        />
      </div>
    </InfoCard>
  );
}