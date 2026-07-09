// FacilityDetails.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Pencil, Trash2, Info, FileText, Ruler, MessageSquare, Package, Save, X, Tag } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Facility } from '../../../types';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { updateFacility, deleteFacility } from '../../../store/slices/facilitiesSlice';
import { facilitiesApi, authApi, equipmentApi, divisionsApi, communicationPostsApi } from '../../../api';
import { canEdit } from '../../../api/utils/permissions';
import { FacilitySidebar } from './sections/FacilitySidebar';
import { SearchBar } from '../../common/SearchBar';

// Секции для просмотра
import { FacilityMainInfo } from './sections/FacilityMainInfo';
import { DocumentationCard } from './sections/DocumentationCard';
import { KzInfoCard } from './sections/KzInfoCard';
import { CommentsCard } from './sections/CommentsCard';
import { AssignedEquipment } from './sections/AssignedEquipment';

// Секции для редактирования (переиспользуем из EditFacilityPage)
import { EditFacilityPage, EditFacilityPageRef } from '../forms/EditFacilityPage/EditFacilityPage';

import './FacilityForm.css';

type TabId = 'main' | 'classification' | 'documentation' | 'kz' | 'comments' | 'equipment';

export function FacilityDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = localStorage.getItem('accessToken');

  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('main');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipmentCount, setEquipmentCount] = useState<number | null>(null);

  // === РЕДАКТИРОВАНИЕ НА МЕСТЕ ===
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Facility> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previousTab, setPreviousTab] = useState<TabId>('main');

  // === СПРАВОЧНИКИ ДЛЯ РЕДАКТИРОВАНИЯ ===
  const [divisions, setDivisions] = useState<any[]>([]);
  const [facilityTypes, setFacilityTypes] = useState<any[]>([]);
  const [communicationPosts, setCommunicationPosts] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const isGlobalView = authApi.getGlobalView();
  const canEditFacility = canEdit('facilities');

  // Ref для получения данных из дочерней формы
  const editFormRef = useRef<EditFacilityPageRef>(null);

  // Загрузка данных объекта
  useEffect(() => {
    const fetchFacility = async () => {
      if (!id || !token) return;
      try {
        setIsLoading(true);
        const data = await facilitiesApi.getFacilityById(id, token);
        setFacility(data);
      } catch (err) {
        console.error('Error fetching facility:', err);
        setError('Не удалось загрузить данные объекта');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFacility();
  }, [id, token]);

  // Загрузка количества техники на объекте
  useEffect(() => {
    const fetchEquipmentCount = async () => {
      if (!id || !token) return;
      try {
        const data = await equipmentApi.getEquipment(token, { facility: id.toString() });
        setEquipmentCount(data?.length || 0);
      } catch (err) {
        console.error('Ошибка загрузки техники:', err);
        setEquipmentCount(0);
      }
    };
    fetchEquipmentCount();
  }, [id, token]);

  // Загрузка справочников для редактирования
  useEffect(() => {
    const fetchDictionaries = async () => {
      if (!token || !isEditing) return;
      try {
        setIsLoadingData(true);
        const [divisionsData, facilityTypesData, communicationPostsData] = await Promise.all([
          divisionsApi.getDivisions({ token }),
          facilitiesApi.getFacilityTypes(token).catch(() => []),
          communicationPostsApi.getCommunicationPosts({ token }).catch(() => [])
        ]);
        setDivisions(divisionsData);
        setFacilityTypes(facilityTypesData);
        setCommunicationPosts(communicationPostsData);
      } catch (err) {
        console.error('Error loading dictionaries:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchDictionaries();
  }, [token, isEditing]);

  // Восстановление активной вкладки из location.state
  useEffect(() => {
    const state = location.state as { activeTab?: TabId } | undefined;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);

  // === НАВИГАЦИЯ НАЗАД (ПОЛНАЯ ВЕРСИЯ) ===
  const handleBack = () => {
    if (isEditing) {
      handleCancelEdit();
      return;
    }
    const state = location.state;
    const currentSearchParams = new URLSearchParams(location.search);
    const typeFilter = currentSearchParams.get('type');
    const classFilter = currentSearchParams.get('class');

    if (state?.from === 'map-view' && state?.returnPath) {
      navigate(state.returnPath);
      return;
    }

    if (state?.from === 'facilities-section') {
      let backUrl = state.divisionId
        ? `/divisions/${state.divisionId}/facilities`
        : `/facilities`;
      const params = new URLSearchParams();
      if (state.activeTab && state.activeTab !== 'all') params.append('tab', state.activeTab);
      if (state.subdivisionId) params.append('subdivision', state.subdivisionId);
      if (state.filterType && state.filterType !== 'all') params.append('type', state.filterType.toString());
      if (state.facilityClassFilter && state.facilityClassFilter !== 'all') params.append('class', state.facilityClassFilter);
      const queryString = params.toString();
      if (queryString) backUrl += `?${queryString}`;
      navigate(backUrl, { state: { activeTab: state.activeTab, filterType: state.filterType, facilityClassFilter: state.facilityClassFilter, viewType: state.viewType, subdivisionId: state.subdivisionId, divisionId: state.divisionId } });
    } else if (isGlobalView || !facility?.division?.id) {
      let backUrl = `/facilities`;
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (classFilter) params.append('class', classFilter);
      const queryString = params.toString();
      if (queryString) backUrl += `?${queryString}`;
      navigate(backUrl);
    } else if (facility?.division?.id) {
      let backUrl = `/divisions/${facility.division.id}/facilities`;
      const params = new URLSearchParams();
      if (facility.subdivision?.id) params.append('subdivision', facility.subdivision.id);
      if (typeFilter) params.append('type', typeFilter);
      if (classFilter) params.append('class', classFilter);
      const queryString = params.toString();
      if (queryString) backUrl += `?${queryString}`;
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  // === РЕДАКТИРОВАНИЕ НА МЕСТЕ ===
  const handleEditStart = () => {
    if (!facility) return;
    setEditFormData({ ...facility });
    setIsEditing(true);
    setPreviousTab(activeTab);
    setDivisions([]);
    setFacilityTypes([]);
    setCommunicationPosts([]);
    setIsLoadingData(true);
  };

  const handleSave = async () => {
    const formData = editFormRef.current?.getFormData();
    if (!formData || !token || !id) return;

    setIsSaving(true);
    setError(null);
    try {
      const dataToSend = {
        ...formData,
        type_id: formData.type?.id || null,
        communication_post_ids: formData.communication_posts?.map(p => p.id) || [],
        facility_class: formData.facility_class || null,
        division_id: formData.division?.id || null,
        subdivision_id: formData.subdivision?.id || null,
      };
      await facilitiesApi.updateFacility(id, dataToSend, token);
      const updated = await facilitiesApi.getFacilityById(id, token);
      setFacility(updated);
      dispatch(updateFacility(updated));
      setIsEditing(false);
      setEditFormData(null);
      setActiveTab(previousTab);
    } catch (err: any) {
      console.error('Error updating facility:', err);
      setError('Не удалось сохранить изменения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
    setActiveTab(previousTab);
  };

  // === УДАЛЕНИЕ ===
  const handleDelete = () => setShowDeleteModal(true);
  const handleConfirmDelete = async () => {
    if (!facility?.id) return;
    try {
      await facilitiesApi.deleteFacility(facility.id);
      dispatch(deleteFacility(facility.id));
      const state = location.state;
      if (state?.from === 'map-view' && state?.returnPath) {
        navigate(state.returnPath);
        return;
      }
      if (state?.from === 'facilities-section') {
        let backUrl = state.divisionId ? `/divisions/${state.divisionId}/facilities` : `/facilities`;
        const params = new URLSearchParams();
        if (state.subdivisionId) params.append('subdivision', state.subdivisionId);
        if (state.activeTab && state.activeTab !== 'all') params.append('tab', state.activeTab);
        const queryString = params.toString();
        if (queryString) backUrl += `?${queryString}`;
        navigate(backUrl);
      } else if (isGlobalView || !facility?.division?.id) {
        navigate('/facilities');
      } else if (facility?.division?.id) {
        let backUrl = `/divisions/${facility.division.id}/facilities`;
        if (facility.subdivision?.id) backUrl += `?subdivision=${facility.subdivision.id}`;
        navigate(backUrl);
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error('Error deleting facility:', err);
      setError('Не удалось удалить объект');
    }
  };

  // Определение видимости вкладок
  const showDocumentationTab = facility?.is_closed;
  const showKzTab = facility?.is_closed;
  // Вкладка Комментарии показывается всегда в режиме редактирования, иначе только если есть комментарии
  const showCommentsTab = isEditing || (facility?.comments && facility.comments.trim() !== '');
  const showEquipmentTab = (equipmentCount ?? 0) > 0;
  // Вкладка Классификация показывается только в режиме редактирования
  const showClassificationTab = isEditing;

  const allTabs: { id: TabId; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'main', label: 'Основное', icon: <Info size={16} />, show: true },
    { id: 'classification', label: 'Классификация', icon: <Tag size={16} />, show: showClassificationTab },
    { id: 'documentation', label: 'Документация', icon: <FileText size={16} />, show: showDocumentationTab },
    { id: 'kz', label: 'КЗ', icon: <Ruler size={16} />, show: showKzTab },
    { id: 'comments', label: 'Комментарии', icon: <MessageSquare size={16} />, show: showCommentsTab },
    { id: 'equipment', label: 'Техника', icon: <Package size={16} />, show: showEquipmentTab },
  ];

  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => {
      if (isEditing && tab.id === 'equipment') return false;
      return tab.show;
    });
  }, [allTabs, isEditing]);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  const renderTabContent = () => {
    if (!facility) return null;

    switch (activeTab) {
      case 'main':
        return <FacilityMainInfo facility={facility} searchTerm={searchTerm} />;
      case 'documentation':
        return <DocumentationCard facility={facility} searchTerm={searchTerm} />;
      case 'kz':
        return <KzInfoCard facility={facility} searchTerm={searchTerm} />;
      case 'comments':
        return <CommentsCard facility={facility} searchTerm={searchTerm} />;
      case 'equipment':
        return <AssignedEquipment facility={facility} searchTerm={searchTerm} />;
      // Вкладка classification не имеет отдельного компонента для просмотра,
      // поэтому при просмотре она не показывается (show: false), а при редактировании
      // её содержимое рендерится через EditFacilityPage.
      default:
        return null;
    }
  };

  if (isLoading) return <div className="facility-details-loading">Загрузка данных объекта...</div>;
  if (error && !isEditing) return <div className="facility-details-error">{error}</div>;
  if (!facility) return <div className="facility-details-not-found">Объект не найден</div>;

  return (
    <div className="facility-details-container">
      <div className="facility-details-layout">
        <div className="facility-details-sidebar">
          <FacilitySidebar facility={facility} onBack={handleBack} />
        </div>

        <div className="facility-details-main">
          {!isEditing && (
            <div className="facility-details-search-container">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Поиск по данным объекта..."
              />
            </div>
          )}

          <div className="facility-details-tabs-container">
            <div className="facility-details-tabs-header">
              <div className="facility-details-tabs-list">
                {visibleTabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`facility-details-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="facility-details-tabs-actions">
                {!isEditing ? (
                  <>
                    {canEditFacility && (
                      <button onClick={handleEditStart} className="facility-details-btn facility-details-btn--primary">
                        <Pencil size={16} />
                        Редактировать
                      </button>
                    )}
                    {canEditFacility && (
                      <button onClick={handleDelete} className="facility-details-btn facility-details-btn--danger">
                        <Trash2 size={16} />
                        Удалить
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="facility-details-btn facility-details-btn--secondary"
                      disabled={isSaving}
                    >
                      <X size={16} />
                      Отмена
                    </button>
                    <button
                      onClick={handleSave}
                      className="facility-details-btn facility-details-btn--success"
                      disabled={isSaving}
                    >
                      <Save size={16} />
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="facility-details-tab-content">
              {!isEditing ? (
                renderTabContent()
              ) : (
                <EditFacilityPage
                  ref={editFormRef}
                  initialData={editFormData || facility}
                  onSubmit={() => {}} // не используется, кнопки в родителе
                  onCancel={handleCancelEdit}
                  isEditing={true}
                  divisions={divisions}
                  facilityTypes={facilityTypes}
                  communicationPosts={communicationPosts}
                  isLoadingData={isLoadingData}
                  hideSidebar={true}
                  hideActions={true}
                  hideTabs={true}
                  initialTab={activeTab}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="ep-error" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление объекта"
          message="Вы уверены, что хотите удалить этот объект? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}