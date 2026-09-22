// PersonnelDetails.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import { Header } from './sections/Header';
import { BasicInfo } from './sections/BasicInfo';
import { ResponsibilityInfo } from './sections/ResponsibilityInfo';
import { AssignedEquipment } from './sections/AssignedEquipment';
import { ConfirmationModal } from '../../modals/ConfirmationModal';
import { updatePersonAsync, fetchPersonById, updatePerson } from '../../../store/slices/personnelSlice';
import { employeesApi } from '../../../api';
import { CommentsInfo } from './sections/CommentsInfo';
import { Employee, Equipment } from '../../../types';
import {
  Smartphone, Phone, Mail, Trash2, User, FileText, Shield, Package,
  ClipboardList, Pencil, X, Save
} from 'lucide-react';
import { message } from 'antd';
import { equipmentApi } from '../../../api/equipment';
import './PersonnelDetails.css';

import { EditPersonnelForm, EditPersonnelFormRef } from '../forms/EditPersonnelForm/EditPersonnelForm';
import { QualityTabContent, QualSubTabId } from '../QualitativeCharacteristics/QualityTabContent';
import { useAppPermissions } from '../../../api/utils/AppPermissionsContext';
import { isEditorShaWorker } from '../../../api/utils/permissions';
import { divisionsApi } from '../../../api/divisions';
import { Division } from '../../../types';
import { SearchBar } from '../../common/SearchBar';
import { PhotoCard } from './sections/PhotoCard';
import EmployeeSchedule from './sections/EmployeeSchedule';
import { EVENT_COLORS, EVENT_LABELS, EVENT_SHORT_LABELS } from '../config/scheduleEvents';

type TabId = 'main' | 'notes' | 'sha' | 'equipment' | 'qualitative';

// Вкладки, которые поддерживаются формой редактирования (кроме "Характеристика" и "Техника")
const EDITABLE_TABS: TabId[] = ['main', 'sha', 'notes'];

// Маркеры фильтров — те же, что приходят с бэкенда
const USER_DIVISION_MARKER = '__user_division_id__';
const USER_SUBDIVISION_MARKER = '__user_subdivision_id__';

/**
 * Сравнение id, приходящих как строки или числа.
 */
const idsEqual = (a: unknown, b: unknown): boolean => {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
};

