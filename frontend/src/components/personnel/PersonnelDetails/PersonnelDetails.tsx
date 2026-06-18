// PersonnelDetails.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import { Header } from './sections/Header';
import { BasicInfo } from './sections/BasicInfo';
import { ContactInfo } from './sections/ContactInfo';
import { ResponsibilityInfo } from './sections/ResponsibilityInfo';
import { AssignedEquipment } from './sections/AssignedEquipment';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { updatePersonAsync, fetchPersonById, updatePerson } from '../../../store/slices/personnelSlice';
import { employeesApi } from '../../../api';
import { CommentsInfo } from './sections/CommentsInfo';
import { Employee, Equipment } from '../../../types';
import {
  Smartphone, Phone, Mail, Camera, Upload, Trash2, User, FileText, Shield, Package,
  ClipboardList, Pencil, X, Save
} from 'lucide-react';
import { Avatar, Button, message, Modal } from 'antd';
import { equipmentApi } from '../../../api/equipment';
import './PersonnelDetails.css';

// Импорты редактируемых карточек для основной информации
import { BasicInformationCard } from '../forms/EditPersonnelForm/sections/BasicInformationCard';
import { ContactInformationCard } from '../forms/EditPersonnelForm/sections/ContactInformationCard';
import { DatesCard } from '../forms/EditPersonnelForm/sections/DatesCard';
import { ShaWorkerCard } from '../forms/EditPersonnelForm/sections/ShaWorkerCard';
import { CommentsCard } from '../forms/EditPersonnelForm/sections/CommentsCard';
import { AffiliationCard } from '../forms/EditPersonnelForm/sections/AffiliationCard';

// Импорты для качественной характеристики
import { QualityTabContent, QualSubTabId } from '../QualitativeCharacteristics/QualityTabContent';

import { useAppPermissions } from '../../../api/utils/AppPermissionsContext';
import { isEditorShaWorker } from '../../../api/utils/permissions';
import { divisionsApi } from '../../../api/divisions';
import { Division } from '../../../types';

// Импорт SearchBar
import { SearchBar } from '../../common/SearchBar';

type TabId = 'main' | 'notes' | 'sha' | 'equipment' | 'qualitative';

