import React from 'react';
import { User, Building2, Calendar, MessageSquare, Tag } from 'lucide-react';
import { ClipboardList, Shield } from 'lucide-react';
import { Employee } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';

interface BasicInfoProps {
  person: Employee;
}

export function BasicInfo({ person }: BasicInfoProps) {
  return (
      <InfoCard title="Основная информация">
        <InfoItem
          icon={User}
          iconColor="text-blue-500"
          label="Должность"
          value={person.position}
        />
        <InfoItem
          icon={Tag}
          iconColor="text-red-500"
          label="Звание"
          value={person.rank}
        />
        <InfoItem
          icon={Building2}
          iconColor="text-brown-500"
          label="Подразделение"
          value={[person.division?.name, person.subdivision?.name].filter(Boolean).join(' - ') || 'Не указано'}
        />
        <InfoItem
          icon={Calendar}
          iconColor="text-green-500"
          label="Дата рождения"
          value={person.birth_date}
        />
        
        {person.is_material_responsible && (
          <div className="info-item">
            <ClipboardList className="info-item-icon" />
            <p className="text-sm text-gray-600">
              Сотрудник является материально ответственным лицом
            </p>
          </div>
        )}
      </InfoCard>
  );
}