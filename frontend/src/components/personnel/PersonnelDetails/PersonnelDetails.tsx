// PersonnelDetails.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { Header } from './sections/Header';
import { BasicInfo } from './sections/BasicInfo';
import { ContactInfo } from './sections/ContactInfo';
import { ResponsibilityInfo } from './sections/ResponsibilityInfo';
import { AssignedEquipment } from './sections/AssignedEquipment';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { updatePersonAsync, fetchPersonById } from '../../../store/slices/personnelSlice';
import { employeesApi, authApi } from '../../../api';
import { CommentsInfo } from './sections/CommentsInfo';
import './style.css'
import { PhotoCard } from './sections/PhotoCard';
import { Employee } from '../../../types';
import { EditPersonnelForm } from '../forms/EditPersonnelForm';

export function PersonnelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;
  const { personnel, loading, error } = useSelector((state: RootState) => state.personnel);
  const person = personnel.find(p => p.id == id);
  const token = localStorage.getItem('accessToken');

  const isGlobalView = authApi.getGlobalView();

  const canEditEmployee = useMemo(() => 
    permissions?.models?.Employee?.includes('change') ?? false, [permissions]);
  const canViewEquipment = useMemo(() => 
    permissions?.models?.Equipment?.includes('view') ?? false, [permissions]);

  // Получаем состояние навигации
  const navigationState = location.state;

  useEffect(() => {
    if (id && token && !person) {
      dispatch(fetchPersonById({ token, id }));
    }
  }, [id, token, person, dispatch]);

  const handlePhotoChange = async (file: File) => {
    if (!token || !id || !person) return;

    let previewUrl: string | null = null;

    try {
      previewUrl = URL.createObjectURL(file);
      const updatedPerson = { ...person, photo_url: previewUrl };

      dispatch(updatePersonAsync({
        token,
        id,
        personData: updatedPerson
      }));

      await employeesApi.uploadPhoto(token, id, file);
      await dispatch(fetchPersonById({ token, id }));

    } catch (error) {
      console.error('Photo upload error:', error);
      await dispatch(updatePersonAsync({
        token,
        id,
        personData: person
      }));
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  };

  const handlePhotoRemove = async () => {
    await employeesApi.deletePhoto(token, id);
    await dispatch(fetchPersonById({ token, id }));
  };

  if (loading) {
    return <div className="equipment-loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="equipment-error">{error}</div>;
  }

  if (!person) {
    return (
      <div className="equipment-not-found">
      </div>
    );
  }

  const handleBack = () => {
    if (navigationState?.from) {
      navigate(navigationState.from, {
        state: {
          divisionId: navigationState.divisionId,
          subdivisionId: navigationState.subdivisionId,
          activeFilter: navigationState.activeFilter,
          searchTerm: navigationState.searchTerm
        }
      });
    } else {
      navigate(-1);
    }
  };

  const handleConfirmDelete = async () => {
    if (token && id) {
      await employeesApi.deletePerson(token, id);

      if (navigationState?.from) {
        navigate(navigationState.from, {
          state: {
            divisionId: navigationState.divisionId,
            subdivisionId: navigationState.subdivisionId,
            activeFilter: navigationState.activeFilter,
            searchTerm: navigationState.searchTerm
          }
        });
      } else {
        navigate(-1);
      }
    }
  };

  const handleUpdate = async (updatedPerson: Employee) => {
    if (token && id) {
      await dispatch(updatePersonAsync({ token, id, personData: updatedPerson }));
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleGoToQualitative = () => {
    navigate(`/personnel/${id}/qualitative`, {
      state: {
        from: `/personnel/${id}`,
        originalState: navigationState
      }
    });
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Header
          title={person?.full_name || ''}
          personId={person?.id || ''}
          onBack={() => setIsEditing(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onQualitative={handleGoToQualitative}
          canEditEmployee={canEditEmployee}
          isEditing={true}
        />
        <div className="bg-white rounded-lg shadow p-6">
          <EditPersonnelForm
            person={person}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="personnel-details-container">
      <Header
        title={person?.full_name || ''}
        personId={person?.id || ''}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onQualitative={handleGoToQualitative}
        canEditEmployee={canEditEmployee}
        isEditing={false}
      />

      <div className="personnel-details-grid">
        {person && (
          <PhotoCard
            person={person}
            editable={true}
            onPhotoChange={handlePhotoChange}
            onPhotoRemove={handlePhotoRemove}
            canEditEmployee={canEditEmployee}
          />
        )}
        <BasicInfo person={person} />
        <ContactInfo person={person} />
        <ResponsibilityInfo person={person} />
        <CommentsInfo person={person} />
      </div>

      {canViewEquipment && (
        <AssignedEquipment person={person} id={id} hasAccess={canViewEquipment} />
      )}

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