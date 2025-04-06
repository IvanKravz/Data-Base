import React, { useState } from 'react';
import { Facility } from '../../../../types';
import { BasicInformation } from './sections/BasicInformation';
import { Classification } from './sections/Classification';
import { Documentation } from './sections/Documentation';
import { KzInformation } from './sections/KzInformation';
import { Assignment } from './sections/Assignment';
import { FormActions } from './sections/FormActions';

interface CreateFacilityFormProps {
  onSubmit: (facility: Omit<Facility, 'id'>) => void;
  onCancel: () => void;
}

export function CreateFacilityForm({ onSubmit, onCancel }: CreateFacilityFormProps) {
  const [formData, setFormData] = useState<Omit<Facility, 'id'>>({
    name: '',
    type: 'station',
    class: '1',
    address: '',
    division: '1 отдел'
  });

  const handleChange = (data: Partial<Facility>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">
            Основная информация
          </h3>
          <BasicInformation formData={formData} onChange={handleChange} />
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">
            Классификация
          </h3>
          <Classification formData={formData} onChange={handleChange} />
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">
            Документация
          </h3>
          <Documentation formData={formData} onChange={handleChange} />
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">
            Информация о КЗ
          </h3>
          <KzInformation formData={formData} onChange={handleChange} />
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">
            Принадлежность
          </h3>
          <Assignment formData={formData} onChange={handleChange} />
        </div>
      </div>

      <FormActions onCancel={onCancel} />
    </form>
  );
}