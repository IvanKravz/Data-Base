import React from 'react';
import { Users } from 'lucide-react';
import { Facility } from '../../../../types';
import { samplePersonnel } from '../../../../data/sampleData';
import { InfoCard } from './InfoCard';
import '../FacilityForm.css'

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
      <div className="responsible-persons-list">
        {responsiblePersons.map(person => (
          <div key={person.id} className="responsible-person">
            <Users className="responsible-person-icon" />
            <div>
              <p className="responsible-person-name">{person.name}</p>
              <p className="responsible-person-position">{person.position}</p>
            </div>
          </div>
        ))}
        {responsiblePersons.length === 0 && (
          <p className="no-responsible-persons">
            Нет назначенных материально ответственных лиц
          </p>
        )}
      </div>
    </InfoCard>
  );
}