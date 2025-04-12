import React from 'react';

interface FormActionsProps {
  onCancel: () => void;
  loading: boolean;
}

export function FormActions({ onCancel, loading }: FormActionsProps) {
  return (
    <div className="qc-actions">
      <button
        type="button"
        onClick={onCancel}
        className="qc-cancel-btn"
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