export function PersonnelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingQualitative, setIsEditingQualitative] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('main');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [qualFormData, setQualFormData] = useState<Partial<Employee>>({});
  const [qualLoading, setQualLoading] = useState(false);
  const [qualActiveSubTab, setQualActiveSubTab] = useState<QualSubTabId>('basic');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [navigationState] = useState(location.state);

  const formRef = useRef<EditPersonnelFormRef>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;
  const { personnel, loading, error } = useSelector((state: RootState) => state.personnel);
  const person = personnel.find(p => p.id == id);
  const token = localStorage.getItem('accessToken');

  // Права на уровне моделей
  const canEditEmployee = useMemo(() =>
    permissions?.models?.Employee?.includes('change') ?? false, [permissions]);
  const canDeleteEmployee = useMemo(() =>
    permissions?.models?.Employee?.includes('delete') ?? false, [permissions]);
  const canViewEmployee = useMemo(() =>
    permissions?.models?.Employee?.includes('view') ?? false, [permissions]);
  const canViewEquipment = useMemo(() =>
    permissions?.models?.Equipment?.includes('view') ?? false, [permissions]);

  const isRestricted = useMemo(() => isEditorShaWorker(), []);
  const canEditBasic = canEditEmployee && !isRestricted;
  const canEditShaComments = canEditEmployee;

  // Права и фильтры для графика
  const { canAccessPage, personnelFilters, scheduleFilters } = useAppPermissions();
  const canViewSchedule = canAccessPage('ScheduleEvent', 'view');
  const canEditSchedule = canAccessPage('ScheduleEvent', 'change');

  const canEditQualitative = useMemo(() => {
    const hasFilters = personnelFilters && Object.keys(personnelFilters).length > 0;
    return canEditEmployee && !hasFilters;
  }, [canEditEmployee, personnelFilters]);

  /**
   * Попадает ли текущий сотрудник в read-область графика.
   *
   * Логика зеркалит бэкенд (RoleBasedFilterMixin._build_role_q):
   *  - нет права ScheduleEvent.view → false;
   *  - нет scheduleFilters → видит всех → true;
   *  - фильтр `employee__division_id` = USER_DIVISION_MARKER → сравнить с подразделением пользователя;
   *  - фильтр `employee__subdivision_id` = USER_SUBDIVISION_MARKER → сравнить с отделением пользователя;
   *  - статические значения → сравнить с полями сотрудника.
   */
  const isPersonInScheduleScope = useMemo(() => {
    if (!canViewSchedule) return false;
    if (!person) return false;

    if (!scheduleFilters || Object.keys(scheduleFilters).length === 0) {
      return true;
    }

    const userDivisionId = user?.division_info?.id ?? null;
    const userSubdivisionId = user?.division_info?.subdivision?.id ?? null;

    const divFilter = (scheduleFilters as Record<string, any>).employee__division_id;
    const subFilter = (scheduleFilters as Record<string, any>).employee__subdivision_id;

    if (divFilter !== undefined && divFilter !== null) {
      let expected: unknown = divFilter;
      if (divFilter === USER_DIVISION_MARKER) {
        expected = userDivisionId;
      }
      if (expected === null || expected === undefined) return false;
      if (!idsEqual(person.division?.id, expected)) return false;
    }

    if (subFilter !== undefined && subFilter !== null) {
      let expected: unknown = subFilter;
      if (subFilter === USER_SUBDIVISION_MARKER) {
        expected = userSubdivisionId;
      }
      if (expected === null || expected === undefined) return false;
      if (!idsEqual(person.subdivision?.id, expected)) return false;
    }

    return true;
  }, [canViewSchedule, person, scheduleFilters, user]);

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const data = await divisionsApi.getDivisions(token);
        setDivisions(data);
      } catch (err) {
        console.error('Failed to load divisions:', err);
      }
    };
    if (isEditing) {
      fetchDivisions();
    }
  }, [isEditing, token]);

  useEffect(() => {
    if (id && token && !person) {
      dispatch(fetchPersonById({ token, id }));
    }
  }, [id, token, person, dispatch]);

  useEffect(() => {
    if (!id || !token || !canViewEquipment) return;
    const fetchEquipment = async () => {
      try {
        const data = await equipmentApi.getEquipmentByEmployee(token, id);
        setEquipmentList(data);
      } catch (err) {
        console.error('Failed to load equipment:', err);
      }
    };
    fetchEquipment();
  }, [id, token, canViewEquipment]);

  // Функции для работы с фото (передаются в PhotoCard)
  const handlePhotoChange = async (file: File) => {
    if (!token || !id || !person) return;
    let previewUrl: string | null = null;
    try {
      previewUrl = URL.createObjectURL(file);
      const updatedPerson = { ...person, photo_url: previewUrl };
      await dispatch(updatePersonAsync({ token, id, personData: updatedPerson })).unwrap();
      await employeesApi.uploadPhoto(token, id, file);
      await dispatch(fetchPersonById({ token, id })).unwrap();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  };

  const handlePhotoRemove = async () => {
    if (!token || !id) return;
    try {
      await employeesApi.deletePhoto(token, id);
      await dispatch(fetchPersonById({ token, id })).unwrap();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleBack = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    if (navigationState?.from) {
      navigate(navigationState.from, { state: navigationState });
    } else {
      navigate(-1);
    }
  };

  const handleConfirmDelete = async () => {
    if (token && id) {
      await employeesApi.deletePerson(token, id);
      navigate(navigationState?.from || '/personnel');
    }
  };

  const handleDelete = () => setShowDeleteModal(true);

  const handleEditStart = () => {
    if (!person) return;
    setIsEditing(true);
  };

  const handleEditSave = async (updatedPerson: Employee) => {
    if (!token || !id) return;
    try {
      await dispatch(updatePersonAsync({ token, id, personData: updatedPerson })).unwrap();
      await dispatch(fetchPersonById({ token, id })).unwrap();
      message.success('Данные обновлены');
      setIsEditing(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      message.error('Ошибка сохранения');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleEditQualitative = () => {
    if (!person) return;
    setQualFormData({ ...person });
    setIsEditingQualitative(true);
  };

  const handleSaveQualitative = async () => {
    if (!qualFormData || !token || !id) return;
    setQualLoading(true);
    try {
      const updated = await employeesApi.updatePerson(token, id, qualFormData);
      dispatch(updatePerson(updated));
      await dispatch(fetchPersonById({ token, id })).unwrap();
      message.success('Характеристика обновлена');
      setIsEditingQualitative(false);
      setQualFormData({});
    } catch (err) {
      console.error(err);
      message.error('Ошибка сохранения');
    } finally {
      setQualLoading(false);
    }
  };

  const handleCancelQualitative = () => {
    setIsEditingQualitative(false);
    setQualFormData({});
  };

  const handleQualitativeChange = (field: keyof Employee, value: string) => {
    setQualFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (tab: TabId) => {
    if (isEditing && !EDITABLE_TABS.includes(tab)) {
      handleCancelEdit();
    }
    if (isEditingQualitative && tab !== 'qualitative') {
      handleCancelQualitative();
    }
    setActiveTab(tab);
  };

  const handleEditClick = () => {
    if (activeTab === 'qualitative') {
      handleEditQualitative();
    } else {
      handleEditStart();
    }
  };

  const handleSaveClick = () => {
    if (activeTab === 'qualitative') {
      handleSaveQualitative();
    } else {
      formRef.current?.submitForm();
    }
  };

  const handleCancelClick = () => {
    if (activeTab === 'qualitative') {
      handleCancelQualitative();
    } else {
      formRef.current?.cancelForm();
    }
  };

  if (loading) return <div className="equipment-loading">Загрузка...</div>;
  if (error) return <div className="equipment-error">{error}</div>;
  if (!person) return <div className="equipment-not-found"></div>;

  const showShaTab = person.is_sha_worker && person.sha_details;
  const showEquipmentTab = canViewEquipment && equipmentList.length > 0 && !isEditing;
  const showNotesTab = person.description && person.description.trim().length > 0;
  const showQualitativeTab = canViewEmployee;

  // Блок графика показываем, если:
  //  - есть право на просмотр сотрудников,
  //  - есть право ScheduleEvent.view,
  //  - и сам сотрудник попадает в read-область графика роли.
  const showSchedule = canViewEmployee && isPersonInScheduleScope;

  const showSearch = !isEditing && !isEditingQualitative;
  const isAnyEditing = isEditing || isEditingQualitative;

  const mapTabToFormTab = (tab: TabId): 'main' | 'affiliation' | 'contacts' | 'dates' | 'sha' | 'comments' => {
    switch (tab) {
      case 'main': return 'main';
      case 'sha': return 'sha';
      case 'notes': return 'comments';
      default: return 'main';
    }
  };

  const renderTabContent = () => {
    if (isEditing && EDITABLE_TABS.includes(activeTab)) {
      return (
        <EditPersonnelForm
          ref={formRef}
          key={`edit-${person.id}`}
          person={person}
          onSubmit={handleEditSave}
          onCancel={handleCancelEdit}
          isCreateMode={false}
          fixedDivision={false}
          fixedSubdivision={false}
          canEditBasic={canEditBasic}
          canEditShaComments={canEditShaComments}
          activeTab={mapTabToFormTab(activeTab)}
        />
      );
    }

    switch (activeTab) {
      case 'main':
        return <BasicInfo person={person} searchTerm={searchTerm} />;
      case 'notes':
        return <CommentsInfo person={person} searchTerm={searchTerm} />;
      case 'sha':
        return <ResponsibilityInfo person={person} searchTerm={searchTerm} />;
      case 'equipment':
        return <AssignedEquipment person={person} id={id!} hasAccess={canViewEquipment} searchTerm={searchTerm} />;
      case 'qualitative':
        return (
          <QualityTabContent
            person={person}
            isEditing={isEditingQualitative}
            formData={qualFormData}
            canEdit={canEditQualitative}
            onChange={handleQualitativeChange}
            activeSubTab={qualActiveSubTab}
            onSubTabChange={setQualActiveSubTab}
            searchTerm={searchTerm}
          />
        );
      default:
        return null;
    }
  };

  const showActions = !(isEditing && activeTab === 'equipment');

  return (
    <div className="personnel-details-container">
      <Header title={person.full_name} onBack={handleBack} />

      <div className="personnel-details-layout">
        {/* Левая колонка */}
        <div className="personnel-sidebar">
          <div className="personnel-profile-card">
            <PhotoCard
              person={person}
              onPhotoChange={handlePhotoChange}
              onPhotoRemove={handlePhotoRemove}
              canEditEmployee={canEditEmployee}
              editable={!isRestricted}
            />
          </div>

          <div className="personnel-contact-card">
            <div className="personnel-contact-card-title">Контакты</div>
            <div className="info-item-personel">
              <Smartphone className="info-item-icon" />
              <div>
                <div className="info-item-label">Личный телефон</div>
                <div className="info-item-value">{person.personal_phone || '—'}</div>
              </div>
            </div>
            <div className="info-item-personel">
              <Phone className="info-item-icon" />
              <div>
                <div className="info-item-label">Рабочий телефон</div>
                <div className="info-item-value">{person.work_phone || '—'}</div>
              </div>
            </div>
            {person.email && (
              <div className="info-item-personel">
                <Mail className="info-item-icon" />
                <div>
                  <div className="info-item-label">Email</div>
                  <div className="info-item-value">{person.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка */}
        <div className="personnel-main">
          {showSearch && (
            <div className="personnel-details-search-container">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Поиск по данным сотрудника..."
              />
            </div>
          )}

          <div className={`personnel-tabs-container ${isAnyEditing ? 'editing' : ''}`}>
            <div className="personnel-tabs-header">
              {/* Вкладки */}
              <button
                className={`personnel-tab-button ${activeTab === 'main' ? 'active' : ''}`}
                onClick={() => handleTabChange('main')}
              >
                <User size={16} className="personnel-tab-icon" />
                Основное
              </button>
              {showQualitativeTab && (
                <button
                  className={`personnel-tab-button ${activeTab === 'qualitative' ? 'active' : ''}`}
                  onClick={() => handleTabChange('qualitative')}
                >
                  <ClipboardList size={16} className="personnel-tab-icon" />
                  Характеристика
                </button>
              )}
              {showShaTab && (
                <button
                  className={`personnel-tab-button ${activeTab === 'sha' ? 'active' : ''}`}
                  onClick={() => handleTabChange('sha')}
                >
                  <Shield size={16} className="personnel-tab-icon" />
                  ШР
                </button>
              )}
              {showEquipmentTab && (
                <button
                  className={`personnel-tab-button ${activeTab === 'equipment' ? 'active' : ''}`}
                  onClick={() => handleTabChange('equipment')}
                >
                  <Package size={16} className="personnel-tab-icon" />
                  Техника
                </button>
              )}
              {showNotesTab && (
                <button
                  className={`personnel-tab-button ${activeTab === 'notes' ? 'active' : ''}`}
                  onClick={() => handleTabChange('notes')}
                >
                  <FileText size={16} className="personnel-tab-icon" />
                  Комментарии
                </button>
              )}

              {/* Кнопки действий */}
              {showActions && (
                <div className="personnel-tabs-actions">
                  {!isAnyEditing && activeTab !== 'equipment' ? (
                    (activeTab === 'qualitative' ? canEditQualitative : canEditEmployee) && (
                      <button
                        onClick={handleEditClick}
                        className="personnel-tabs-action-btn personnel-tabs-action-btn-blue"
                      >
                        <Pencil size={14} />
                        <span>Редактировать</span>
                      </button>
                    )
                  ) : isEditing ? (
                    <>
                      <button
                        onClick={handleCancelClick}
                        className="personnel-tabs-action-btn personnel-tabs-action-btn-gray"
                      >
                        <X size={14} />
                        <span>Отмена</span>
                      </button>
                      <button
                        onClick={handleSaveClick}
                        className="personnel-tabs-action-btn personnel-tabs-action-btn-green"
                      >
                        <Save size={14} />
                        <span>Сохранить</span>
                      </button>
                    </>
                  ) : isEditingQualitative && activeTab === 'qualitative' ? (
                    <>
                      <button
                        onClick={handleCancelClick}
                        className="personnel-tabs-action-btn personnel-tabs-action-btn-gray"
                      >
                        <X size={14} />
                        <span>Отмена</span>
                      </button>
                      <button
                        onClick={handleSaveClick}
                        className="personnel-tabs-action-btn personnel-tabs-action-btn-green"
                      >
                        <Save size={14} />
                        <span>Сохранить</span>
                      </button>
                    </>
                  ) : null}

                  {canDeleteEmployee && (
                    <button
                      onClick={handleDelete}
                      className="personnel-tabs-action-btn personnel-tabs-action-btn-red"
                    >
                      <Trash2 size={14} />
                      <span>Удалить</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="personnel-tab-content">
              {renderTabContent()}
            </div>
          </div>

          {/* Блок с графиком сотрудника (ниже вкладок) */}
          {showSchedule && (
            <div className="employee-schedule-wrapper">
              <EmployeeSchedule
                employee={person}
                token={token!}
                eventColors={EVENT_COLORS}
                eventLabels={EVENT_LABELS}
                eventShortLabels={EVENT_SHORT_LABELS}
                canEdit={canEditSchedule}
              />
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmationModal
          type="delete"
          title="Удаление сотрудника"
          message="Вы уверены, что хотите удалить этого сотрудника? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}