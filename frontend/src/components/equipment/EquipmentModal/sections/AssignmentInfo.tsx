import React from 'react';
import { Building2, MapPin, User } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import { sampleFacilities } from '../../../../data/sampleData';

interface AssignmentInfoProps {
  equipment: Equipment;
}

export function AssignmentInfo({ equipment }: AssignmentInfoProps) {
  const facility = equipment.facilityId 
    ? sampleFacilities.find(f => f.id === equipment.facilityId) 
    : null;

  return (
    <InfoCard title="Принадлежность">
      <InfoItem
        icon={Building2}
        iconColor="text-blue-500"
        label="Подразделение"
        value={`${equipment.division}${equipment.subdivision ? ` - ${equipment.subdivision}` : ''}`}
      />
      {facility && (
        <InfoItem
          icon={MapPin}
          iconColor="text-purple-500"
          label="Объект"
          value={`${facility.name} (${facility.type === 'station' ? 'Станция' : 'ШД'}, ${facility.class} класс)`}
        />
      )}
      {equipment.assignedTo && (
        <InfoItem
          icon={User}
          iconColor="text-green-500"
          label="Закреплено за"
          value={equipment.assignedTo}
        />
      )}
    </InfoCard>
  );
}