import React, { useState } from 'react';
import { Employee } from '../../../../types';
import { BasicInformation } from './sections/BasicInformation';
import { ContactInformation } from './sections/ContactInformation';
import { DatesSection } from './sections/DatesSection';
import { ResponsibilitySection } from './sections/ResponsibilitySection';
import { ShaWorkerSection } from './sections/ShaWorkerSection';
import { CommentsSection } from './sections/CommentsSection';
import { FormActions } from './sections/FormActions';
import { SectionHeader } from './sections/SectionHeader';
import { User, Mail, Calendar, Shield, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employeesApi } from '../../../../api';

interface EditPersonnelFormProps {
  person: Employee;
  onSubmit: (person: Employee) => void;
  onCancel: () => void;
}

export function EditPersonnelForm({ person, onSubmit, onCancel }: EditPersonnelFormProps) {
  const [formData, setFormData] = useState<Employee>({
    ...person,
    description: person.description || '',
    sha_details: person.sha_details ? {
      ...person.sha_details,
      equipment_conclusions: Array.isArray(person.sha_details.equipment_conclusions)
        ? person.sha_details.equipment_conclusions
        : []
    } : null
  });

  const token = localStorage.getItem('accessToken');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (data: Partial<Employee>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleShaWorkerChange = (shaWorker: Employee['sha_details']) => {
    setFormData(prev => ({
      ...prev,
      sha_details: shaWorker ? {
        ...shaWorker,
        equipment_conclusions: Array.isArray(shaWorker.equipment_conclusions)
          ? shaWorker.equipment_conclusions
          : []
      } : null
    }));
  };

  const handleAddEquipment = () => {
    if (!formData.sha_details) return;

    setFormData(prev => ({
      ...prev,
      sha_details: {
        ...prev.sha_details!,
        equipment_conclusions: [
          ...(prev.sha_details!.equipment_conclusions || []),
          { equipment_type: '', conclusion_number: '' }
        ]
      }
    }));
  };

  const handleRemoveEquipment = (index: number) => {
    if (!formData.sha_details || !Array.isArray(formData.sha_details.equipment_conclusions)) return;

    setFormData(prev => ({
      ...prev,
      sha_details: {
        ...prev.sha_details!,
        equipment_conclusions: prev.sha_details!.equipment_conclusions.filter((_, i) => i !== index)
      }
    }));
  };

  const handleEquipmentChange = (index: number, field: 'equipment_type' | 'conclusion_number', value: string) => {
    if (!formData.sha_details || !Array.isArray(formData.sha_details.equipment_conclusions)) return;

    setFormData(prev => ({
      ...prev,
      sha_details: {
        ...prev.sha_details!,
        equipment_conclusions: prev.sha_details!.equipment_conclusions.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Создаем объект для отправки, включая description независимо от is_sha_worker/is_material_responsible
      const dataToSend = {
        ...formData,
        description: formData.description || '' // Гарантируем, что description всегда будет в отправляемых данных
      };

      const updatedPerson = await employeesApi.updatePerson(token, formData.id, dataToSend);
      onSubmit(updatedPerson);
      navigate(`/personnel/${formData.id}`);
      location.reload()
    } catch (err) {
      setError('Не удалось обновить данные сотрудника');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <SectionHeader icon={User} title="Основная информация" />
            <BasicInformation formData={formData} onChange={handleChange} />
          </div>

          <div>
            <SectionHeader icon={Calendar} title="Даты" iconColor="text-green-500" />
            <DatesSection formData={formData} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionHeader icon={Mail} title="Контактная информация" iconColor="text-purple-500" />
            <ContactInformation formData={formData} onChange={handleChange} />
          </div>

          <div>
            <SectionHeader icon={Shield} title="Ответственность" iconColor="text-orange-500" />
            <ResponsibilitySection formData={formData} onChange={handleChange} />
          </div>
        </div>
      </div>

      {formData.is_sha_worker && (
        <ShaWorkerSection
          shaWorker={formData.sha_details || {
            start_date: '',
            access_level: '1',
            equipment_conclusions: []
          }}
          onChange={handleShaWorkerChange}
          onAddEquipment={handleAddEquipment}
          onRemoveEquipment={handleRemoveEquipment}
          onEquipmentChange={handleEquipmentChange}
        />
      )}

      <div>
        <SectionHeader icon={MessageSquare} title="Комментарии и заметки" iconColor="text-indigo-500" />
        <CommentsSection
          description={formData.description || ''}
          onChange={(description) => handleChange({ description })}
        />
      </div>

      <FormActions onCancel={onCancel} loading={loading} />
    </form>
  );
}