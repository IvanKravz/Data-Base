import { useState } from 'react';

export function useDeleteConfirmation() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = (onDelete: (id: string) => void) => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  return {
    showDeleteModal,
    itemToDelete,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete
  };
}