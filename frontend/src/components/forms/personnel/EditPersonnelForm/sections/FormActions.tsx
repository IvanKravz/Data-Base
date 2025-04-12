import React from 'react';
import { Save, X } from 'lucide-react';
import '.././style.css';

interface FormActionsProps {
  onCancel: () => void;
  loading?: boolean;
}

export function FormActions({ onCancel, loading }: FormActionsProps) {
  return (
    <div className="personnel-form-actions">
      <button
        type="button"
        onClick={onCancel}
        className="personnel-btn personnel-btn-secondary"
      >
        <X className="h-4 w-4" />
        <span>Отмена</span>
      </button>
      <button
        type="submit"
        className="personnel-btn personnel-btn-primary"
        disabled={loading}
      >
        <Save className="h-4 w-4" />
        {loading ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
}