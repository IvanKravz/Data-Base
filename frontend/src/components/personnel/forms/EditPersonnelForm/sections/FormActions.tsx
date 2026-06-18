import React from 'react';
import { X, Save, PlusCircle, Loader2 } from 'lucide-react';
import '../style.css';

interface FormActionsProps {
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function FormActions({ 
  onCancel, 
  isEditing = true, 
  isLoading = false 
}: FormActionsProps) {
  return (
    <div className="ep-form-actions">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="ep-form-actions-btn ep-form-actions-cancel"
      >
        <X size={16} className="ep-mr-2" />
        Отмена
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className={`ep-form-actions-btn ${isEditing ? 'ep-form-actions-submit' : 'ep-form-actions-create'}`}
      >
        {isLoading ? (
          <Loader2 size={16} className="ep-mr-2 ep-animate-spin" />
        ) : isEditing ? (
          <Save size={16} className="ep-mr-2" />
        ) : (
          <PlusCircle size={16} className="ep-mr-2" />
        )}
        {isEditing ? 'Сохранить' : 'Создать'}
      </button>
    </div>
  );
}