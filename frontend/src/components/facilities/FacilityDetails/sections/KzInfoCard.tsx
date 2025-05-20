import React from 'react';
import { Ruler, CheckCircle, XCircle } from 'lucide-react';
import { Facility } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import '../style.css';

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
          value={facility.kzSize || 'Не указан'}
        />
        <InfoItem
          icon={facility.hasTransformerInKz ? CheckCircle : XCircle}
          iconColor={facility.hasTransformerInKz ? 'text-green-500' : 'text-red-500'}
          label="ТП в пределах КЗ"
          value={facility.hasTransformerInKz ? 'Да' : 'Нет'}
        />
        <InfoItem
          icon={facility.hasGroundingInKz ? CheckCircle : XCircle}
          iconColor={facility.hasGroundingInKz ? 'text-green-500' : 'text-red-500'}
          label="Контур заземления в пределах КЗ"
          value={facility.hasGroundingInKz ? 'Да' : 'Нет'}
        />
      </div>
    </InfoCard>
  );
}