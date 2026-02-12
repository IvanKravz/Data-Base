import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { Facility } from '../../../../types';
import { BasicInformation } from './sections/BasicInformation';
import { Documentation } from './sections/Documentation';
import { KzInformation } from './sections/KzInformation';
import { Classification } from './sections/Classification';
import { Assignment } from './sections/Assignment';
import { FormActions } from './sections/FormActions';
import './EditFacilityForm.css';

interface EditFacilityFormProps {
  initialData: Facility;
  onSubmit: (data: Partial<Facility>) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  preSelectedDivision?: string;
  preSelectedSubdivision?: string;
  divisions?: any[];
  facilityTypes?: any[];
  communicationPosts?: any[];
  isLoadingData?: boolean;
  fixedDivision?: boolean;
  fixedSubdivision?: boolean;
}

export function EditFacilityForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = true,
  preSelectedDivision,
  preSelectedSubdivision,
  divisions = [],
  facilityTypes = [],
  communicationPosts = [],
  isLoadingData = false,
  fixedDivision = false,
  fixedSubdivision = false
}: EditFacilityFormProps) {
  const [formData, setFormData] = useState<Partial<Facility>>({
    ...initialData,
    comments: initialData.comments || '',
    city: initialData.city || '',
    street: initialData.street || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ИСПРАВЛЕНИЕ: Убираем внутреннюю загрузку данных, используем переданные пропсы
  const availableSubdivisions = useMemo(() => {
    if (!formData.division?.id) return [];
    const division = divisions.find((d) => d.id === formData.division?.id);
    return division?.subdivisions || [];
  }, [formData.division?.id, divisions]);

  // ИСПРАВЛЕНИЕ: Правильная инициализация с учетом загрузки данных
  useEffect(() => {
    // Если данные еще загружаются, ждем
    if (isLoadingData) return;

    // Если уже инициализировали, не делаем повторную инициализацию
    if (isInitialized) return;

    // Устанавливаем данные формы
    setFormData(prev => ({
      ...prev,
      division: initialData.division,
      subdivision: initialData.subdivision,
      type: initialData.type,
      communication_posts: initialData.communication_posts || []
    }));

    setIsInitialized(true);
  }, [initialData, isLoadingData, isInitialized, divisions]);

  // ИСПРАВЛЕНИЕ: Дополнительный эффект для обновления данных при изменении divisions
  useEffect(() => {
    if (!isInitialized || isLoadingData) return;

    // Если divisions загрузились после инициализации, обновляем данные
    if (divisions.length > 0 && initialData.division) {
      const divisionObj = divisions.find(d => String(d.id) === String(initialData.division?.id));
      const subdivisionObj = initialData.subdivision && divisionObj?.subdivisions
        ? divisionObj.subdivisions.find(s => String(s.id) === String(initialData.subdivision?.id))
        : null;

      if (divisionObj && divisionObj.id !== formData.division?.id) {
        setFormData(prev => ({
          ...prev,
          division: divisionObj,
          subdivision: subdivisionObj || prev.subdivision
        }));
      }
    }
  }, [divisions, initialData, isInitialized, isLoadingData, formData.division?.id]);

  // ИСПРАВЛЕНИЕ: useCallback для обработчиков
  const handleChange = useCallback((data: Partial<Facility>) => {
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
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

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
      setIsSubmitting(false);
    }
  }, [formData, onSubmit]);

  // Пока данные загружаются, показываем индикатор загрузки
  if (!isInitialized && isLoadingData) {
    return (
      <div className="facility-form-edit-container">
        <div className="facility-form-edit-card">
          <div className="facility-form-edit-card-content">
            <p>Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="facility-form-edit-container">
      <form onSubmit={handleSubmit} className="facility-form-edit-wrapper">
        <div className="facility-form-edit-content">
          <BasicInformation
            formData={formData}
            onChange={handleChange}
            isClosedFacility={formData.is_closed || false}
          />

          <Assignment
            formData={formData}
            onChange={handleChange}
            divisions={divisions}
            availableSubdivisions={availableSubdivisions}
            isLoading={isLoadingData}
            fixedDivision={fixedDivision}
            fixedSubdivision={fixedSubdivision}
          />

          <Classification
            formData={formData}
            onChange={handleChange}
            divisionId={formData.division?.id}
            subdivisionId={formData.subdivision?.id}
            facilityTypes={facilityTypes}
            communicationPosts={communicationPosts}
            isLoading={isLoadingData}
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

          <div className="facility-form-edit-card">
            <div className="facility-form-edit-card-header">
              <MessageSquare size={20} />
              <h3 className="facility-form-edit-card-title">Комментарии</h3>
            </div>
            <div className="facility-form-edit-card-content">
              <textarea
                value={formData.comments || ''}
                onChange={(e) => handleChange({ comments: e.target.value })}
                className="facility-form-edit-textarea"
                placeholder="Добавьте комментарии к объекту..."
              />
            </div>
          </div>
        </div>
        <FormActions
          onCancel={onCancel}
          isEditing={isEditing}
          isLoading={isSubmitting}
        />
      </form>
    </div>
  );
}
