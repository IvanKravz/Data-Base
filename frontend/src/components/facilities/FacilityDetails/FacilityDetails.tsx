import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { Facility } from '../../../types';
import { Header } from './sections/Header';
import { BasicInfo } from './sections/BasicInfo';
import { ResponsiblePersons } from './sections/ResponsiblePersons';
import { AssignedEquipment } from './sections/AssignedEquipment';
import { FacilityForm } from '../forms/FacilityForm';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { updateFacility, deleteFacility } from '../../../store/slices/facilitiesSlice';

export function FacilityDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const facility = useSelector((state: RootState) => 
    state.facilities.facilities.find(f => f.id === id)
  );

  if (!facility) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Объект не найден</p>
      </div>
    );
  }

  const handleBack = () => {
    navigate(facility.type === 'station' ? '/facilities-open' : '/facilities-closed');
  };

  const handleUpdate = (updatedFacility: Omit<Facility, 'id'>) => {
    dispatch(updateFacility({ ...updatedFacility, id: facility.id }));
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    dispatch(deleteFacility(facility.id));
    handleBack();
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Header
          title="Редактирование объекта"
          onBack={() => setIsEditing(false)}
        />
        <div className="bg-white rounded-lg shadow p-6">
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
    <div className="space-y-6">
      <Header
        title={facility.name}
        onBack={handleBack}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        facility={facility}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BasicInfo facility={facility} />
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