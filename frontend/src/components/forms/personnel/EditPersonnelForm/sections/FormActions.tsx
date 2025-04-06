import React from 'react';
import { Save, X } from 'lucide-react';
import '.././style.css';

interface FormActionsProps {
  onCancel: () => void;
  loading?: boolean;
}

export function FormActions({ onCancel, loading }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4">
      <button
        type="button"
        onClick={onCancel}
        className="btn btn-secondary"
      >
        <X className="h-4 w-4" />
        <span>Отмена</span>
      </button>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
      >
        <Save className="h-4 w-4" />
        {loading ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
}