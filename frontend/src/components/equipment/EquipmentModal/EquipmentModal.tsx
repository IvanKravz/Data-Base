import React from 'react';
import { Equipment } from '../../../types';
import { Header } from './sections/Header';
import { BasicInfo } from './sections/BasicInfo';
import { IdentificationInfo } from './sections/IdentificationInfo';
import { AssignmentInfo } from './sections/AssignmentInfo';
import { DatesInfo } from './sections/DatesInfo';
import { EditEquipmentForm } from '../../forms/equipment/EditEquipmentForm';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';

interface EquipmentModalProps {
  equipment: Equipment;
  onClose: () => void;
  onUpdate: (equipment: Equipment) => void;
  onDelete?: (id: string) => void;
  isEditing: boolean;
}

export function EquipmentModal({ 
  equipment, 
  onClose, 
  onUpdate, 
  onDelete,
  isEditing: initialEditMode 
}: EquipmentModalProps) {
  const [isEditing, setIsEditing] = React.useState(initialEditMode);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const handleUpdate = (updatedEquipment: Equipment) => {
    onUpdate(updatedEquipment);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(equipment.id);
      onClose();
    }
    setShowDeleteModal(false);
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto md:max-w-3xl lg:max-w-4xl shadow-xl transform transition-all duration-300 scale-in animate-in fade-in">
          <Header
            title="Редактирование техники"
            onClose={onClose}
          />
          <div className="p-8">
            <EditEquipmentForm
              equipment={equipment}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto md:max-w-3xl lg:max-w-4xl shadow-xl transform transition-all duration-300 scale-in animate-in fade-in">
        <Header
          title={equipment.name}
          onClose={onClose}
          onEdit={() => setIsEditing(true)}
          onDelete={onDelete ? handleDelete : undefined}
        />
        
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BasicInfo equipment={equipment} />
            <IdentificationInfo equipment={equipment} />
          </div>

          <AssignmentInfo equipment={equipment} />
          <DatesInfo equipment={equipment} />
        </div>
      </div>

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