// components/equipment/EquipmentList/EquipmentList.tsx
import React, { useMemo, useState } from 'react';
import { Equipment } from '../../../types';
import { TableView } from './views/TableView';
import { ConfirmationModal } from '../../modals/ConfirmationModal';
import { DisposalModal } from '../DisposalModal/DisposalModal';

interface EquipmentListProps {
  equipment: Equipment[];
  onDeleteEquipment: (id: string) => void;
  onDisposeEquipment: (id: string, disposalInfo: any) => Promise<void>;
  divisionId?: string;
  subdivisionId?: string;
  activeTab?: string;
  disableRowClick?: boolean;
  showActions?: boolean;
  viewMode?: 'flat' | 'grouped';
  searchTerm?: string;
  storageKey?: string;
  /**
   * Скрывать ли списанную технику (status === 'disposed').
   * По умолчанию true — на общей странице техники списанное не показываем.
   * На странице «Списанное» передавайте excludeDisposed={false}.
   */
  excludeDisposed?: boolean;
}

export function EquipmentList({
  equipment,
  onDeleteEquipment,
  onDisposeEquipment,
  divisionId,
  subdivisionId,
  activeTab,
  disableRowClick = false,
  showActions = true,
  viewMode = 'flat',
  searchTerm = '',
  storageKey = 'equipment_default',
  excludeDisposed = true,
}: EquipmentListProps) {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; equipment: Equipment | null }>({
    isOpen: false,
    equipment: null,
  });
  const [disposalModal, setDisposalModal] = useState<{ isOpen: boolean; equipment: Equipment | null }>({
    isOpen: false,
    equipment: null,
  });

  // Страховка на фронте: даже если бэкенд по какой-то причине вернёт списанную технику,
  // на общей странице она не отобразится.
  const visibleEquipment = useMemo(
    () => (excludeDisposed ? equipment.filter((e) => e.status !== 'disposed') : equipment),
    [equipment, excludeDisposed],
  );

  const handleDeleteAction = (equipment: Equipment) => {
    if (equipment.status === 'disposed') {
      // Если уже списана, сразу спрашиваем удаление
      setDeleteModal({ isOpen: true, equipment });
    } else {
      // Иначе открываем модалку списания
      setDisposalModal({ isOpen: true, equipment });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteModal.equipment) {
      onDeleteEquipment(deleteModal.equipment.id);
    }
    setDeleteModal({ isOpen: false, equipment: null });
  };

  const handleConfirmDisposal = async (disposalInfo: any) => {
    if (disposalModal.equipment) {
      await onDisposeEquipment(disposalModal.equipment.id, disposalInfo);
    }
    setDisposalModal({ isOpen: false, equipment: null });
  };

  const handleCancelDisposal = () => {
    setDisposalModal({ isOpen: false, equipment: null });
  };

  return (
    <>
      <TableView
        equipment={visibleEquipment}
        onDelete={handleDeleteAction}
        divisionId={divisionId}
        subdivisionId={subdivisionId}
        activeTab={activeTab}
        disableRowClick={disableRowClick}
        showActions={showActions}
        viewMode={viewMode}
        searchTerm={searchTerm}
        storageKey={storageKey}
      />

      {visibleEquipment.length === 0 && (
        <div className="equipment-list-empty-message">
          Нет техники для отображения
        </div>
      )}

      {deleteModal.isOpen && deleteModal.equipment && (
        <ConfirmationModal
          type="delete"
          title="Удаление техники"
          message="Вы уверены, что хотите удалить эту технику? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, equipment: null })}
        />
      )}

      {disposalModal.isOpen && disposalModal.equipment && (
        <DisposalModal
          onConfirm={handleConfirmDisposal}
          onCancel={handleCancelDisposal}
        />
      )}
    </>
  );
}