import React, { useState, useEffect } from 'react';
import { Division, Equipment, EquipmentCategory } from '../../../../types';
import { BasicInformation } from './sections/BasicInformation';
import { IdentificationInfo } from './sections/IdentificationInfo';
import { DatesInfo } from './sections/DatesInfo';
import { AssignmentInfo } from './sections/AssignmentInfo';
import { FormActions } from './sections/FormActions';
import { DisposalModal } from '../../DisposalModal';
import { divisionsApi, employeesApi, equipmentApi } from '../../../../api';
import './style.css';
import { EditCommentsCard } from './sections/EditCommentsCard';
import { DocumentsInfo } from './sections/DocumentsInfo';
import { ProductStructureEditor } from './sections/ProductStructureEditor';
import { AdditionalInfo } from './sections/AdditionalInfo';
import { useEquipmentPermissions } from './hooks/usePermissions';
import { canEdit } from '../../../../api/utils/permissions';
// import { useEquipmentPermissions } from '../../../../hooks/useEquipmentPermissions';
// import { canEdit } from '../../../../utils/permissions';

interface EditEquipmentFormProps {
  initialData: Equipment;
  onSubmit: (data: Partial<Equipment>) => void;
  onCancel: () => void;
  isClosedEquipment?: boolean;
}

export function EditEquipmentForm({
  initialData,
  onSubmit,
  onCancel,
}: EditEquipmentFormProps) {
  const [formData, setFormData] = useState<Partial<Equipment>>({
    ...initialData,
    comments: initialData.comments || '',
  });
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [interestOrgans, setInterestOrgans] = useState<any[]>([]);
  const token = localStorage.getItem('accessToken');
  
  // Используем хук для получения прав доступа
  const permissions = useEquipmentPermissions();
  const hasEditPermission = canEdit('equipment');

  // Вычисляем isClosedEquipment на основе выбранной категории
  const isClosedEquipment = React.useMemo(() => {
    if (formData.category) {
      if (typeof formData.category === 'object' && 'is_closed' in formData.category) {
        return formData.category.is_closed;
      }
      const categoryObj = categories.find(cat => cat.value === formData.category);
      return categoryObj ? categoryObj.is_closed : false;
    }
    return false;
  }, [formData.category, categories]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const [divisionsData, categoriesData, organsData] = await Promise.all([
          divisionsApi.getDivisions(token),
          equipmentApi.getEquipmentCategories(token),
          equipmentApi.getInterestOrgans(token),
        ]);

        setDivisions(divisionsData);
        setCategories(categoriesData);
        setInterestOrgans(organsData);

        if (formData.division?.id) {
          const personnelData = await employeesApi.getPersonnel(token, {
            division: formData.division.id,
          });
          setPersonnel(personnelData);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [token, formData.division?.id]);

  const handleChange = async (data: Partial<Equipment>) => {
    if (!hasEditPermission) return; // Запрещаем изменения без прав

    const newFormData = { ...formData, ...data };

    if (data.category && data.category !== formData.category) {
      let newIsClosed = false;

      if (typeof data.category === 'object' && 'is_closed' in data.category) {
        newIsClosed = data.category.is_closed;
      } else {
        const categoryObj = categories.find(cat =>
          cat.value === (typeof data.category === 'object' ? data.category.value : data.category)
        );
        newIsClosed = categoryObj ? categoryObj.is_closed : false;
      }

      newFormData.is_closed = newIsClosed;
    }

    setFormData(newFormData);

    if (data.division?.id && data.division.id !== formData.division?.id && token) {
      setIsLoading(true);
      try {
        const personnelData = await employeesApi.getPersonnel(token, {
          division: data.division.id,
        });
        setPersonnel(personnelData);
      } catch (error) {
        console.error('Ошибка загрузки персонала:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStructureChange = (structures: any[]) => {
    if (!hasEditPermission) return;
    handleChange({ product_structures: structures });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !hasEditPermission) {
      console.error('Токен отсутствует или нет прав на редактирование');
      return;
    }

    const dataToSend = {
      ...formData,
      category: formData.category ? {
        value: formData.category.value || formData.category,
        name: formData.category.name || formData.category
      } : null,
      is_closed: isClosedEquipment,
      division_id: formData.division?.id || null,
      subdivision_id: formData.subdivision?.id || null,
      facility_id: formData.facility?.id || null,
      assigned_to_id: formData.assigned_to?.id || null,
      interest_organ_id: formData.interest_organ?.id || formData.interest_organ_id || null,
      product_structures: formData.product_structures || []
    };

    try {
      setIsLoading(true);
      await onSubmit(dataToSend);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispose = (disposalInfo: {
    actNumber?: string;
    actDate?: string;
    certNumber?: string;
    certDate?: string;
    comments?: string;
  }) => {
    if (!hasEditPermission) return;
    onSubmit({
      ...formData,
      status: 'disposed',
      disposal_act_number: disposalInfo.actNumber,
      disposal_act_date: disposalInfo.actDate,
      disposal_cert_number: disposalInfo.certNumber,
      disposal_cert_date: disposalInfo.certDate,
      disposal_comments: disposalInfo.comments,
    });
  };

  const getCurrentSubdivisions = () => {
    if (!formData.division?.id) return [];
    const division = divisions.find((d) => d.id === formData.division?.id);
    return division?.subdivisions || [];
  };

  return (
    <div className="equipment-form-container">
      <form onSubmit={handleSubmit}>
        <div className="equipment-form">
          <BasicInformation
            formData={formData}
            onChange={handleChange}
            isClosedEquipment={isClosedEquipment}
            isDisposed={formData.status === 'disposed'}
            equipmentCategories={categories}
            permissions={permissions}
          />

          <DocumentsInfo
            formData={formData}
            onChange={handleChange}
            isDisposed={formData.status === 'disposed'}
            permissions={permissions}
          />

          <IdentificationInfo 
            formData={formData} 
            onChange={handleChange}
            permissions={permissions}
          />

          <DatesInfo
            formData={formData}
            onChange={handleChange}
            serviceLife={formData.service_life}
            onServiceLifeChange={(value) => handleChange({ service_life: value })}
            permissions={permissions}
          />

          <AdditionalInfo
            formData={formData}
            onChange={handleChange}
            interestOrgans={interestOrgans}
            isDisposed={formData.status === 'disposed'}
            permissions={permissions}
          />

          <AssignmentInfo
            formData={formData}
            onChange={handleChange}
            availableSubdivisions={getCurrentSubdivisions()}
            availablePersonnel={personnel}
            divisions={divisions}
            isLoading={isLoading}
            permissions={permissions}
          />

          <EditCommentsCard
            comments={formData.comments || ''}
            onChange={(value) => handleChange({ comments: value })}
            permissions={permissions}
          />
        </div>
        <div className="equipment-form-structure">
          <ProductStructureEditor
            productStructures={formData.product_structures || []}
            onChange={handleStructureChange}
            isDisposed={formData.status === 'disposed'}
            permissions={permissions}
          />
        </div>

        <FormActions
          onCancel={onCancel}
          showDisposeButton={formData.status !== 'disposed' && hasEditPermission}
          onDispose={() => setShowDisposalModal(true)}
          hasEditPermission={hasEditPermission}
        />
      </form>

      {showDisposalModal && (
        <DisposalModal
          onConfirm={(disposalInfo) => {
            handleDispose(disposalInfo);
            setShowDisposalModal(false);
          }}
          onCancel={() => setShowDisposalModal(false)}
        />
      )}
    </div>
  );
}