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
import { getPermissions } from '../../../api/utils/permissions';

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

  const isGlobalView = authApi.getGlobalView();

  const canEditFacility = useMemo(() => {
    const permissions = getPermissions();
    if (permissions && permissions.facilities) {
      return permissions.facilities.can_edit;
    }
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

  const handleBack = () => {
    const state = location.state;
    const currentSearchParams = new URLSearchParams(location.search);

    const typeFilter = currentSearchParams.get('type');
    const classFilter = currentSearchParams.get('class');

    if (state?.from === 'facilities-section') {
      let backUrl = state.divisionId
        ? `/divisions/${state.divisionId}/facilities`
        : `/facilities`;

      const params = new URLSearchParams();

      if (state.activeTab && state.activeTab !== 'all') {
        params.append('tab', state.activeTab);
      }

      if (state.subdivisionId) {
        params.append('subdivision', state.subdivisionId);
      }

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
    else if (isGlobalView || !facility?.division?.id) {
      let backUrl = `/facilities`;
      const params = new URLSearchParams();

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
    else if (facility?.division?.id) {
      let backUrl = `/divisions/${facility.division.id}/facilities`;
      const params = new URLSearchParams();

      if (facility.subdivision?.id) {
        params.append('subdivision', facility.subdivision.id);
      }

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

  const handleUpdate = async (updatedData: Partial<Facility>) => {
    try {
      if (!facility?.id || !token) return;

      setIsLoading(true);

      const dataToSend = {
        ...updatedData,
        type: updatedData.type?.id || null,
        communication_post_ids: updatedData.communication_posts?.map(p => p.id) || [],
        facility_class: updatedData.facility_class || null
      };

      await facilitiesApi.updateFacility(
        facility.id,
        dataToSend,
        token
      );

      const updatedFacility = await facilitiesApi.getFacilityById(facility.id, token);

      setFacility(updatedFacility);
      dispatch(updateFacility(updatedFacility));

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating facility:', err);
      setError('Не удалось обновить данные объекта');

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
          <h1 className="facilities-title">Редактирование объекта</h1>
        </div>

        <div className="facility-page-edit">
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
      <div className="facility-header">
        <div className="facility-header-main">
          <button
            onClick={handleBack}
            className="facility-btn--icon"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="facility-title-container">
            <h1 className="facilities-title" title={facility.name}>
              {facility.name}
            </h1>
          </div>
        </div>

        {canEditFacility && (
          <div className="facility-header-actions">
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