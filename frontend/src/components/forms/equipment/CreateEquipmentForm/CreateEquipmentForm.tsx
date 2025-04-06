import React, { useState } from 'react';
import { Equipment, EquipmentCategory } from '../../../../types';
import { Package, Database, Calendar, Building2 } from 'lucide-react';
import { SectionHeader } from './sections/SectionHeader';
import { BasicInformation } from './sections/BasicInformation';
import { IdentificationInfo } from './sections/IdentificationInfo';
import { DatesInfo } from './sections/DatesInfo';
import { AssignmentInfo } from './sections/AssignmentInfo';
import { FormActions } from './sections/FormActions';

interface CreateEquipmentFormProps {
  category?: EquipmentCategory;
  equipment: Equipment[];
  onSubmit: (equipment: Omit<Equipment, 'id'>) => void;
  onCancel: () => void;
}

export function CreateEquipmentForm({ category, equipment, onSubmit, onCancel }: CreateEquipmentFormProps) {
  const [formData, setFormData] = useState<Omit<Equipment, 'id'>>({
    name: '',
    type: '',
    category: category || 'tko',
    status: 'in-storage',
    serialNumber: '',
    purchaseDate: '',
    inventoryNumber: '',
    manufacturingDate: '',
    division: '1 отдел'
  });

  const handleChange = (data: Partial<Equipment>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.type || !formData.serialNumber || 
        !formData.inventoryNumber || !formData.manufacturingDate || !formData.purchaseDate) {
      return;
    }

    // Call onSubmit with the form data
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <SectionHeader icon={Package} title="Основная информация" />
        <BasicInformation 
          formData={formData}
          onChange={handleChange}
          equipment={equipment}
          category={category}
        />
      </div>

      <div>
        <SectionHeader icon={Database} title="Идентификация" iconColor="text-purple-500" />
        <IdentificationInfo 
          formData={formData}
          onChange={handleChange}
        />
      </div>

      <div>
        <SectionHeader icon={Calendar} title="Даты" iconColor="text-green-500" />
        <DatesInfo 
          formData={formData}
          onChange={handleChange}
        />
      </div>

      <div>
        <SectionHeader icon={Building2} title="Принадлежность" iconColor="text-orange-500" />
        <AssignmentInfo 
          formData={formData}
          onChange={handleChange}
        />
      </div>

      <FormActions onCancel={onCancel} />
    </form>
  );
}