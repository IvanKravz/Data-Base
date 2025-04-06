import React from 'react';
import { Person } from '../../../../../types';

interface BasicInformationProps {
  formData: Omit<Person, 'id'>;
  setFormData: (data: Omit<Person, 'id'>) => void;
}

export function BasicInformation({ formData, setFormData }: BasicInformationProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">
        Основная информация
      </h3>
      
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          ФИО
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Должность
        </label>
        <input
          type="text"
          required
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Отдел
        </label>
        <input
          type="text"
          required
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
    </div>
  );
}