import React from 'react';
import { Ruler, CheckCircle, XCircle } from 'lucide-react';
import { Facility } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import '../FacilityForm.css';

interface KzInfoCardProps {
  facility: Facility;
}

export function KzInfoCard({ facility }: KzInfoCardProps) {
  return (
    <InfoCard title="Информация о КЗ">
      <div className="space-y-4">
        <InfoItem
          icon={Ruler}
          iconColor="text-orange-500"
          label="Размер КЗ"
          value={facility.kz_size || 'Не указан'}
        />
        <InfoItem
          icon={facility.has_transformer_in_kz ? CheckCircle : XCircle}
          iconColor={facility.has_transformer_in_kz ? 'text-green-500' : 'text-red-500'}
          label="ТП в пределах КЗ"
          value={facility.has_transformer_in_kz ? 'Да' : 'Нет'}
        />
        <InfoItem
          icon={facility.has_grounding_in_kz ? CheckCircle : XCircle}
          iconColor={facility.has_grounding_in_kz ? 'text-green-500' : 'text-red-500'}
          label="Контур заземления в пределах КЗ"
          value={facility.has_grounding_in_kz ? 'Да' : 'Нет'}
        />
      </div>
    </InfoCard>
  );
}