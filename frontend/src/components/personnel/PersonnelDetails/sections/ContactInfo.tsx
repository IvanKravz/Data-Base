import React from 'react';
import { Smartphone, Phone, Mail } from 'lucide-react';
import { Employee } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';

interface ContactInfoProps {
  person: Employee;
}

export function ContactInfo({ person }: ContactInfoProps) {
  return (
    <InfoCard title="Контакты">
      <InfoItem icon={Smartphone} label="Личный" value={person.personal_phone || '—'} />
      <InfoItem icon={Phone} label="Рабочий" value={person.work_phone || '—'} />
      {person.email && <InfoItem icon={Mail} label="Email" value={person.email} />}
    </InfoCard>
  );
}