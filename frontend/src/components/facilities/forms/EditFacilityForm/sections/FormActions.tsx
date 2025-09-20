import React from 'react';
import { X, Save, PlusCircle, Loader2 } from 'lucide-react';

interface FormActionsProps {
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean; // Переименовали isSubmitting в isLoading для консистентности
}

export function FormActions({ 
  onCancel, 
  isEditing = true, 
  isLoading = false 
}: FormActionsProps) {
  return (
    <div className="facility-form-footer-edit">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="facility-form-footer-button-edit facility-form-footer-cancel-edit"
      >
        <X size={16} className="mr-2" />
        Отмена
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="facility-form-footer-button-edit facility-form-footer-submit-edit"
      >
        {isLoading ? (
          <Loader2 size={16} className="mr-2 animate-spin" />
        ) : isEditing ? (
          <Save size={16} className="mr-2" />
        ) : (
          <PlusCircle size={16} className="mr-2" />
        )}
        {isLoading ? 'Обработка...' : isEditing ? 'Сохранить' : 'Добавить'}
      </button>
    </div>
  );
}