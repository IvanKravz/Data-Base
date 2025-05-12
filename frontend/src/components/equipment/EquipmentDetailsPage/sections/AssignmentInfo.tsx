import React from 'react';
import { Building2, User, MapPin } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import '.././style.css'

interface AssignmentInfoProps {
  equipment: Equipment;
}

export function AssignmentInfo({ equipment }: AssignmentInfoProps) {
  // const facilities = useSelector((state: RootState) => state.facilities.facilities);
  // const facility = equipment.facility 
  //   ? facilities.find(f => f.id === equipment.facility)
  //   : null;

  return (
    <InfoCard title="Принадлежность">
      <div className="equipment-card-content">
        <InfoItem
          icon={Building2}
          iconColor="text-blue-500"
          label="Подразделение"
          value={`${equipment.division.name}${equipment.subdivision.name ? ` - ${equipment.subdivision.name }` : ''}`}
        />
        {equipment.assigned_to && (
          <InfoItem
            icon={User}
            iconColor="text-green-500"
            label="Закреплено за"
            value={equipment.assigned_to.full_name}
          />
        )}
        {equipment.facility?.id && (
          <InfoItem
            icon={MapPin}
            iconColor="text-purple-500"
            label="Объект"
            value={equipment.facility.name}
          />
        )}
      </div>
    </InfoCard>
  );
}