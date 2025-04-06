import React from 'react';
import { Person } from '../../../../../types';

interface ResponsibilitySectionProps {
  formData: Omit<Person, 'id'>;
  setFormData: (data: Omit<Person, 'id'>) => void;
}

export function ResponsibilitySection({ formData, setFormData }: ResponsibilitySectionProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isMaterialResponsible"
          checked={formData.isMaterialResponsible}
          onChange={(e) => setFormData({ ...formData, isMaterialResponsible: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <label htmlFor="isMaterialResponsible" className="text-sm font-medium text-gray-700">
          Материально ответственное лицо
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isShaWorker"
          checked={formData.isShaWorker}
          onChange={(e) => setFormData({
            ...formData,
            isShaWorker: e.target.checked,
            shaDetails: e.target.checked ? {
              conclusionNumber: '',
              startDate: '',
              accessLevel: '1',
              equipment: []
            } : undefined
          })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <label htmlFor="isShaWorker" className="text-sm font-medium text-gray-700">
          ШаРаботник
        </label>
      </div>
    </div>
  );
}