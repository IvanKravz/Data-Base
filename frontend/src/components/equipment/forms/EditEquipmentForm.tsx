import React, { useState, useEffect } from 'react';
import { Equipment } from '../../../types';
import { BasicInformation } from './sections/BasicInformation';
import { IdentificationInfo } from './sections/IdentificationInfo';
import { DatesInfo } from './sections/DatesInfo';
import { AssignmentInfo } from './sections/AssignmentInfo';
import { FormActions } from './sections/FormActions';
import { DisposalModal } from '../DisposalModal';
import { divisionsApi, employeesApi, equipmentApi } from '../../../api';
import './style.css';
import { EditCommentsCard } from './sections/EditCommentsCard';
import { DocumentsInfo } from './sections/DocumentsInfo';
import { ProductStructureEditor } from './sections/ProductStructureEditor';

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
    type: 'station' | 'shd';
    class: string;
  }[];
}

interface EquipmentCategories {
  open: Array<{ value: string; name: string }>;
  closed: Array<{ value: string; name: string }>;
}

export function EditEquipmentForm({
  initialData,
  onSubmit,
  onCancel,
  isClosedEquipment = false,
}: EditEquipmentFormProps) {
  const [formData, setFormData] = useState<Partial<Equipment>>({
    ...initialData,
    comments: initialData.comments || '',
  });
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<EquipmentCategories>({
    open: [],
    closed: [],
  });
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const [divisionsData, categoriesData] = await Promise.all([
          divisionsApi.getDivisions(token),
          equipmentApi.getEquipmentCategories(token),
        ]);

        setDivisions(divisionsData);
        setCategories(categoriesData);

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
    setFormData(newFormData);

    // Если изменилось подразделение - загружаем новый список персонала и сбрасываем отделение
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

  const handleStructureChange = (structures: ProductStructure[]) => {
    handleChange({ product_structures: structures });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      console.error('Токен отсутствует');
      return;
    }

    // Подготавливаем данные для отправки в соответствии с моделью Django
    const dataToSend = {
      ...formData,
      // Категории
      open_category: isClosedEquipment ? null : formData.open_category?.value || null,
      closed_category: isClosedEquipment ? formData.closed_category?.value || null : null, // Изменено с id на value
      is_closed: isClosedEquipment,
      // Связи с другими моделями
      division: formData.division?.id || null,
      subdivision: formData.subdivision?.id || null,
      facility: formData.facility?.id || null,
      assigned_to: formData.assigned_to?.id || null,
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

  const currentCategories = isClosedEquipment ? categories.closed : categories.open;

  return (
    <div className="equipment-form-container">
    <form onSubmit={handleSubmit}>
      <div className="equipment-form">
        <BasicInformation
          formData={formData}
          onChange={handleChange}
          isClosedEquipment={isClosedEquipment}
          isDisposed={formData.status === 'disposed'}
          equipmentCategories={currentCategories}
        />

        <DocumentsInfo
          formData={formData}
          onChange={handleChange}
          isDisposed={formData.status === 'disposed'}
        />

        <IdentificationInfo formData={formData} onChange={handleChange} />

        <DatesInfo formData={formData} onChange={handleChange} />

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

      <ProductStructureEditor
          productStructures={formData.product_structures || []}
          onChange={handleStructureChange}
          isDisposed={formData.status === 'disposed'}
        />

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