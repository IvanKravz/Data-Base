// EditFacilityPage.tsx
import React, { useState, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Facility } from '../../../../types';
import { Save, X, Info, Tag, FileText, Ruler, MessageSquare, ArrowLeft, Building2, MapPin, AlertCircle } from 'lucide-react';
import { BasicInformation } from './sections/BasicInformation';
import { Assignment } from './sections/Assignment';
import { Classification } from './sections/Classification';
import { Documentation } from './sections/Documentation';
import { KzInformation } from './sections/KzInformation';
import { EditComments } from './sections/EditComments';
import './EditFacilityPage.css';

type TabId = 'main' | 'classification' | 'documentation' | 'kz' | 'comments';

export interface EditFacilityPageRef {
  getFormData: () => Partial<Facility>;
}

interface EditFacilityPageProps {
  initialData: Partial<Facility>;
  onSubmit?: (data: Partial<Facility>) => Promise<void> | void;
  onCancel: () => void;
  isEditing?: boolean;
  divisions?: any[];
  facilityTypes?: any[];
  communicationPosts?: any[];
  isLoadingData?: boolean;
  fixedDivision?: boolean;
  fixedSubdivision?: boolean;
  validationErrors?: Record<string, string>;
  hideSidebar?: boolean;
  hideActions?: boolean;
  hideTabs?: boolean;
  initialTab?: TabId;
}

// Маппинг полей на человекочитаемые названия
const FIELD_LABELS: Record<string, string> = {
  name: 'Название объекта',
  type_id: 'Тип объекта',
  division_id: 'Подразделение',
  subdivision_id: 'Отделение',
  facility_class: 'Класс объекта',
  communication_posts: 'Посты связи',
  city: 'Город',
  street: 'Улица',
  house_number: 'Номер дома',
  inn: 'ИНН',
  kz_size: 'Размер КЗ',
  has_transformer_in_kz: 'ТП в пределах КЗ',
  has_grounding_in_kz: 'Контур заземления в пределах КЗ',
  acceptance_act_number: 'Номер акта приемки помещения',
  rim_act_number: 'Номер акта РИМ',
  commissioning_act_number: 'Номер акта ввода',
  opening_permission_number: 'Номер разрешения на открытие',
  comments: 'Комментарии',
  address: 'Адрес',
  is_closed: 'Тип объекта (закрытый/открытый)',
};

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}

