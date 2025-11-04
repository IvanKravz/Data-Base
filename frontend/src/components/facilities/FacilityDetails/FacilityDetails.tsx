import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Facility } from '../../../types';
import { BasicInfo } from './sections/BasicInfo';
import { ResponsiblePersons } from './sections/ResponsiblePersons';
import { AssignedEquipment } from './sections/AssignedEquipment';
import { CommentsCard } from './sections/CommentsCard';
import { DocumentationCard } from './sections/DocumentationCard';
import { KzInfoCard } from './sections/KzInfoCard';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { updateFacility, deleteFacility } from '../../../store/slices/facilitiesSlice';
import { facilitiesApi, authApi, divisionsApi } from '../../../api';
import './FacilityForm.css';
import { EditFacilityForm } from '../forms/EditFacilityForm/EditFacilityForm';
import { ClassificationtFacility } from './sections/ClassificationtFacility';
import { getPermissions } from '../../../api/utils/permissions'; // Добавляем импорт

export function FacilityDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('accessToken');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);

  // Получаем режим просмотра из authApi
  const isGlobalView = authApi.getGlobalView();

  // Проверка прав доступа для редактирования объектов
  const canEditFacility = useMemo(() => {
    const permissions = getPermissions();
    // Предполагаем, что права для объектов находятся в permissions.facilities
    if (permissions && permissions.facilities) {
      return permissions.facilities.can_edit;
    }
    // Если нет специфичных прав для объектов, используем права для сотрудников как fallback
    if (permissions && permissions.employees) {
      return permissions.employees.can_edit;
    }
    return false;
  }, []);

  useEffect(() => {
    const fetchDivisions = async () => {
      if (!token) return;
      try {
        setIsLoadingDivisions(true);
        const divisionsData = await divisionsApi.getDivisions(token);
        setDivisions(divisionsData);
      } catch (err) {
        console.error('Error fetching divisions:', err);
      } finally {
        setIsLoadingDivisions(false);
      }
    };

    if (isEditing) {
      fetchDivisions();
    }
  }, [isEditing, token]);

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        if (!id || !token) return;

        setIsLoading(true);
        setError(null);

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

  // Обновляем логику возврата в зависимости от режима просмотра
  const handleBack = () => {
    const state = location.state;
    const currentSearchParams = new URLSearchParams(location.search);

    // Получаем параметры фильтров из текущего URL
    const typeFilter = currentSearchParams.get('type');
    const classFilter = currentSearchParams.get('class');

    // Если есть состояние из предыдущей страницы
    if (state?.from === 'facilities-section') {
      let backUrl = state.divisionId
        ? `/divisions/${state.divisionId}/facilities`
        : `/facilities`;

      // Добавляем параметры если они есть
      const params = new URLSearchParams();

      // Добавляем вкладку из state
      if (state.activeTab && state.activeTab !== 'all') {
        params.append('tab', state.activeTab);
      }

      // Добавляем подразделение из state
      if (state.subdivisionId) {
        params.append('subdivision', state.subdivisionId);
      }

      // ВАЖНО: Используем фильтры из state, а не из текущего URL
      if (state.filterType && state.filterType !== 'all') {
        params.append('type', state.filterType.toString());
      }
      if (state.facilityClassFilter && state.facilityClassFilter !== 'all') {
        params.append('class', state.facilityClassFilter);
      }

      const queryString = params.toString();
      if (queryString) {
        backUrl += `?${queryString}`;
      }

      navigate(backUrl, {
        state: {
          activeTab: state.activeTab,
          filterType: state.filterType,
          facilityClassFilter: state.facilityClassFilter,
          viewType: state.viewType,
          subdivisionId: state.subdivisionId,
          divisionId: state.divisionId
        }
      });
    }
    // Если перешли из сайдбара (глобальный режим) или нет информации об источнике
    else if (isGlobalView || !facility?.division?.id) {
      let backUrl = `/facilities`;
      const params = new URLSearchParams();

      // Добавляем фильтры из текущего URL
      if (typeFilter) {
        params.append('type', typeFilter);
      }
      if (classFilter) {
        params.append('class', classFilter);
      }

      const queryString = params.toString();
      if (queryString) {
        backUrl += `?${queryString}`;
      }

      navigate(backUrl);
    }
    // Если у объекта есть подразделение и мы не в глобальном режиме
    else if (facility?.division?.id) {
      let backUrl = `/divisions/${facility.division.id}/facilities`;
      const params = new URLSearchParams();

      // Добавляем подразделение объекта
      if (facility.subdivision?.id) {
        params.append('subdivision', facility.subdivision.id);
      }

      // Добавляем фильтры из текущего URL
      if (typeFilter) {
        params.append('type', typeFilter);
      }
      if (classFilter) {
        params.append('class', classFilter);
      }

      const queryString = params.toString();
      if (queryString) {
        backUrl += `?${queryString}`;
      }

      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  // Остальной код остается без изменений
  const handleUpdate = async (updatedData: Partial<Facility>) => {
    try {
      if (!facility?.id || !token) return;

      setIsLoading(true);

      // Формируем правильные данные для отправки
      const dataToSend = {
        ...updatedData,
        type: updatedData.type?.id || null,
        communication_post_ids: updatedData.communication_posts?.map(p => p.id) || [],
        facility_class: updatedData.facility_class || null
      };

      // Отправляем обновление на сервер
      await facilitiesApi.updateFacility(
        facility.id,
        dataToSend,
        token
      );

      // Получаем обновленные данные с сервера
      const updatedFacility = await facilitiesApi.getFacilityById(facility.id, token);

      // Обновляем локальное состояние
      setFacility(updatedFacility);

      // Обновляем Redux хранилище
      dispatch(updateFacility(updatedFacility));

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating facility:', err);
      setError('Не удалось обновить данные объекта');

      // Восстанавливаем предыдущие данные в случае ошибки
      try {
        const currentFacility = await facilitiesApi.getFacilityById(facility.id, token);
        setFacility(currentFacility);
      } catch (fetchError) {
        console.error('Error fetching facility after update failed:', fetchError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => setShowDeleteModal(true);

  const handleConfirmDelete = async () => {
    try {
      if (!facility?.id) return;

      setIsLoading(true);
      await facilitiesApi.deleteFacility(facility.id);
      dispatch(deleteFacility(facility.id));

      // Используем ту же логику что и в handleBack
      const state = location.state;
      if (state?.from === 'facilities-section') {
        let backUrl = state.divisionId
          ? `/divisions/${state.divisionId}/facilities`
          : `/facilities`;

        const params = new URLSearchParams();
        if (state.subdivisionId) {
          params.append('subdivision', state.subdivisionId);
        }
        if (state.activeTab && state.activeTab !== 'all') {
          params.append('tab', state.activeTab);
        }

        const queryString = params.toString();
        if (queryString) {
          backUrl += `?${queryString}`;
        }

        navigate(backUrl);
      } else if (isGlobalView || !facility?.division?.id) {
        navigate(`/facilities`);
      } else if (facility?.division?.id) {
        let backUrl = `/divisions/${facility.division.id}/facilities`;
        if (facility.subdivision?.id) {
          backUrl += `?subdivision=${facility.subdivision.id}`;
        }
        navigate(backUrl);
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error('Error deleting facility:', err);
      setError('Не удалось удалить объект');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="facility-loading">
        <p>Загрузка данных объекта...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="facility-error">
        <p>{error}</p>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="facility-not-found">
        <p>Объект не найден</p>
      </div>
    );
  }
  if (isEditing) {
    return (
      <div className="facility-details-container">
        <div className="facility-edit-header">
          <button
            onClick={() => setIsEditing(false)}
            className="facility-btn--icon"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="facility-header__title">Редактирование объекта</h1>
        </div>

        <div className="facility-card-edit facility-card--editing">
          <EditFacilityForm
            initialData={facility}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isEditing={true}
            divisions={divisions}
            isLoadingDivisions={isLoadingDivisions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="facility-details-container">
      <div className="facility-header facility-justify-between">
        <div className="facility-flex facility-items-center facility-gap-md">
          <button
            onClick={handleBack}
            className="facility-btn--icon"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="facility-header__title">{facility.name}</h1>
        </div>

        {canEditFacility && (
          <div className="facility-flex facility-gap-sm">
            <button
              onClick={() => setIsEditing(true)}
              className="facility-btn facility-btn--primary"
            >
              <Pencil size={16} />
              <span>Редактировать</span>
            </button>
            <button
              onClick={handleDelete}
              className="facility-btn facility-btn--danger"
            >
              <Trash2 size={16} />
              <span>Удалить</span>
            </button>
          </div>
        )}
      </div>

      <div className="facility-grid facility-grid--2cols">
        <BasicInfo facility={facility} />
        <ClassificationtFacility facility={facility} />

        {facility.is_closed && (
          <>
            <DocumentationCard facility={facility} />
            <KzInfoCard facility={facility} />
          </>
        )}

        {facility.comments && <CommentsCard facility={facility} />}
      </div>

      <AssignedEquipment facility={facility} />

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