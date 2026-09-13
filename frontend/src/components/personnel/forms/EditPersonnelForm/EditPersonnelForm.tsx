// EditPersonnelForm.tsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Employee } from '../../../../types';
import { BasicInformationCard } from './sections/BasicInformationCard';
import { ContactInformationCard } from './sections/ContactInformationCard';
import { DatesCard } from './sections/DatesCard';
import { ShaWorkerCard } from './sections/ShaWorkerCard';
import { CommentsCard } from './sections/CommentsCard';
import { divisionsApi } from '../../../../api/divisions';
import { Division } from '../../../../types';
import { AffiliationCard } from './sections/AffiliationCard';
import './style.css';

type TabId = 'main' | 'affiliation' | 'contacts' | 'dates' | 'sha' | 'comments';

interface EditPersonnelFormProps {
  person: Employee;
  onSubmit: (person: Employee) => void;
  onCancel: () => void;
  isCreateMode?: boolean;
  fixedDivision?: boolean;
  fixedSubdivision?: boolean;
  canEditBasic?: boolean;
  canEditShaComments?: boolean;
  activeTab?: TabId; // управляется извне
}

export interface EditPersonnelFormRef {
  submitForm: () => void;
  cancelForm: () => void;
}

export const EditPersonnelForm = forwardRef<EditPersonnelFormRef, EditPersonnelFormProps>(
  (
    {
      person,
      onSubmit,
      onCancel,
      isCreateMode = false,
      fixedDivision = false,
      fixedSubdivision = false,
      canEditBasic = false,
      canEditShaComments = false,
      activeTab = 'main',
    },
    ref
  ) => {
    const [formData, setFormData] = useState<Employee>({ ...person });
    const token = localStorage.getItem('accessToken');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [divisions, setDivisions] = useState<Division[]>([]);

    useEffect(() => {
      setFormData({ ...person });
    }, [person]);

    useEffect(() => {
      const fetchDivisions = async () => {
        try {
          const data = await divisionsApi.getDivisions(token);
          setDivisions(data);
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
      if (!canEditBasic && !canEditShaComments) return;
      setFormData((prev) => ({ ...prev, ...data }));
    };

    const handleShaWorkerChange = (shaWorker: Employee['sha_details']) => {
      if (!canEditShaComments) return;
      setFormData((prev) => ({
        ...prev,
        sha_details: shaWorker
          ? { ...shaWorker, equipment_conclusions: [...(shaWorker?.equipment_conclusions || [])] }
          : null,
      }));
    };

    const handleAddEquipment = () => {
      if (!canEditShaComments) return;
      if (!formData.sha_details) return;
      setFormData((prev) => ({
        ...prev,
        sha_details: {
          ...prev.sha_details!,
          equipment_conclusions: [
            ...(prev.sha_details!.equipment_conclusions || []),
            { equipment_type: '', conclusion_number: '' },
          ],
        },
      }));
    };

    const handleRemoveEquipment = (index: number) => {
      if (!canEditShaComments) return;
      if (!formData.sha_details || !Array.isArray(formData.sha_details.equipment_conclusions)) return;
      setFormData((prev) => ({
        ...prev,
        sha_details: {
          ...prev.sha_details!,
          equipment_conclusions: prev.sha_details!.equipment_conclusions.filter((_, i) => i !== index),
        },
      }));
    };

    const handleEquipmentChange = (
      index: number,
      field: 'equipment_type' | 'conclusion_number',
      value: string
    ) => {
      if (!canEditShaComments) return;
      if (!formData.sha_details || !Array.isArray(formData.sha_details.equipment_conclusions)) return;
      setFormData((prev) => ({
        ...prev,
        sha_details: {
          ...prev.sha_details!,
          equipment_conclusions: prev.sha_details!.equipment_conclusions.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
          ),
        },
      }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!canEditBasic && !canEditShaComments) {
        setError('У вас нет прав на редактирование');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let shaDetails = formData.sha_details;
        if (formData.is_sha_worker && shaDetails) {
          const filteredConclusions = shaDetails.equipment_conclusions.filter(
            item => item.equipment_type.trim() !== '' || item.conclusion_number.trim() !== ''
          );
          shaDetails = {
            ...shaDetails,
            equipment_conclusions: filteredConclusions
          };
          if (!shaDetails.start_date) {
            shaDetails = { ...shaDetails, start_date: new Date().toISOString().split('T')[0] };
          }
        }

        const dataToSend = {
          ...formData,
          description: formData.description || null,
          sha_details: formData.is_sha_worker ? shaDetails : null,
          data_state_secrets: formData.is_sha_worker ? formData.data_state_secrets : null,
          date_end_work: formData.is_sha_worker ? formData.date_end_work : null,
          date_start_work: formData.is_sha_worker ? formData.date_start_work : null,
          year_graduation: formData.is_sha_worker ? formData.year_graduation : null,
          rank: formData.category === 'civilian' ? null : formData.rank || null,
        };
        onSubmit(dataToSend as Employee);
      } catch (err) {
        setError(
          isCreateMode
            ? 'Не удалось создать сотрудника'
            : 'Не удалось обновить данные сотрудника'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const handleCancel = () => {
      onCancel();
    };

    useImperativeHandle(ref, () => ({
      submitForm: handleSubmit,
      cancelForm: handleCancel,
    }));

    const isManagement = formData.category === 'management';
    const isTopManagement =
      isManagement &&
      (formData.position === 'Главный руководитель' ||
        formData.position === 'Заместитель главного руководителя');
    const showDivisionField = isCreateMode || !isManagement || (isManagement && !isTopManagement);

    // Рендерим содержимое в зависимости от активной вкладки
    const renderContent = () => {
      switch (activeTab) {
        case 'main':
          return (
            <BasicInformationCard
              formData={formData}
              onChange={handleChange}
              token={token}
              readOnly={!canEditBasic}
              readOnlySha={!canEditShaComments}
            />
          );
        case 'affiliation':
          return showDivisionField ? (
            <AffiliationCard
              formData={formData}
              divisions={divisions}
              onChange={handleChange}
              isTopManagement={isTopManagement}
              showDivisionField={showDivisionField}
              fixedDivision={fixedDivision}
              fixedSubdivision={fixedSubdivision}
              readOnly={!canEditBasic}
            />
          ) : null;
        case 'contacts':
          return (
            <ContactInformationCard
              formData={formData}
              onChange={handleChange}
              readOnly={!canEditBasic}
            />
          );
        case 'dates':
          return (
            <DatesCard
              formData={formData}
              onChange={handleChange}
              readOnly={!canEditBasic}
            />
          );
        case 'sha':
          return formData.is_sha_worker ? (
            <ShaWorkerCard
              shaWorker={
                formData.sha_details || {
                  start_date: '',
                  access_level: '1',
                  equipment_conclusions: [],
                }
              }
              onChange={handleShaWorkerChange}
              onAddEquipment={handleAddEquipment}
              onRemoveEquipment={handleRemoveEquipment}
              onEquipmentChange={handleEquipmentChange}
              readOnly={!canEditShaComments}
            />
          ) : null;
        case 'comments':
          return (
            <CommentsCard
              description={formData.description || ''}
              onChange={(description) => handleChange({ description })}
              readOnly={!canEditShaComments}
            />
          );
        default:
          return null;
      }
    };

    return (
      <div className="epf-edit-form">
        <div className="ep-form-container">
          <form onSubmit={handleSubmit} className="ep-form">
            {error && <div className="ep-error">{error}</div>}

            {!canEditShaComments && (
              <div className="ep-error" style={{ marginBottom: '0.5rem' }}>
                ⚠️ У вас нет прав на редактирование ШР и комментариев
              </div>
            )}

            <div className="ep-form-content">
              {renderContent()}
            </div>
          </form>
        </div>
      </div>
    );
  }
);

EditPersonnelForm.displayName = 'EditPersonnelForm';