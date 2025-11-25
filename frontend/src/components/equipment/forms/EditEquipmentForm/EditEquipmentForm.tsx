import React, { useState, useEffect } from 'react';
import { Equipment } from '../../../../types';
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
import { AdditionalInfo } from './sections/AdditionalInfo'; // Добавляем новый компонент

interface EditEquipmentFormProps {
  initialData: Equipment;
  onSubmit: (data: Partial<Equipment>) => void;
  onCancel: () => void;
  isClosedEquipment?: boolean;
}

interface Division {
  id: string;
  name: string;
  subdivisions: { id: string; name: string }[];
  facilities: {
    id: string;
    name: string;
    type: {
      id: string;
      name: string;
      description?: string;
    };
    type_display: string;
    facility_class: string;
    class_display: string;
  }[];
}

interface EquipmentCategory {
  value: string;
  name: string;
  is_closed: boolean;
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

  // Вычисляем isClosedEquipment на основе выбранной категории
  const isClosedEquipment = React.useMemo(() => {
    if (formData.category) {
      // Если категория - объект, берем поле is_closed
      if (typeof formData.category === 'object' && 'is_closed' in formData.category) {
        return formData.category.is_closed;
      }
      // Если категория - строка (value), ищем в списке категорий
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
    const newFormData = { ...formData, ...data };

    // Если меняется категория, обновляем is_closed
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

      // Обновляем is_closed в formData
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
    handleChange({ product_structures: structures });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      console.error('Токен отсутствует');
      return;
    }

    // Подготавливаем данные для отправки - используем правильные имена полей
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
      interest_organ_id: formData.interest_organ?.id || formData.interest_organ_id || null, // Добавьте эту строку
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
          />

          <DocumentsInfo
            formData={formData}
            onChange={handleChange}
            isDisposed={formData.status === 'disposed'}
          />

          <IdentificationInfo formData={formData} onChange={handleChange} />

          <DatesInfo
            formData={formData}
            onChange={handleChange}
            serviceLife={formData.service_life}
            onServiceLifeChange={(value) => handleChange({ service_life: value })}
          />

          <AdditionalInfo
            formData={formData}
            onChange={handleChange}
            interestOrgans={interestOrgans}
            isDisposed={formData.status === 'disposed'}
          />

          <AssignmentInfo
            formData={formData}
            onChange={handleChange}
            availableSubdivisions={getCurrentSubdivisions()}
            availablePersonnel={personnel}
            divisions={divisions}
            isLoading={isLoading}
          />

          <EditCommentsCard
            comments={formData.comments || ''}
            onChange={(value) => handleChange({ comments: value })}
          />
        </div>
        <div className="equipment-form-structure">
        <ProductStructureEditor
          productStructures={formData.product_structures || []}
          onChange={handleStructureChange}
          isDisposed={formData.status === 'disposed'}
        />
        </div>

        <FormActions
          onCancel={onCancel}
          showDisposeButton={formData.status !== 'disposed'}
          onDispose={() => setShowDisposalModal(true)}
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