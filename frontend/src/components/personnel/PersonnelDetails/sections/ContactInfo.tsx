import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { Employee } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';

interface ContactInfoProps {
  person: Employee;
}

export function ContactInfo({ person }: ContactInfoProps) {
  return (
    <InfoCard title="Контактная информация">
      <InfoItem
        icon={Phone}
        iconColor="text-green-500"
        label="Личный телефон"
        value={person.personal_phone}
      />
      <InfoItem
        icon={Phone}
        iconColor="text-green-500"
        label="Рабочий телефон"
        value={person.work_phone}
      />
    </InfoCard>
  );
}