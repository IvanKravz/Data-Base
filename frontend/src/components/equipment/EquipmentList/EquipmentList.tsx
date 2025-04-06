import React from 'react';
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

  const handleEdit = (e: React.MouseEvent, item: Equipment) => {
    e.stopPropagation();
    onUpdateEquipment(item);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <ExportButton 
          onClick={() => exportEquipmentToExcel(equipment)}
          label="Экспорт техники"
        />
      </div>
        <TableView
          equipment={equipment}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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