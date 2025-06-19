import React from 'react';
import { FileText } from 'lucide-react';
import { Facility } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import '../FacilityForm.css';

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
          value={facility.acceptance_act_number || 'Не указан'}
        />
        <InfoItem
          icon={FileText}
          iconColor="text-indigo-500"
          label="Акт РИМ"
          value={facility.rim_act_number || 'Не указан'}
        />
        <InfoItem
          icon={FileText}
          iconColor="text-indigo-500"
          label="Акт ввода"
          value={facility.commissioning_act_number || 'Не указан'}
        />
        <InfoItem
          icon={FileText}
          iconColor="text-indigo-500"
          label="Разрешение на открытие"
          value={facility.opening_permission_number || 'Не указан'}
        />
      </div>
    </InfoCard>
  );
}