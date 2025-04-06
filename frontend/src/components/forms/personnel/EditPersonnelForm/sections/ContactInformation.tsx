import React from 'react';
import { Person } from '../../../../../types';
import { divisions } from '../../../../../data/divisionsData';

interface ContactInformationProps {
  formData: Person;
  onChange: (data: Partial<Person>) => void;
}

export function ContactInformation({ formData, onChange }: ContactInformationProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">
        Контактная информация
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Личный телефон
        </label>
        <input
          type="tel"
          required
          value={formData.personal_phone}
          onChange={(e) => onChange({ personal_phone: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Рабочий телефон
        </label>
        <input
          type="tel"
          required
          value={formData.work_phone}
          onChange={(e) => onChange({ work_phone: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Подразделение
        </label>
        <select
          value={formData.division}
          onChange={(e) => onChange({ 
            division: e.target.value,
            subdivision: undefined
          })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Отделение
          </label>
          <select
            value={formData.subdivision || ''}
            onChange={(e) => onChange({ subdivision: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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