export function PersonnelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  // Состояния для режимов редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingQualitative, setIsEditingQualitative] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('main');
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  // Состояние для поиска
  const [searchTerm, setSearchTerm] = useState('');

  // Состояния для данных
  const [editFormData, setEditFormData] = useState<Employee | null>(null);
  const [qualFormData, setQualFormData] = useState<Partial<Employee>>({});
  const [qualLoading, setQualLoading] = useState(false);
  const [qualActiveSubTab, setQualActiveSubTab] = useState<QualSubTabId>('basic');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [navigationState] = useState(location.state);

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;
  const { personnel, loading, error } = useSelector((state: RootState) => state.personnel);
  const person = personnel.find(p => p.id == id);
  const token = localStorage.getItem('accessToken');

  // Права доступа
  const { canEdit } = useAppPermissions();
  const canEditEmployee = useMemo(() =>
    permissions?.models?.Employee?.includes('change') ?? false, [permissions]);
  const canDeleteEmployee = useMemo(() =>
    permissions?.models?.Employee?.includes('delete') ?? false, [permissions]);
  const canViewEmployee = useMemo(() =>
    permissions?.models?.Employee?.includes('view') ?? false, [permissions]);
  const canViewEquipment = useMemo(() =>
    permissions?.models?.Equipment?.includes('view') ?? false, [permissions]);

  // Разграничение прав на редактирование
  const isRestricted = useMemo(() => isEditorShaWorker(), []);
  const canEditBasic = canEditEmployee && !isRestricted;
  const canEditShaComments = canEditEmployee;

  // Для качественной характеристики: редактирование доступно только при полных правах (нет фильтров)
  const { personnelFilters } = useAppPermissions();
  const canEditQualitative = useMemo(() => {
    const hasFilters = personnelFilters && Object.keys(personnelFilters).length > 0;
    return canEditEmployee && !hasFilters;
  }, [canEditEmployee, personnelFilters]);

  // Загружаем словари подразделений для AffiliationCard
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

  // Загружаем технику для проверки наличия
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

  // Удаляем старый useEffect, который перенаправлял с equipment на main
  // Теперь сброс редактирования обрабатывается в handleTabChange

  const getPhotoUrl = () => {
    if (!person?.photo_url) return null;
    if (person.photo_url.startsWith('blob:')) return person.photo_url;
    const separator = person.photo_url.includes('?') ? '&' : '?';
    return `${person.photo_url}${separator}t=${Date.now()}`;
  };

  // Обработчики фото
  const handlePhotoChange = async (file: File) => {
    if (!token || !id || !person) return;
    setUploadLoading(true);
    let previewUrl: string | null = null;
    try {
      previewUrl = URL.createObjectURL(file);
      const updatedPerson = { ...person, photo_url: previewUrl };
      await dispatch(updatePersonAsync({ token, id, personData: updatedPerson })).unwrap();
      await employeesApi.uploadPhoto(token, id, file);
      await dispatch(fetchPersonById({ token, id })).unwrap();
      message.success('Фото обновлено');
    } catch (err) {
      console.error(err);
      message.error('Ошибка загрузки фото');
      await dispatch(updatePersonAsync({ token, id, personData: person })).unwrap();
    } finally {
      setUploadLoading(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPhotoModalVisible(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (!token || !id) return;
    setUploadLoading(true);
    try {
      await employeesApi.deletePhoto(token, id);
      await dispatch(fetchPersonById({ token, id })).unwrap();
      message.success('Фото удалено');
    } catch (err) {
      message.error('Ошибка удаления фото');
    } finally {
      setUploadLoading(false);
      setPhotoModalVisible(false);
    }
  };

  // Навигация и действия
  const handleBack = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditFormData(null);
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

  // Редактирование основной информации
  const handleEditStart = () => {
    if (!person) return;
    setEditFormData({ ...person });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editFormData || !token || !id) return;

    // Валидация ShaWorker: если есть незавершённые записи (одно поле заполнено, другое – нет)
    if (editFormData.is_sha_worker && editFormData.sha_details) {
      const incomplete = editFormData.sha_details.equipment_conclusions.some(
        item =>
          (item.equipment_type.trim() !== '' || item.conclusion_number.trim() !== '') &&
          (item.equipment_type.trim() === '' || item.conclusion_number.trim() === '')
      );
      if (incomplete) {
        message.error('Заполните оба поля (Тип техники и Номер заключения) для каждой записи');
        return;
      }
    }

    try {
      const dataToSend = { ...editFormData };

      if (dataToSend.is_sha_worker && dataToSend.sha_details) {
        // Оставляем только те заключения, где заполнены оба поля
        const filteredConclusions = dataToSend.sha_details.equipment_conclusions.filter(
          item => item.equipment_type.trim() !== '' && item.conclusion_number.trim() !== ''
        );
        // Устанавливаем дату начала, если отсутствует
        const startDate = dataToSend.sha_details.start_date || new Date().toISOString().split('T')[0];

        dataToSend.sha_details = {
          ...dataToSend.sha_details,
          start_date: startDate,
          equipment_conclusions: filteredConclusions
        };
      } else {
        // Если сотрудник не ШаРаботник, очищаем поле
        dataToSend.sha_details = null;
      }

      await dispatch(updatePersonAsync({ token, id, personData: dataToSend })).unwrap();
      setIsEditing(false);
      setEditFormData(null);
      await dispatch(fetchPersonById({ token, id })).unwrap();
      message.success('Данные обновлены');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      if (err?.response?.data) {
        console.error('Детали ошибки:', err.response.data);
      }
      message.error('Ошибка сохранения');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  const handleEditFormChange = (data: Partial<Employee>) => {
    if (editFormData) {
      setEditFormData(prev => ({ ...prev!, ...data }));
    }
  };

  // Обработчики для ShaWorkerCard
  const handleShaWorkerChange = (shaWorker: Employee['sha_details']) => {
    if (!editFormData) return;
    setEditFormData(prev => ({
      ...prev!,
      sha_details: shaWorker ? { ...shaWorker, equipment_conclusions: [...(shaWorker?.equipment_conclusions || [])] } : null
    }));
  };

  const handleAddEquipment = () => {
    if (!editFormData || !editFormData.sha_details) return;
    const conclusions = editFormData.sha_details.equipment_conclusions;
    if (conclusions.length > 0) {
      const last = conclusions[conclusions.length - 1];
      if (last.equipment_type.trim() === '' && last.conclusion_number.trim() === '') {
        return;
      }
    }
    setEditFormData(prev => ({
      ...prev!,
      sha_details: {
        ...prev!.sha_details!,
        equipment_conclusions: [
          ...conclusions,
          { equipment_type: '', conclusion_number: '' }
        ]
      }
    }));
  };

  const handleRemoveEquipment = (index: number) => {
    if (!editFormData || !editFormData.sha_details) return;
    setEditFormData(prev => ({
      ...prev!,
      sha_details: {
        ...prev!.sha_details!,
        equipment_conclusions: prev!.sha_details!.equipment_conclusions.filter((_, i) => i !== index)
      }
    }));
  };

  const handleEquipmentChange = (index: number, field: 'equipment_type' | 'conclusion_number', value: string) => {
    if (!editFormData || !editFormData.sha_details) return;
    setEditFormData(prev => ({
      ...prev!,
      sha_details: {
        ...prev!.sha_details!,
        equipment_conclusions: prev!.sha_details!.equipment_conclusions.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  // Обработчики для качественной характеристики
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
      setIsEditingQualitative(false);
      setQualFormData({});
      await dispatch(fetchPersonById({ token, id })).unwrap();
      message.success('Характеристика обновлена');
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

  // Новая функция для переключения вкладок с автоматическим сбросом редактирования
  const handleTabChange = (tab: TabId) => {
    // Если активен режим редактирования основной информации – отменяем
    if (isEditing) {
      handleCancelEdit();
    }
    // Если активен режим редактирования качественной характеристики – отменяем
    if (isEditingQualitative) {
      handleCancelQualitative();
    }
    setActiveTab(tab);
  };

  // Общие обработчики для кнопок в панели вкладок
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
      handleSave();
    }
  };

  const handleCancelClick = () => {
    if (activeTab === 'qualitative') {
      handleCancelQualitative();
    } else {
      handleCancelEdit();
    }
  };

  if (loading) return <div className="equipment-loading">Загрузка...</div>;
  if (error) return <div className="equipment-error">{error}</div>;
  if (!person) return <div className="equipment-not-found"></div>;

  // Условия для отображения вкладок
  const showShaTab = person.is_sha_worker && person.sha_details;
  const showEquipmentTab = canViewEquipment && equipmentList.length > 0 && !isEditing;
  const showNotesTab = person.description && person.description.trim().length > 0;
  const showQualitativeTab = canViewEmployee;

  const fullPhotoUrl = getPhotoUrl();

  const isManagement = person.category === 'management';
  const isTopManagement = isManagement &&
    (person.position === 'Главный руководитель' ||
      person.position === 'Заместитель главного руководителя');
  const showDivisionField = !isManagement || (isManagement && !isTopManagement);

  // Проверка, нужно ли показывать поиск (не в режиме редактирования)
  const showSearch = !isEditing && !isEditingQualitative;

  const renderTabContent = () => {
    // Режим редактирования основной информации
    if (isEditing && editFormData) {
      switch (activeTab) {
        case 'main':
          return (
            <div className="personnel-edit-grid">
              <BasicInformationCard
                formData={editFormData}
                onChange={handleEditFormChange}
                token={token!}
                readOnly={!canEditBasic}
              />
              {showDivisionField && (
                <AffiliationCard
                  formData={editFormData}
                  divisions={divisions}
                  onChange={handleEditFormChange}
                  isTopManagement={isTopManagement}
                  showDivisionField={showDivisionField}
                  fixedDivision={false}
                  fixedSubdivision={false}
                  readOnly={!canEditBasic}
                />
              )}
              <ContactInformationCard
                formData={editFormData}
                onChange={handleEditFormChange}
                readOnly={!canEditBasic}
              />
              <DatesCard
                formData={editFormData}
                onChange={handleEditFormChange}
                readOnly={!canEditBasic}
              />
            </div>
          );
        case 'notes':
          return (
            <CommentsCard
              description={editFormData.description || ''}
              onChange={(desc) => handleEditFormChange({ description: desc })}
              readOnly={!canEditShaComments}
            />
          );
        case 'sha':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {editFormData.is_sha_worker && (
                <ShaWorkerCard
                  shaWorker={editFormData.sha_details || {
                    start_date: '',
                    access_level: '1',
                    equipment_conclusions: []
                  }}
                  onChange={handleShaWorkerChange}
                  onAddEquipment={handleAddEquipment}
                  onRemoveEquipment={handleRemoveEquipment}
                  onEquipmentChange={handleEquipmentChange}
                  readOnly={!canEditShaComments}
                />
              )}
            </div>
          );
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
    } else {
      // Режим просмотра
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
    }
  };

  const isAnyEditing = isEditing || isEditingQualitative;

  return (
    <div className="personnel-details-container">
      <Header title={person.full_name} onBack={handleBack} />

      <div className="personnel-details-layout">
        {/* Левая колонка */}
        <div className="personnel-sidebar">
          <div className="personnel-profile-card">
            <div className="personnel-profile-avatar">
              <div className="personnel-avatar-wrapper" onClick={() => canEditEmployee && setPhotoModalVisible(true)}>
                {fullPhotoUrl ? (
                  <img src={fullPhotoUrl} alt={person.full_name} className="personnel-avatar-image" />
                ) : (
                  <Avatar size={120} icon={<Camera size={40} />} style={{ backgroundColor: '#f0f0f0', color: '#a0a0a0' }} />
                )}
                {canEditEmployee && (
                  <div className="personnel-avatar-overlay">
                    <Camera size={24} color="white" />
                  </div>
                )}
              </div>
            </div>
            <div className="personnel-profile-name">{person.full_name}</div>
            <div className="personnel-profile-position">{person.position}</div>
            {canEditEmployee && !fullPhotoUrl && (
              <Button type="primary" size="small" icon={<Upload size={14} />} onClick={() => setPhotoModalVisible(true)} className="personnel-upload-button">
                Загрузить фото
              </Button>
            )}
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

        {/* Правая колонка с вкладками */}
        <div className="personnel-main">
          {/* SearchBar – отображается только в режиме просмотра */}
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
              <button className={`personnel-tab-button ${activeTab === 'main' ? 'active' : ''}`} onClick={() => handleTabChange('main')}>
                <User size={16} className="personnel-tab-icon" />
                Основное
              </button>
              {showQualitativeTab && (
                <button className={`personnel-tab-button ${activeTab === 'qualitative' ? 'active' : ''}`} onClick={() => handleTabChange('qualitative')}>
                  <ClipboardList size={16} className="personnel-tab-icon" />
                  Характеристика
                </button>
              )}
              {showShaTab && (
                <button className={`personnel-tab-button ${activeTab === 'sha' ? 'active' : ''}`} onClick={() => handleTabChange('sha')}>
                  <Shield size={16} className="personnel-tab-icon" />
                  ШР
                </button>
              )}
              {showEquipmentTab && (
                <button className={`personnel-tab-button ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => handleTabChange('equipment')}>
                  <Package size={16} className="personnel-tab-icon" />
                  Техника
                </button>
              )}
              {showNotesTab && (
                <button className={`personnel-tab-button ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => handleTabChange('notes')}>
                  <FileText size={16} className="personnel-tab-icon" />
                  Примечания
                </button>
              )}

              {/* Кнопки действий справа */}
              <div className="personnel-tabs-actions">
                {!isAnyEditing && activeTab !== 'equipment' ? (
                  // Режим просмотра – кнопка Редактировать (не показываем на вкладке "Техника")
                  (activeTab === 'qualitative' ? canEditQualitative : canEditEmployee) && (
                    <button
                      onClick={handleEditClick}
                      className="personnel-tabs-action-btn personnel-tabs-action-btn-blue"
                    >
                      <Pencil size={14} />
                      <span>Редактировать</span>
                    </button>
                  )
                ) : isAnyEditing ? (
                  // Режим редактирования – кнопки Сохранить и Отмена
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
            </div>
            <div className="personnel-tab-content">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Модалка для фото */}
      <Modal
        title="Фото сотрудника"
        open={photoModalVisible}
        onCancel={() => setPhotoModalVisible(false)}
        footer={[
          fullPhotoUrl && canEditEmployee && (
            <Button key="delete" danger icon={<Trash2 size={14} />} onClick={handlePhotoRemove} loading={uploadLoading}>
              Удалить
            </Button>
          ),
          canEditEmployee && (
            <Button key="upload" type="primary" icon={<Upload size={14} />} onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handlePhotoChange(file);
              };
              input.click();
            }}>
              {fullPhotoUrl ? 'Заменить' : 'Загрузить'}
            </Button>
          ),
          <Button key="back" onClick={() => setPhotoModalVisible(false)}>Закрыть</Button>,
        ].filter(Boolean)}
      >
        <div style={{ textAlign: 'center' }}>
          {fullPhotoUrl && <img src={fullPhotoUrl} alt={person.full_name} style={{ maxWidth: '100%', maxHeight: '60vh' }} />}
        </div>
      </Modal>

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление сотрудника"
          message="Вы уверены, что хотите удалить этого сотрудника? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}