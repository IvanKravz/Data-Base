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
    <div className="personnel-form-footer">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="personnel-form-footer-button personnel-form-footer-cancel"
      >
        <X size={16} className="mr-2" />
        Отмена
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="personnel-form-footer-button personnel-form-footer-submit"
      >
        {isLoading ? (
          <Loader2 size={16} className="mr-2 animate-spin" />
        ) : isEditing ? (
          <Save size={16} className="mr-2" />
        ) : (
          <PlusCircle size={16} className="mr-2" />
        )}
        {isLoading ? 'Обработка...' : isEditing ? 'Сохранить' : 'Создать'}
      </button>
    </div>
  );
}