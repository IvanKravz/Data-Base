import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { Header } from './sections/Header';
import { BasicInfo } from './sections/BasicInfo';
import { ContactInfo } from './sections/ContactInfo';
import { ResponsibilityInfo } from './sections/ResponsibilityInfo';
import { AssignedEquipment } from './sections/AssignedEquipment';
import { EditPersonnelForm } from '../../forms/personnel/EditPersonnelForm';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { updatePersonAsync, fetchPersonById } from '../../../store/slices/personnelSlice';
import { employeesApi } from '../../../api';
import { CommentsInfo } from './sections/CommentsInfo';
import './style.css'
import { PhotoCard } from './sections/PhotoCard';
import { Employee } from '../../../types';

export function PersonnelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { personnel, loading, error } = useSelector((state: RootState) => state.personnel);
  const person = personnel.find(p => p.id == id);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (id && token && !person) {
      dispatch(fetchPersonById({ token, id }));
    }
  }, [id, token, person, dispatch]);

  const handlePhotoChange = async (file: File) => {
    if (!token || !id || !person) return;

    // Объявляем переменную вне блока try
    let previewUrl: string | null = null;

    try {
      // 1. СОЗДАНИЕ ВРЕМЕННОГО URL (BLOB)
      previewUrl = URL.createObjectURL(file);
      const updatedPerson = { ...person, photo_url: previewUrl };

      // 2. ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ REDUX
      dispatch(updatePersonAsync({
        token,
        id,
        personData: updatedPerson
      }));

      // 3. ОТПРАВКА ФОТО НА СЕРВЕР
      await employeesApi.uploadPhoto(token, id, file);

      // 4. ЗАПРОС АКТУАЛЬНЫХ ДАННЫХ
      dispatch(fetchPersonById({ token, id }));

    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      // 5. ОТКАТ ИЗМЕНЕНИЙ ПРИ ОШИБКЕ
      dispatch(updatePersonAsync({
        token,
        id,
        personData: person
      }));
      message.error('Ошибка загрузки фото');
    } finally {
      // 6. ОСВОБОЖДЕНИЕ ПАМЯТИ
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  };

  const handlePhotoRemove = async () => {
    if (!token || !id || !person) return;

    try {
      // Оптимистичное обновление
      const updatedPerson = { ...person, photo_url: null };
      dispatch(updatePersonAsync({ token, id, personData: updatedPerson }));

      // Удаление фото на сервере и получение обновленных данных
      const response = await employeesApi.deletePhoto(token, id);

      // Если сервер подтвердил удаление
      if (response && !response.photo_url) {
        dispatch(updatePersonAsync({
          token,
          id,
          personData: response
        }));
      } else {
        // Если что-то пошло не так, возвращаем исходные данные
        dispatch(updatePersonAsync({ token, id, personData: person }));
        message.error('Не удалось удалить фото');
      }

    } catch (error) {
      // Откат изменений при ошибке
      dispatch(updatePersonAsync({ token, id, personData: person }));
      message.error('Ошибка удаления фото');
    }
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
    navigate(`/divisions/${person.division?.id}/personnel`);
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

  const handleConfirmDelete = async () => {
    if (token && id) {
      await employeesApi.deletePerson(token, id);
      navigate(`/divisions/${person.division?.id}/personnel`);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Header
          title="Редактирование сотрудника"
          onBack={() => setIsEditing(false)}
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
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
      />

      <div className="personnel-details-grid">
        {person && (
          <PhotoCard
            person={person}
            editable={true}
            onPhotoChange={handlePhotoChange}
            onPhotoRemove={handlePhotoRemove}
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