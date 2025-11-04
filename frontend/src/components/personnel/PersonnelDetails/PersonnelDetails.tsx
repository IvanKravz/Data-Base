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
import { getPermissions } from '../../../api/utils/permissions';

export function PersonnelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { personnel, loading, error } = useSelector((state: RootState) => state.personnel);
  const person = personnel.find(p => p.id == id);
  const token = localStorage.getItem('accessToken');

  const isGlobalView = authApi.getGlobalView();

  // Получаем состояние навигации
  const navigationState = location.state;

  const canEditEmployee = useMemo(() => {
    const permissions = getPermissions();
    if (permissions && permissions.employees) {
      return permissions.employees.can_edit;
    }
    return false;
  }, []);

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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Вернуться назад
        </button>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Сотрудник не найден</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Вернуться назад
        </button>
      </div>
    );
  }

  const handleBack = () => {
    // Используем сохраненное состояние навигации если есть
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
      // Запасной вариант - возврат по истории
      navigate(-1);
    }
  };

  const handleConfirmDelete = async () => {
    if (token && id) {
      await employeesApi.deletePerson(token, id);

      // Используем ту же логику что и в handleBack
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

  // Функция перехода в режим редактирования
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Функция перехода на страницу качественной характеристики
  const handleGoToQualitative = () => {
    navigate(`/personnel/${id}/qualitative`, {
      state: {
        // Явно указываем откуда пришли - с этой страницы сотрудника
        from: `/personnel/${id}`,
        // Сохраняем оригинальное состояние для возврата в список
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

      <AssignedEquipment person={person} id={id} />

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