import React from 'react';
import { Building2, User, MapPin } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';

interface AssignmentInfoProps {
  equipment: Equipment;
}

export function AssignmentInfo({ equipment }: AssignmentInfoProps) {
  const facilities = useSelector((state: RootState) => state.facilities.facilities);
  const facility = equipment.facilityId 
    ? facilities.find(f => f.id === equipment.facilityId)
    : null;

  return (
    <InfoCard title="Принадлежность">
      <div className="space-y-4">
        <InfoItem
          icon={Building2}
          iconColor="text-blue-500"
          label="Подразделение"
          value={`${equipment.division}${equipment.subdivision ? ` - ${equipment.subdivision}` : ''}`}
        />
        {equipment.assignedTo && (
          <InfoItem
            icon={User}
            iconColor="text-green-500"
            label="Закреплено за"
            value={equipment.assignedTo}
          />
        )}
        {facility && (
          <InfoItem
            icon={MapPin}
            iconColor="text-purple-500"
            label="Объект"
            value={`${facility.name} (${facility.type === 'station' ? 'Станция' : 'ШД'}, ${facility.class} класс)`}
          />
        )}
      </div>
    </InfoCard>
  );
}