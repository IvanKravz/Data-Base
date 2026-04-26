import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './style.css';

interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) {

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-content">
        <div className="delete-modal-header">
          <div className="delete-modal-header-content">
            <AlertTriangle className="delete-modal-warning-icon" />
            <h2 className="delete-modal-title">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="delete-modal-close-button"
          >
            <X className="delete-modal-close-icon" />
          </button>
        </div>

        <div className="delete-modal-body">
          <p className="delete-modal-message">
            {message}
          </p>

          <div className="delete-modal-actions">
            <button
              onClick={onCancel}
              className="delete-modal-cancel-button"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              className="delete-modal-confirm-button"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}