// ClassificationtFacility.tsx
import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Facility } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';
import '../FacilityForm.css';

interface BasicInfoProps {
  facility: Facility;
}

export function ClassificationtFacility({ facility }: BasicInfoProps) {
  const { canAccessCommunicationPosts } = useAppPermissions();
  const canViewPosts = canAccessCommunicationPosts();

  return (
    <InfoCard title="Классификация">
      <div className="space-y-4">
        <InfoItem
          icon={Building2}
          iconColor="text-blue-500"
          label="Тип объекта"
          value={facility.type?.name || 'Не указан'}
        />
        {facility.is_closed && (
          <InfoItem
            icon={MapPin}
            iconColor="text-green-500"
            label="Класс"
            value={facility.facility_class}
          />
        )}
        {canViewPosts && facility.communication_posts?.length > 0 && (
          <InfoItem
            icon={Building2}
            iconColor="text-purple-500"
            label="Пост связи"
            value={facility.communication_posts.map(post => post.name).join(', ')}
          />
        )}
      </div>
    </InfoCard>
  );
}