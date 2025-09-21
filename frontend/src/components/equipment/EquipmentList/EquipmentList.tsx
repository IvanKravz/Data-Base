import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Equipment } from '../../../types';
import { TableView } from './views/TableView';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';

interface EquipmentListProps {
  equipment: Equipment[];
  onUpdateEquipment: (updatedEquipment: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
}

export function EquipmentList({
  equipment,
  onUpdateEquipment,
  onDeleteEquipment,
}: EquipmentListProps) {
  const [searchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, equipmentId: '' });

  const filteredEquipment = subdivisionId
    ? equipment.filter(item => item.subdivision?.id == subdivisionId)
    : equipment;

  const handleEdit = (e: React.MouseEvent, item: Equipment) => {
    e.stopPropagation();
    onUpdateEquipment(item);
  };

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
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {filteredEquipment.length === 0 && (
        <div className="equipment-list-empty-message">
          {searchParams.get('search')
            ? 'Нет техники, соответствующей поиску'
            : subdivisionId
              ? 'Нет техники в выбранном подразделении'
              : 'Нет техники для отображения'}
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