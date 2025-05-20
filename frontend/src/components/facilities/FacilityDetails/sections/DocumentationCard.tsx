import React from 'react';
import { FileText } from 'lucide-react';
import { Facility } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import '../style.css';

interface DocumentationCardProps {
  facility: Facility;
}

export function DocumentationCard({ facility }: DocumentationCardProps) {
  return (
    <InfoCard title="Документация">
      <div className="space-y-4">
        <InfoItem
          icon={FileText}
          iconColor="text-indigo-500"
          label="Акт приемки помещения"
          value={facility.acceptanceActNumber || 'Не указан'}
        />
        <InfoItem
          icon={FileText}
          iconColor="text-indigo-500"
          label="Акт РИМ"
          value={facility.rimActNumber || 'Не указан'}
        />
        <InfoItem
          icon={FileText}
          iconColor="text-indigo-500"
          label="Акт ввода"
          value={facility.commissioningActNumber || 'Не указан'}
        />
        <InfoItem
          icon={FileText}
          iconColor="text-indigo-500"
          label="Разрешение на открытие"
          value={facility.openingPermissionNumber || 'Не указан'}
        />
      </div>
    </InfoCard>
  );
}