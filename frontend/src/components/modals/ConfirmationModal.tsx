import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import './style.css';

interface ConfirmationModalProps {
  type: 'delete' | 'restore';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  type,
  title,
  message,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  const isDelete = type === 'delete';
  const Icon = isDelete ? AlertTriangle : RefreshCw;
  const confirmButtonClass = isDelete
    ? 'confirmation-modal-confirm-button-danger'
    : 'confirmation-modal-confirm-button-success';
  const confirmButtonText = isDelete ? 'Удалить' : 'Восстановить';

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-content">
        <div className="confirmation-modal-header">
          <div className="confirmation-modal-header-content">
            <Icon className="confirmation-modal-icon" />
            <h2 className="confirmation-modal-title">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="confirmation-modal-close-button"
          >
            <X className="confirmation-modal-close-icon" />
          </button>
        </div>

        <div className="confirmation-modal-body">
          <p className="confirmation-modal-message">
            {message}
          </p>

          <div className="confirmation-modal-actions">
            <button
              onClick={onCancel}
              className="confirmation-modal-cancel-button"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              className={confirmButtonClass}
            >
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}