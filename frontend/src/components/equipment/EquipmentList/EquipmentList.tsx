import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Equipment } from '../../../types';
import { TableView } from './views/TableView';
import { GridView } from './views/GridView';
import { useDeleteConfirmation } from '../../../hooks/useDeleteConfirmation';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { ExportButton } from '../../common/ExportButton';
import { exportEquipmentToExcel } from '../../../utils/exportToExcel';

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
  const {
    showDeleteModal,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete
  } = useDeleteConfirmation();

  const [searchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');

  const filteredEquipment = subdivisionId
    ? equipment.filter(item => item.subdivision?.id == subdivisionId)
    : equipment;

  const handleEdit = (e: React.MouseEvent, item: Equipment) => {
    e.stopPropagation();
    onUpdateEquipment(item);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
      </div>
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

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление техники"
          message="Вы уверены, что хотите удалить эту технику? Это действие нельзя отменить."
          onConfirm={() => handleConfirmDelete(onDeleteEquipment)}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
}