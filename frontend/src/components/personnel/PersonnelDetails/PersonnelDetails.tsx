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
import { updatePerson } from '../../../store/slices/personnelSlice';
import { employeesApi } from '../../../api';
import { CommentsInfo } from './sections/CommentsInfo';
import './style.css'

export function PersonnelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [person, setPerson] = useState(false);

  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeesApi.getPersonById(token, id);
        setPerson(data);
      } catch (err) {
        setError('Не удалось загрузить подразделения');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [token, dispatch]);

  if (!person) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Сотрудник не найден</p>
      </div>
    );
  }

  const handleBack = () => {
    navigate(`/divisions/${person.division.id}/personnel`);
  };

  const handleUpdate = (updatedPerson: typeof person) => {
    dispatch(updatePerson(updatedPerson));
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    await employeesApi.deletePerson(token, person.id);
    navigate(`/divisions/${person.division.id}/personnel`);
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
        title={person.full_name}
        personId={person.id}
        onBack={handleBack}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
      />
  
      <div className="personnel-details-grid">
        <BasicInfo person={person} />
        <ContactInfo person={person} />
        <ResponsibilityInfo person={person} />
      </div>
      <CommentsInfo person={person} />
      <AssignedEquipment person={person} id={id}/>

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