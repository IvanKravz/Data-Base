import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import './style.css'

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
    <div className="modal-overlay">
      <div className="modal-content-delete">
        <div className="modal-header-delete">
          <div className="header-content">
            <AlertTriangle className="warning-icon" />
            <h2 className="modal-title">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="close-button"
          >
            <X className="close-icon" />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-message">
            {message}
          </p>

          <div className="modal-actions-delete">
            <button
              onClick={onCancel}
              className="cancel-button"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              className="confirm-button"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}