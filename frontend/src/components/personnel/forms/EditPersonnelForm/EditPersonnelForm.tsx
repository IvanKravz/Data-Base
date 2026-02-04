// EditPersonnelForm.tsx
import React, { useState, useEffect } from 'react';
import { Employee } from '../../../../types';
import { BasicInformationCard } from './sections/BasicInformationCard';
import { ContactInformationCard } from './sections/ContactInformationCard';
import { DatesCard } from './sections/DatesCard';
import { ResponsibilityCard } from './sections/ResponsibilityCard';
import { ShaWorkerCard } from './sections/ShaWorkerCard';
import { CommentsCard } from './sections/CommentsCard';
import { FormActions } from './sections/FormActions';
import { divisionsApi } from '../../../../api/divisions';
import { Division } from '../../../../types';
import { AffiliationCard } from './sections/AffiliationCard';

interface EditPersonnelFormProps {
  person: Employee;
  onSubmit: (person: Employee) => void;
  onCancel: () => void;
  isCreateMode?: boolean;
  fixedDivision?: boolean;
  fixedSubdivision?: boolean;
}

export function EditPersonnelForm({
  person,
  onSubmit,
  onCancel,
  isCreateMode = false,
  fixedDivision = false,
  fixedSubdivision = false
}: EditPersonnelFormProps) {
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
  const [divisions, getDivisions] = useState<Division[]>([]);

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const data = await divisionsApi.getDivisions(token);
        getDivisions(data);
      } catch (err) {
        setError('Не удалось загрузить подразделения');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDivisions();
  }, [token]);

  const handleChange = (data: Partial<Employee>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const isManagement = formData.category === 'management';
  const isTopManagement = isManagement &&
    (formData.position === 'Главный руководитель' ||
      formData.position === 'Заместитель главного руководителя');
  const showDivisionField = isCreateMode || !isManagement || (isManagement && !isTopManagement);

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
      const dataToSend = {
        ...formData,
        description: formData.description || null,
        sha_details: formData.is_sha_worker ? formData.sha_details : null,
        data_state_secrets: formData.is_sha_worker ? formData.data_state_secrets : null,
        date_end_work: formData.is_sha_worker ? formData.date_end_work : null,
        date_start_work: formData.is_sha_worker ? formData.date_start_work : null,
        year_graduation: formData.is_sha_worker ? formData.year_graduation : null
      };

      onSubmit(dataToSend as Employee);
    } catch (err) {
      setError(isCreateMode
        ? 'Не удалось создать сотрудника'
        : 'Не удалось обновить данные сотрудника');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="personnel-form-edit-container">
      <form onSubmit={handleSubmit} className="personnel-edit-form">
        {error && <div className="form-error">{error}</div>}
        <div className="personnel-edit-content">
          <div className="personnel-edit-grid">
            <BasicInformationCard
              formData={formData}
              onChange={handleChange}
              token={token}
            />
            {(isCreateMode || showDivisionField) && (
              <AffiliationCard
                formData={formData}
                divisions={divisions}
                onChange={handleChange}
                isTopManagement={isTopManagement}
                showDivisionField={showDivisionField}
                fixedDivision={fixedDivision}
                fixedSubdivision={fixedSubdivision}
              />
            )}
            <ContactInformationCard
              formData={formData}
              onChange={handleChange}
            />
            <DatesCard
              formData={formData}
              onChange={handleChange}
            />
            <ResponsibilityCard
              formData={formData}
              onChange={handleChange}
            />
          </div>
          <div className='personnel-cards-sha-comment'>
            {formData.is_sha_worker && (
              <ShaWorkerCard
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
            <CommentsCard
              description={formData.description || ''}
              onChange={(description) => handleChange({ description })}
            />
          </div>
        </div>
      </form>
      
      <FormActions
        onCancel={onCancel}
        isEditing={!isCreateMode}
        isLoading={loading}
      />
    </div>

  );
}