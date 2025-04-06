import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { ArrowLeft } from 'lucide-react';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { EquipmentForm } from '../forms/EquipmentForm';
import { updateEquipment, deleteEquipment } from '../../../store/slices/equipmentSlice';
import {
  Header,
  BasicInfo,
  IdentificationInfo,
  DatesInfo,
  AssignmentInfo,
  DisposalInfo
} from './sections';

export function EquipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const equipment = useSelector((state: RootState) => 
    state.equipment.equipment.find(e => e.id === id)
  );

  console.log('equipment', equipment)

  if (!equipment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Техника не найдена</p>
      </div>
    );
  }

  const handleBack = () => {
    if (equipment.status === 'disposed') {
      navigate('/equipment-disposed');
    } else {
      navigate(equipment.category === 'closed' ? '/equipment-closed' : '/equipment-open');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleUpdate = (updatedEquipment: Omit<typeof equipment, 'id'>) => {
    dispatch(updateEquipment({ ...updatedEquipment, id: equipment.id }));
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    dispatch(deleteEquipment(equipment.id));
    handleBack();
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Редактирование техники</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <EquipmentForm
            initialData={equipment}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isClosedEquipment={equipment.category === 'closed'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Header
        equipment={equipment}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BasicInfo equipment={equipment} />
        <IdentificationInfo equipment={equipment} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DatesInfo equipment={equipment} />
        <AssignmentInfo equipment={equipment} />
      </div>

      {equipment.status === 'disposed' && equipment.disposalInfo && (
        <DisposalInfo disposalInfo={equipment.disposalInfo} />
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление техники"
          message="Вы уверены, что хотите удалить эту технику? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}