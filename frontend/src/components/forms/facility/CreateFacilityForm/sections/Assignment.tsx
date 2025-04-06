import React from 'react';
import { divisions } from '../../../../../data/divisionsData';
import { Facility } from '../../../../../types';

interface AssignmentProps {
  formData: Omit<Facility, 'id'>;
  onChange: (data: Partial<Facility>) => void;
}

export function Assignment({ formData, onChange }: AssignmentProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Подразделение
        </label>
        <select
          value={formData.division}
          onChange={(e) => onChange({ 
            division: e.target.value,
            subdivision: undefined
          })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {divisions.map((division) => (
            <option key={division.id} value={division.name}>
              {division.name}
            </option>
          ))}
        </select>
      </div>

      {(formData.division === '1 отдел' || formData.division === '2 отдел') && (
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700">
            Отделение
          </label>
          <select
            value={formData.subdivision || ''}
            onChange={(e) => onChange({ subdivision: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      )}
    </div>
  );
}