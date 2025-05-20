import React, { useState, useEffect } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { Facility } from '../../../types';
import { Header } from './sections/Header';
import { BasicInfo } from './sections/BasicInfo';
import { ResponsiblePersons } from './sections/ResponsiblePersons';
import { AssignedEquipment } from './sections/AssignedEquipment';
import { CommentsCard } from './sections/CommentsCard';
import { DocumentationCard } from './sections/DocumentationCard';
import { KzInfoCard } from './sections/KzInfoCard';
import { FacilityForm } from '../forms/FacilityForm';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { updateFacility, deleteFacility } from '../../../store/slices/facilitiesSlice';
import { facilitiesApi } from '../../../api/facilities';
import './style.css';

export function FacilityDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('accessToken');

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
    navigate(-1);
  };

  const handleUpdate = async (updatedFacility: Omit<Facility, 'id'>) => {
    try {
      if (!facility?.id || !token) return;

      setIsLoading(true);
      await facilitiesApi.updateFacility(facility.id, updatedFacility);
      dispatch(updateFacility({ ...updatedFacility, id: facility.id }));

      // Refresh data after update
      const data = await facilitiesApi.getFacilityById(facility.id, token);
      setFacility(data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating facility:', err);
      setError('Не удалось обновить данные объекта');
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
      handleBack();
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
        <div className="facility-flex facility-items-center facility-gap-md">
          <button
            onClick={() => setIsEditing(false)}
            className="facility-btn facility-btn--icon"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="facility-header__title">Редактирование объекта</h1>
        </div>

        <div className="facility-card facility-card--editing">
          <FacilityForm
            initialData={facility}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isClosedFacility={facility.type === 'shd'}
            isEditing={true}
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
            className="facility-btn facility-btn--icon"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="facility-header__title">{facility.name}</h1>
        </div>

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
      </div>

      <div className="facility-grid facility-grid--2cols">
        <BasicInfo facility={facility} />

        {facility.comments && <CommentsCard facility={facility} />}

        {facility.is_closed && (
          <>
            <DocumentationCard facility={facility} />
            <KzInfoCard facility={facility} />
          </>
        )}
        <ResponsiblePersons facility={facility} />
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