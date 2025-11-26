import React from 'react';
import '../style.css';

interface FormActionsProps {
  onCancel: () => void;
  showDisposeButton: boolean;
  onDispose: () => void;
  hasEditPermission?: boolean;
}

export function FormActions({
  onCancel,
  showDisposeButton,
  onDispose,
  hasEditPermission = true
}: FormActionsProps) {
  return (
    <div className="equipment-form-footer">
      <button
        type="button"
        onClick={onCancel}
        className="equipment-form-footer-button equipment-form-footer-cancel"
      >
        Отмена
      </button>
      
      {showDisposeButton && (
        <button
          type="button"
          onClick={onDispose}
          className="equipment-form-footer-button equipment-form-footer-dispose"
        >
          Списать
        </button>
      )}
      
      <button
        type="submit"
        className="equipment-form-footer-button equipment-form-footer-submit"
        disabled={!hasEditPermission}
      >
        Сохранить
      </button>
    </div>
  );
}