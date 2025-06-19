import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="delete-confirmation-modal-overlay">
      <div className="delete-confirmation-modal-container">
        {/* Header */}
        <div className="delete-confirmation-modal-header">
          <div className="delete-confirmation-modal-title-wrapper">
            <AlertTriangle className="delete-confirmation-modal-icon" />
            <h2 className="delete-confirmation-modal-title">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="delete-confirmation-modal-close-btn"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="delete-confirmation-modal-body">
          <p className="delete-confirmation-modal-message">{message}</p>
        </div>

        {/* Footer */}
        <div className="delete-confirmation-modal-footer">
          <button
            onClick={onClose}
            className="delete-confirmation-modal-cancel-btn"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="delete-confirmation-modal-confirm-btn"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}