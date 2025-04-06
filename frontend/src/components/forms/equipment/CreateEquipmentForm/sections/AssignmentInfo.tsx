import React from 'react';
import { Equipment } from '../../../../../types';
import { Building2, User } from 'lucide-react';
import { divisions } from '../../../../../data/divisionsData';
import { samplePersonnel } from '../../../../../data/sampleData';

interface AssignmentInfoProps {
  formData: Omit<Equipment, 'id'>;
  onChange: (data: Partial<Equipment>) => void;
}

export function AssignmentInfo({ formData, onChange }: AssignmentInfoProps) {
  const divisionPersonnel = samplePersonnel.filter(
    person => person.division === formData.division &&
    (!formData.subdivision || person.subdivision === formData.subdivision)
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Подразделение
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.division}
            onChange={(e) => onChange({ 
              division: e.target.value,
              subdivision: undefined,
              assignedTo: undefined
            })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none"
          >
            {divisions.map((division) => (
              <option key={division.id} value={division.name}>
                {division.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(formData.division === '1 отдел' || formData.division === '2 отдел') && (
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700">
            Отделение
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={formData.subdivision || ''}
              onChange={(e) => onChange({ 
                subdivision: e.target.value,
                assignedTo: undefined
              })}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none"
            >
              <option value="">Выберите отделение</option>
              {formData.division === '1 отдел' ? (
                <>
                  <option value="Отделение A">Отделение A</option>
                  <option value="Отделение B">Отделение B</option>
                  <option value="Отделение C">Отделение C</option>
                </>
              ) : (
                <>
                  <option value="Отделение D">Отделение D</option>
                  <option value="Отделение E">Отделение E</option>
                  <option value="Отделение F">Отделение F</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Закреплено за
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.assignedTo || ''}
            onChange={(e) => onChange({ assignedTo: e.target.value || undefined })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none"
          >
            <option value="">Не закреплено</option>
            {divisionPersonnel.map((person) => (
              <option key={person.id} value={person.name}>
                {person.name} - {person.position}
                {person.subdivision && ` (${person.subdivision})`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}