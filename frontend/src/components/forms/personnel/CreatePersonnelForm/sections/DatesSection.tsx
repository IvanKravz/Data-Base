import React from 'react';
import { Person } from '../../../../../types';

interface DatesSectionProps {
  formData: Omit<Person, 'id'>;
  setFormData: (data: Omit<Person, 'id'>) => void;
}

export function DatesSection({ formData, setFormData }: DatesSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">
        Даты
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Дата рождения
          </label>
          <input
            type="date"
            required
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Дата контракта
          </label>
          <input
            type="date"
            required
            value={formData.contractDate}
            onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>
    </div>
  );
}