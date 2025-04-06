import React from 'react';
import { Users } from 'lucide-react';
import { Facility } from '../../../../types';
import { samplePersonnel } from '../../../../data/sampleData';
import { InfoCard } from './InfoCard';

interface ResponsiblePersonsProps {
  facility: Facility;
}

export function ResponsiblePersons({ facility }: ResponsiblePersonsProps) {
  const responsiblePersons = samplePersonnel.filter(
    person => person.division === facility.division && 
    (!facility.subdivision || person.subdivision === facility.subdivision) &&
    person.isMaterialResponsible
  );

  return (
    <InfoCard title="Материально ответственные лица">
      <div className="space-y-3">
        {responsiblePersons.map(person => (
          <div key={person.id} className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">{person.name}</p>
              <p className="text-sm text-gray-500">{person.position}</p>
            </div>
          </div>
        ))}
        {responsiblePersons.length === 0 && (
          <p className="text-sm text-gray-500">
            Нет назначенных материально ответственных лиц
          </p>
        )}
      </div>
    </InfoCard>
  );
}