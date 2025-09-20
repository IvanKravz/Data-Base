import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Facility } from '../../../../types';
import { BasicInformation } from './sections/BasicInformation';
import { Documentation } from './sections/Documentation';
import { KzInformation } from './sections/KzInformation';
import { Classification } from './sections/Classification';
import { Assignment } from './sections/Assignment';
import { FormActions } from './sections/FormActions';
import { divisionsApi, employeesApi } from '../../../../api';
import './EditFacilityForm.css';

interface EditFacilityFormProps {
  initialData: Facility;
  onSubmit: (data: Partial<Facility>) => Promise<void>; // Изменили на Promise<void>
  onCancel: () => void;
  isEditing?: boolean; // Добавили новый пропс
}

export function EditFacilityForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = true,
}: EditFacilityFormProps) {
  const [formData, setFormData] = useState<Partial<Facility>>({
    ...initialData,
    comments: initialData.comments || '',
    city: initialData.city || '',
    street: initialData.street || '',
  });
  const [divisions, setDivisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const [divisionsData] = await Promise.all([
          divisionsApi.getDivisions(token),
        ]);

        setDivisions(divisionsData);

        if (initialData.division) {
          const selectedDivision = divisionsData.find(d => d.id === initialData.division);
          setFormData(prev => ({
            ...prev,
            divisionData: selectedDivision
          }));
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleChange = (data: Partial<Facility>) => {
    setFormData(prev => {
      const newData = { ...prev, ...data };
      
      // Если объект становится открытым, сбрасываем класс и документацию
      if (data.is_closed === false) {
        newData.facility_class = null;
        newData.kz_size = null;
        newData.has_transformer_in_kz = false;
        newData.has_grounding_in_kz = false;
        newData.acceptance_act_number = null;
        newData.rim_act_number = null;
        newData.commissioning_act_number = null;
        newData.opening_permission_number = null;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setIsLoading(true);

      // Формируем данные для отправки
      const dataToSend = {
        ...formData,
        type_id: formData.type?.id || null, // Используем type_id вместо type
        communication_post_ids: formData.communication_posts?.map(p => p.id) || [],
        facility_class: formData.facility_class || null
      };

      await onSubmit(dataToSend);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="facility-form-edit">
      <BasicInformation
        formData={formData}
        onChange={handleChange}
        isClosedFacility={initialData.is_closed}
      />

      <Classification
        formData={formData}
        onChange={handleChange}
        divisionId={formData.division}
        subdivisionId={formData.subdivision}
      />

      <Assignment
        formData={formData}
        onChange={handleChange}
        divisions={divisions}
        isLoading={isLoading}
      />

      {formData.is_closed && (
        <>
          <Documentation
            formData={formData}
            onChange={handleChange}
          />
          <KzInformation
            formData={formData}
            onChange={handleChange}
          />
        </>
      )}

      <div className="facility-card-edit">
        <div className="facility-card-header-edit">
          <MessageSquare size={20} />
          <h3 className="facility-card-title-edit">Комментарии</h3>
        </div>
        <div className="facility-card-content-edit">
          <textarea
            value={formData.comments || ''}
            onChange={(e) => handleChange({ comments: e.target.value })}
            className="facility-form-textarea-edit"
            placeholder="Добавьте комментарии к объекту..."
          />
        </div>
      </div>

      <FormActions
        onCancel={onCancel}
        isEditing={isEditing}
        isLoading={isLoading}
      />
    </form>
  );
}