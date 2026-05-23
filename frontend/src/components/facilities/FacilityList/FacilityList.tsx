// FacilityList.tsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facility } from '../../../types';
import { TableView } from './views/TableView';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import './style.css';

interface FacilityListProps {
  facilities: Facility[];
  viewMode: 'flat' | 'grouped';
  onDelete: (id: string) => void;
  onLocate?: (facility: Facility) => void;
  divisionId?: string;
  subdivisionId?: string;
  activeTab?: string;
  filterType?: string | null;
  facilityClassFilter?: string | null;
  searchTerm?: string;
  storageKey?: string;
}

export function FacilityList({
  facilities,
  viewMode,
  onDelete,
  onLocate,
  divisionId,
  subdivisionId,
  activeTab,
  filterType,
  facilityClassFilter,
  searchTerm = '',
  storageKey = 'facilities_default'
}: FacilityListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<string | null>(null);

  const handleDeleteClick = useCallback((id: string) => {
    setFacilityToDelete(id);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (facilityToDelete) {
      onDelete(facilityToDelete);
    }
    setShowDeleteModal(false);
    setFacilityToDelete(null);
  }, [facilityToDelete, onDelete]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setFacilityToDelete(null);
  }, []);

  return (
    <div className="facility-list-wrapper">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <TableView
            facilities={facilities}
            onDelete={handleDeleteClick}
            onLocate={onLocate}
            showDifferentFields={true}
            divisionId={divisionId}
            subdivisionId={subdivisionId}
            activeTab={activeTab}
            filterType={filterType}
            facilityClassFilter={facilityClassFilter}
            viewMode={viewMode}
            searchTerm={searchTerm}
            storageKey={storageKey}
          />
        </motion.div>
      </AnimatePresence>

      {facilities.length === 0 && (
        <div className="facility-list-empty-message">
          Нет объектов для отображения
        </div>
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление объекта"
          message="Вы уверены, что хотите удалить этот объект? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}