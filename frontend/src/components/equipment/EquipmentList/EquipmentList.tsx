import React, { useState } from 'react';
import { Equipment } from '../../../types';
import { TableView } from './views/TableView';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';

interface EquipmentListProps {
  equipment: Equipment[];
  onDeleteEquipment: (id: string) => void;
  divisionId?: string;
  subdivisionId?: string;
  activeTab?: string;
  disableRowClick?: boolean;
  showActions?: boolean;
}

export function EquipmentList({
  equipment,
  onDeleteEquipment,
  divisionId,
  subdivisionId,
  activeTab,
  disableRowClick = false,
  showActions = true 
}: EquipmentListProps) {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, equipmentId: '' });

  const filteredEquipment = equipment;

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, equipmentId: id });
  };

  const handleConfirmDelete = () => {
    onDeleteEquipment(deleteModal.equipmentId);
    setDeleteModal({ isOpen: false, equipmentId: '' });
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, equipmentId: '' });
  };

  return (
    <>
<TableView
        equipment={filteredEquipment}
        onDelete={handleDelete}
        divisionId={divisionId}
        subdivisionId={subdivisionId}
        activeTab={activeTab}
        disableRowClick={disableRowClick}
        showActions={showActions}
      />

      {filteredEquipment.length === 0 && (
        <div className="equipment-list-empty-message">
          Нет техники для отображения
        </div>
      )}

      {deleteModal.isOpen && (
        <DeleteConfirmationModal
          title="Удаление техники"
          message="Вы уверены, что хотите удалить технику?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
}