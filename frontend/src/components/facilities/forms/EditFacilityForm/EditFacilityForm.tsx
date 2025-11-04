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
  onSubmit: (data: Partial<Facility>) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  preSelectedDivision?: string;
  preSelectedSubdivision?: string;
  divisions?: any[];
  isLoadingDivisions?: boolean;
}

export function EditFacilityForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = true,
  preSelectedDivision,
  preSelectedSubdivision,
  divisions = [],
  isLoadingDivisions = false
}: EditFacilityFormProps) {
  const [formData, setFormData] = useState<Partial<Facility>>({
    ...initialData,
    comments: initialData.comments || '',
    city: initialData.city || '',
    street: initialData.street || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [internalDivisions, setInternalDivisions] = useState<any[]>(divisions);
  const [isInitialized, setIsInitialized] = useState(false);
  const token = localStorage.getItem('accessToken');

  // Вычисляем доступные отделения на основе выбранного подразделения
  const getAvailableSubdivisions = () => {
    if (!formData.division?.id) return [];
    const division = internalDivisions.find((d) => d.id === formData.division?.id);
    return division?.subdivisions || [];
  };

  const availableSubdivisions = getAvailableSubdivisions();

  useEffect(() => {
    const initializeForm = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        let divisionsToUse = divisions;

        // Если divisions не переданы извне, загружаем их самостоятельно
        if (divisions.length === 0) {
          divisionsToUse = await divisionsApi.getDivisions(token);
          setInternalDivisions(divisionsToUse);
        } else {
          setInternalDivisions(divisions);
        }

        // Находим актуальное подразделение из загруженного списка
        let actualDivision = null;
        if (initialData.division) {
          const divisionId = typeof initialData.division === 'object'
            ? initialData.division.id
            : initialData.division;

          actualDivision = divisionsToUse.find(d =>
            d.id === divisionId
          );
        }

        // Формируем обновленные данные формы
        const updatedFormData: Partial<Facility> = {
          ...initialData,
          comments: initialData.comments || '',
          city: initialData.city || '',
          street: initialData.street || '',
          is_closed: initialData.is_closed,
          division: actualDivision || initialData.division,
          // Гарантируем, что subdivision сохраняется
          subdivision: initialData.subdivision
        };

        setFormData(updatedFormData);
        setIsInitialized(true);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeForm();
  }, [token, divisions, initialData]);

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
        type_id: formData.type?.id || null,
        communication_post_ids: formData.communication_posts?.map(p => p.id) || [],
        facility_class: formData.facility_class || null,
        division_id: formData.division?.id || null,
        subdivision_id: formData.subdivision?.id || null
      };

      await onSubmit(dataToSend);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Пока данные загружаются, показываем индикатор загрузки
  if (!isInitialized && isLoading) {
    return (
      <div className="facility-form-edit">
        <div className="facility-card-edit">
          <div className="facility-card-content-edit">
            <p>Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="facility-form-edit">
      <BasicInformation
        formData={formData}
        onChange={handleChange}
        isClosedFacility={formData.is_closed || false}
      />

      <Assignment
        formData={formData}
        onChange={handleChange}
        divisions={internalDivisions}
        availableSubdivisions={availableSubdivisions}
        isLoading={isLoadingDivisions || isLoading}
      />

      <Classification
        formData={formData}
        onChange={handleChange}
        divisionId={formData.division?.id} 
        subdivisionId={formData.subdivision?.id}
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