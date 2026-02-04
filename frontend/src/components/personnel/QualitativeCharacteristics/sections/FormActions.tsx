import React from 'react';

interface FormActionsProps {
  onCancel: () => void;
  loading: boolean;
  canEdit?: boolean;
}

export function FormActions({ onCancel, loading, canEdit = true }: FormActionsProps) {
  if (!canEdit) {
    return null;
  }

  return (
    <div className="qc-actions">
      <button
        type="button"
        onClick={onCancel}
        className="qc-cancel-btn"
        disabled={loading}
      >
        Отмена
      </button>
      <button
        type="submit"
        className="qc-save-btn"
        disabled={loading}
      >
        {loading ? 'Сохранение...' : 'Сохранить изменения'}
      </button>
    </div>
  );
}