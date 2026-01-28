import React from 'react';
import { X, Save, PlusCircle, Loader2 } from 'lucide-react';

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
    <div className="form-actions">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="form-actions-button form-actions-cancel"
      >
        <X size={16} className="mr-2" />
        Отмена
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className={`form-actions-button ${isEditing ? 'form-actions-submit' : 'form-actions-create'}`}
      >
        {isLoading ? (
          <Loader2 size={16} className="mr-2 animate-spin" />
        ) : isEditing ? (
          <Save size={16} className="mr-2" />
        ) : (
          <PlusCircle size={16} className="mr-2" />
        )}
        {isEditing ? 'Сохранить' : 'Создать'}
      </button>
    </div>
  );
}