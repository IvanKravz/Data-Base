import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
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
import { useEquipmentFieldPermissions } from '../../../../api/utils/useEquipmentFieldPermissions';
import {
  Info,
  FileText,
  MessageSquare,
  Package,
  Network,
  Trash2,
} from 'lucide-react';

interface EditEquipmentFormProps {
  initialData: Equipment;
  onSubmit: (data: Partial<Equipment>) => void;
  onCancel: () => void;
}

type MainTab = 'main' | 'documents' | 'comments' | 'structure' | 'networks' | 'disposal';
type SubTab = 'assignment' | 'dates' | 'additional';

export function EditEquipmentForm({
  initialData,
  onSubmit,
  onCancel,
}: EditEquipmentFormProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const hasEditPermission = useMemo(
    () => permissions?.models?.Equipment?.includes('change') ?? false,
    [permissions]
  );

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
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('accessToken');

  const permissionsFields = useEquipmentFieldPermissions();

  const [activeMainTab, setActiveMainTab] = useState<MainTab>('main');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('assignment');

  const isClosedEquipment = useMemo(() => {
    if (formData.category) {
      if (typeof formData.category === 'object' && 'is_closed' in formData.category) {
        return formData.category.is_closed;
      }
      const categoryObj = categories.find(cat => cat.value === formData.category);
      return categoryObj ? categoryObj.is_closed : false;
    }
    return false;
  }, [formData.category, categories]);

  const showNetworksTab = useMemo(
    () => (initialData.network_memberships?.length ?? 0) > 0 || initialData.is_network,
    [initialData]
  );
  const showStructureTab = useMemo(
    () => (formData.product_structures?.length ?? 0) > 0,
    [formData.product_structures]
  );
  const showDisposalTab = formData.status === 'disposed';

  // Загрузка справочников с защитой от 403
  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const [divisionsData, categoriesData, organsData] = await Promise.all([
          divisionsApi.getDivisions(token),
          equipmentApi.getEquipmentCategories(token),
          equipmentApi.getInterestOrgans(token).catch(() => []), // защита от 403
        ]);
        setDivisions(divisionsData);
        setCategories(categoriesData);
        setInterestOrgans(organsData || []);
        if (formData.division?.id) {
          const personnelData = await employeesApi.getPersonnel(token, {
            division: formData.division.id,
          });
          setPersonnel(personnelData);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setError('Не удалось загрузить справочники');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [token, formData.division?.id]);

  const handleChange = async (data: Partial<Equipment>) => {
    if (!hasEditPermission) return;
    const newFormData = { ...formData, ...data };
    if (data.category && data.category !== formData.category) {
      let newIsClosed = false;
      if (typeof data.category === 'object' && 'is_closed' in data.category) {
        newIsClosed = data.category.is_closed;
      } else {
        const categoryObj = categories.find(
          cat =>
            cat.value ===
            (typeof data.category === 'object' ? data.category.value : data.category)
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
    setError(null);

    if (!token || !hasEditPermission) {
      setError('Нет прав на редактирование');
      return;
    }

    if (formData.is_free_use && !formData.free_use_act_number?.trim()) {
      setError('При выдаче в безвозмездное пользование необходимо указать номер акта');
      return;
    }

    const dataToSend = {
      ...formData,
      category: formData.category
        ? {
            value: formData.category.value || formData.category,
            name: formData.category.name || formData.category,
          }
        : null,
      is_closed: isClosedEquipment,
      division_id: formData.division?.id || null,
      subdivision_id: formData.subdivision?.id || null,
      facility_id: formData.facility?.id || null,
      assigned_to_id: formData.assigned_to?.id || null,
      interest_organ_id: formData.interest_organ?.id || formData.interest_organ_id || null,
      product_structures: formData.product_structures || [],
    };
    try {
      setIsLoading(true);
      await onSubmit(dataToSend);
    } catch (error: any) {
      console.error('Ошибка сохранения:', error);
      if (error?.response?.data?.free_use_act_number) {
        setError(error.response.data.free_use_act_number[0] || 'Ошибка валидации');
      } else {
        setError('Не удалось сохранить изменения. Проверьте подключение и попробуйте снова.');
      }
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
    const division = divisions.find(d => d.id === formData.division?.id);
    return division?.subdivisions || [];
  };

  const renderMainTabContent = () => {
    switch (activeMainTab) {
      case 'main':
        return (
          <div className="equipment-edit-main-tab">
            <div className="equipment-edit-summary">
              <BasicInformation
                formData={formData}
                onChange={handleChange}
                isClosedEquipment={isClosedEquipment}
                isDisposed={formData.status === 'disposed'}
                equipmentCategories={categories}
                permissions={permissionsFields}
              />
              <IdentificationInfo
                formData={formData}
                onChange={handleChange}
                permissions={permissionsFields}
              />
            </div>

            <div className="equipment-sub-tabs-container">
              <div className="equipment-sub-tabs-list">
                <button
                  className={`equipment-sub-tab-button ${activeSubTab === 'assignment' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('assignment')}
                >
                  Назначение
                </button>
                <button
                  className={`equipment-sub-tab-button ${activeSubTab === 'dates' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('dates')}
                >
                  Даты
                </button>
                <button
                  className={`equipment-sub-tab-button ${activeSubTab === 'additional' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('additional')}
                >
                  Дополнительно
                </button>
              </div>
              <div className="equipment-sub-tab-content">
                {activeSubTab === 'assignment' && (
                  <AssignmentInfo
                    formData={formData}
                    onChange={handleChange}
                    availableSubdivisions={getCurrentSubdivisions()}
                    availablePersonnel={personnel}
                    divisions={divisions}
                    isLoading={isLoading}
                    permissions={permissionsFields}
                  />
                )}
                {activeSubTab === 'dates' && (
                  <DatesInfo
                    formData={formData}
                    onChange={handleChange}
                    serviceLife={formData.service_life}
                    onServiceLifeChange={(value) => handleChange({ service_life: value })}
                    permissions={permissionsFields}
                  />
                )}
                {activeSubTab === 'additional' && (
                  <AdditionalInfo
                    formData={formData}
                    onChange={handleChange}
                    interestOrgans={interestOrgans}
                    isDisposed={formData.status === 'disposed'}
                    permissions={permissionsFields}
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <DocumentsInfo
            formData={formData}
            onChange={handleChange}
            isDisposed={formData.status === 'disposed'}
            permissions={permissionsFields}
          />
        );

      case 'comments':
        return (
          <EditCommentsCard
            comments={formData.comments || ''}
            onChange={(value) => handleChange({ comments: value })}
            permissions={permissionsFields}
          />
        );

      case 'structure':
        return (
          <ProductStructureEditor
            productStructures={formData.product_structures || []}
            onChange={handleStructureChange}
            isDisposed={formData.status === 'disposed'}
            permissions={permissionsFields}
          />
        );

      case 'networks':
        return (
          <div className="equipment-edit-placeholder">
            Редактирование сетей доступно в отдельном разделе
          </div>
        );

      case 'disposal':
        return (
          <div className="equipment-edit-placeholder">
            Редактирование списания доступно в отдельном разделе
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="equipment-form-container">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="ep-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="equipment-tabs-container">
          <div className="equipment-tabs-header">
            <div className="equipment-tabs-list">
              <button
                className={`equipment-tab-button ${activeMainTab === 'main' ? 'active' : ''}`}
                onClick={() => setActiveMainTab('main')}
              >
                <Info size={16} />
                Основное
              </button>
              <button
                className={`equipment-tab-button ${activeMainTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveMainTab('documents')}
              >
                <FileText size={16} />
                Документы
              </button>
              <button
                className={`equipment-tab-button ${activeMainTab === 'comments' ? 'active' : ''}`}
                onClick={() => setActiveMainTab('comments')}
              >
                <MessageSquare size={16} />
                Комментарии
              </button>
              {showStructureTab && (
                <button
                  className={`equipment-tab-button ${activeMainTab === 'structure' ? 'active' : ''}`}
                  onClick={() => setActiveMainTab('structure')}
                >
                  <Package size={16} />
                  Состав
                </button>
              )}
              {showNetworksTab && (
                <button
                  className={`equipment-tab-button ${activeMainTab === 'networks' ? 'active' : ''}`}
                  onClick={() => setActiveMainTab('networks')}
                >
                  <Network size={16} />
                  Сети
                </button>
              )}
              {showDisposalTab && (
                <button
                  className={`equipment-tab-button ${activeMainTab === 'disposal' ? 'active' : ''}`}
                  onClick={() => setActiveMainTab('disposal')}
                >
                  <Trash2 size={16} />
                  Списание
                </button>
              )}
            </div>
          </div>
          <div className="equipment-tab-content">
            {renderMainTabContent()}
          </div>
        </div>

        <FormActions
          onCancel={onCancel}
          showDisposeButton={formData.status !== 'disposed' && hasEditPermission}
          onDispose={() => setShowDisposalModal(true)}
          hasEditPermission={hasEditPermission}
          isLoading={isLoading}
        />
      </form>

      {showDisposalModal && (
        <DisposalModal
          onConfirm={handleDispose}
          onCancel={() => setShowDisposalModal(false)}
        />
      )}
    </div>
  );
}