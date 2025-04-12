import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Employee } from '../../../../types';
import { BasicInformationCard } from './sections/BasicInformationCard';
import { ContactInformationCard } from './sections/ContactInformationCard';
import { DatesCard } from './sections/DatesCard';
import { ResponsibilityCard } from './sections/ResponsibilityCard';
import { ShaWorkerCard } from './sections/ShaWorkerCard';
import { CommentsCard } from './sections/CommentsCard';
import { FormActions } from './sections/FormActions';
import { useNavigate } from 'react-router-dom';
import { employeesApi } from '../../../../api';
import { divisionsApi } from '../../../../api/divisions';
import { Division } from '../../../../types';

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
  const [divisions, getDivisions] = useState<{ results: Division[] }>({ results: [] });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const data = await divisionsApi.getDivisions(token);
        getDivisions(data);
        // dispatch(setDivisions(data));
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
        description: formData.description || ''
      };

      const updatedPerson = await employeesApi.updatePerson(token, formData.id, dataToSend);
      onSubmit(updatedPerson);
      navigate(`/personnel/${formData.id}`);
      location.reload();
    } catch (err) {
      setError('Не удалось обновить данные сотрудника');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="personnel-edit-form">
      <div className="personnel-edit-grid">
        <BasicInformationCard
          formData={formData}
          onChange={handleChange}
          divisions={divisions.results}
        />
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

      <FormActions onCancel={onCancel} loading={loading} />
    </form>
  );
}