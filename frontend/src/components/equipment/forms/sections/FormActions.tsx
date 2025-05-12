import React from 'react';
import '../style.css';

interface FormActionsProps {
  onCancel: () => void;
  showDisposeButton?: boolean;
  onDispose?: () => void;
  isLoading?: boolean;
}

export function FormActions({ 
  onCancel, 
  showDisposeButton = false,
  onDispose = () => {},
  isLoading = false
}: FormActionsProps) {
  return (
    <div className="form-actions">
      {showDisposeButton && (
        <button
          type="button"
          onClick={onDispose}
          className="btn btn-danger"
          disabled={isLoading}
        >
          Списать технику
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="btn btn-secondary"
        disabled={isLoading}
      >
        Отмена
      </button>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading}
      >
        {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
      </button>
    </div>
  );
}