function ValidationErrors({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;

  return (
    <div className="ep-edit-facility-validation-errors">
      <div className="ep-edit-facility-validation-errors-icon">
        <AlertCircle size={20} />
      </div>
      <div>
        <div className="ep-edit-facility-validation-errors-title">
          Пожалуйста, исправьте ошибки:
        </div>
        <ul className="ep-edit-facility-validation-errors-list">
          {entries.map(([field, message]) => (
            <li key={field}>
              <span className="ep-edit-facility-validation-errors-field">{getFieldLabel(field)}</span>
              : {message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const EditFacilityPage = forwardRef<EditFacilityPageRef, EditFacilityPageProps>(({
  initialData,
  onSubmit,
  onCancel,
  isEditing = true,
  divisions = [],
  facilityTypes = [],
  communicationPosts = [],
  isLoadingData = false,
  fixedDivision = false,
  fixedSubdivision = false,
  validationErrors = {},
  hideSidebar = false,
  hideActions = false,
  hideTabs = false,
  initialTab = 'main',
}, ref) => {
  const [formData, setFormData] = useState<Partial<Facility>>({
    ...initialData,
    comments: initialData.comments || '',
    city: initialData.city || '',
    street: initialData.street || '',
  });
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [isSaving, setIsSaving] = useState(false);

  useImperativeHandle(ref, () => ({
    getFormData: () => formData,
  }), [formData]);

  const prevInitialId = React.useRef(initialData.id);
  useEffect(() => {
    if (initialData.id !== prevInitialId.current) {
      setFormData({
        ...initialData,
        comments: initialData.comments || '',
        city: initialData.city || '',
        street: initialData.street || '',
      });
      prevInitialId.current = initialData.id;
    }
  }, [initialData]);

  const availableSubdivisions = useMemo(() => {
    if (!formData.division?.id) return [];
    const division = divisions.find((d) => d.id === formData.division?.id);
    return division?.subdivisions || [];
  }, [formData.division?.id, divisions]);

  const showDocumentationTab = formData.is_closed === true;
  const showKzTab = formData.is_closed === true;

  const tabs = useMemo(() => {
    const allTabs: { id: TabId; label: string; icon: React.ReactNode; show: boolean }[] = [
      { id: 'main', label: 'Основное', icon: <Info size={16} />, show: true },
      { id: 'classification', label: 'Классификация', icon: <Tag size={16} />, show: true },
      { id: 'documentation', label: 'Документация', icon: <FileText size={16} />, show: showDocumentationTab },
      { id: 'kz', label: 'КЗ', icon: <Ruler size={16} />, show: showKzTab },
      { id: 'comments', label: 'Комментарии', icon: <MessageSquare size={16} />, show: true },
    ];
    return allTabs.filter(tab => tab.show);
  }, [showDocumentationTab, showKzTab]);

  const currentTab = hideTabs ? initialTab : activeTab;

  useEffect(() => {
    if (!hideTabs) {
      setActiveTab(initialTab);
    }
  }, [initialTab, hideTabs]);

  const handleChange = useCallback((data: Partial<Facility>) => {
    setFormData(prev => {
      const newData = { ...prev, ...data };
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
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSubmit, isSaving]);

  const getTypeDisplay = () => formData.type?.name || 'Не указан';
  const getDivisionDisplay = () => {
    const divisionName = formData.division?.name || '—';
    if (formData.subdivision?.name) return `${divisionName} / ${formData.subdivision.name}`;
    return divisionName;
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'main':
        return (
          <div className="ep-edit-facility-main-grid">
            <BasicInformation formData={formData} onChange={handleChange} isClosedFacility={formData.is_closed || false} />
            <Assignment
              formData={formData}
              onChange={handleChange}
              divisions={divisions}
              availableSubdivisions={availableSubdivisions}
              isLoading={isLoadingData}
              fixedDivision={fixedDivision}
              fixedSubdivision={fixedSubdivision}
            />
          </div>
        );
      case 'classification':
        return (
          <Classification
            formData={formData}
            onChange={handleChange}
            divisionId={formData.division?.id}
            facilityTypes={facilityTypes}
            communicationPosts={communicationPosts}
            isLoading={isLoadingData}
          />
        );
      case 'documentation':
        return <Documentation formData={formData} onChange={handleChange} />;
      case 'kz':
        return <KzInformation formData={formData} onChange={handleChange} />;
      case 'comments':
        return (
          <div className="ep-edit-facility-comments-wrapper">
            <label className="ep-edit-facility-comments-label">Комментарии</label>
            <EditComments
              value={formData.comments || ''}
              onChange={(value) => handleChange({ comments: value })}
              placeholder="Добавьте комментарии к объекту..."
              rows={6}
              disabled={isLoadingData || isSaving}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="ep-edit-facility-container">
      <form onSubmit={handleSubmit} className="ep-edit-facility-form">
        <div className={`ep-edit-facility-layout ${hideSidebar ? 'ep-edit-facility-layout--no-sidebar' : ''}`}>
          {!hideSidebar && (
            <div className="ep-edit-facility-sidebar">
              <div className="ep-edit-facility-sidebar-card">
                <div className="ep-edit-facility-sidebar-header">
                  <div className="ep-edit-facility-sidebar-header-top">
                    <button type="button" onClick={onCancel} className="ep-edit-facility-btn--icon ep-edit-facility-sidebar-back">
                      <ArrowLeft size={20} />
                    </button>
                    <div className="ep-edit-facility-sidebar-name">
                      {formData.name || (isEditing ? 'Без названия' : 'Новый объект')}
                    </div>
                  </div>
                  <div className="ep-edit-facility-sidebar-type">{getTypeDisplay()}</div>
                </div>
                <div className="ep-edit-facility-sidebar-group">
                  <div className="ep-edit-facility-sidebar-item">
                    <Building2 size={18} className="ep-edit-facility-sidebar-icon" />
                    <div className="ep-edit-facility-sidebar-item-content">
                      <span className="ep-edit-facility-sidebar-label">Подразделение</span>
                      <span className="ep-edit-facility-sidebar-value">{getDivisionDisplay()}</span>
                    </div>
                  </div>
                </div>
                <div className="ep-edit-facility-sidebar-group">
                  <div className="ep-edit-facility-sidebar-item">
                    <Tag size={18} className="ep-edit-facility-sidebar-icon" />
                    <div className="ep-edit-facility-sidebar-item-content">
                      <span className="ep-edit-facility-sidebar-label">Тип</span>
                      <span className="ep-edit-facility-sidebar-value">{getTypeDisplay()}</span>
                    </div>
                  </div>
                  {formData.is_closed && formData.facility_class && (
                    <div className="ep-edit-facility-sidebar-item">
                      <MapPin size={18} className="ep-edit-facility-sidebar-icon" />
                      <div className="ep-edit-facility-sidebar-item-content">
                        <span className="ep-edit-facility-sidebar-label">Класс</span>
                        <span className="ep-edit-facility-sidebar-value">{formData.facility_class}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="ep-edit-facility-main">
            <div className="ep-edit-facility-tabs-container">
              {!hideTabs && (
                <div className="ep-edit-facility-tabs-header">
                  <div className="ep-edit-facility-tabs-list">
                    {tabs.map(tab => (
                      <button
                        type="button"
                        key={tab.id}
                        className={`ep-edit-facility-tab-button ${currentTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {!hideActions && (
                    <div className="ep-edit-facility-tabs-actions">
                      <button type="button" onClick={onCancel} className="ep-edit-facility-btn ep-edit-facility-btn--secondary" disabled={isSaving}>
                        <X size={16} /> Отмена
                      </button>
                      <button type="submit" className="ep-edit-facility-btn ep-edit-facility-btn--success" disabled={isSaving}>
                        <Save size={16} /> {isSaving ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Добавить'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <ValidationErrors errors={validationErrors} />

              <div className="ep-edit-facility-tab-content">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
});

EditFacilityPage.displayName = 'EditFacilityPage';

export { EditFacilityPage };
export default EditFacilityPage;