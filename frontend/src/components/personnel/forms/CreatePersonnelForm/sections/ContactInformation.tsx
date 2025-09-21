import React from 'react';
import { Person } from '../../../../../types';
import { divisions } from '../../../../../data/divisionsData';

interface ContactInformationProps {
  formData: Omit<Person, 'id'>;
  setFormData: (data: Omit<Person, 'id'>) => void;
}

export function ContactInformation({ formData, setFormData }: ContactInformationProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">
        Контактная информация
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Email
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Телефон
        </label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Подразделение
        </label>
        <select
          value={formData.division}
          onChange={(e) => setFormData({ 
            ...formData, 
            division: e.target.value,
            subdivision: undefined
          })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2"
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
            onChange={(e) => setFormData({ ...formData, subdivision: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
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