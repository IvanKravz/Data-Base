import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Facility } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import '../FacilityForm.css';

interface BasicInfoProps {
  facility: Facility;
}

export function BasicInfo({ facility }: BasicInfoProps) {
  return (
    <InfoCard title="Основная информация">
      <div className="space-y-4">
        <InfoItem
          icon={Building2}
          iconColor="text-blue-500"
          label="Название"
          value={facility.name}
        />
        <InfoItem
          icon={MapPin}
          iconColor="text-green-500"
          label="Адрес"
          value={facility.address}
        />
        <InfoItem
          icon={Building2}
          iconColor="text-purple-500"
          label="Подразделение"
          value={`${facility.division_name}${facility.subdivision_name ? ` - ${facility.subdivision_name}` : ''}`}
        />
      </div>
    </InfoCard>
  );
}