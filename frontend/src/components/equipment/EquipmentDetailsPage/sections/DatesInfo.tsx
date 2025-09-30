import React from 'react';
import { Calendar } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
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
        {equipment.service_life && (
          <div className="equipment-info-item">
            <Clock className="equipment-info-item__icon text-purple-500" size={20} />
            <div>
              <p className="equipment-info-item__label">Срок службы</p>
              <p className="equipment-info-item__value">{equipment.service_life}</p>
            </div>
          </div>
        )}
      </div>
    </InfoCard>
  );
}