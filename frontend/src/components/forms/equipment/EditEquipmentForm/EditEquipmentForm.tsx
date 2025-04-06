import React, { useState } from 'react';
import { Equipment } from '../../../../types';
import { BasicInformation } from './sections/BasicInformation';
import { IdentificationInfo } from './sections/IdentificationInfo';
import { DatesInfo } from './sections/DatesInfo';
import { AssignmentInfo } from './sections/AssignmentInfo';
import { FormActions } from './sections/FormActions';

interface EditEquipmentFormProps {
  equipment: Equipment;
  onSubmit: (equipment: Equipment) => void;
  onCancel: () => void;
}

export function EditEquipmentForm({ equipment, onSubmit, onCancel }: EditEquipmentFormProps) {
  const [formData, setFormData] = useState<Equipment>(equipment);

  const handleChange = (data: Partial<Equipment>) => {
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
            Идентификация
          </h3>
          <IdentificationInfo formData={formData} onChange={handleChange} />
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">
            Даты
          </h3>
          <DatesInfo formData={formData} onChange={handleChange} />
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">
            Принадлежность
          </h3>
          <AssignmentInfo formData={formData} onChange={handleChange} />
        </div>
      </div>

      <FormActions onCancel={onCancel} />
    </form>
  );
}