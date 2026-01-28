import React from 'react';
import '../style.css';
import { X, Save, PlusCircle, Loader2, Trash2 } from 'lucide-react';

interface FormActionsProps {
  onCancel: () => void;
  showDisposeButton: boolean;
  onDispose?: () => void;
  hasEditPermission?: boolean;
  isLoading?: boolean;
  isCreating?: boolean;
}

export function FormActions({
  onCancel,
  showDisposeButton,
  onDispose,
  hasEditPermission = true,
  isLoading = false,
  isCreating = false
}: FormActionsProps) {
  return (
    <div className="equipment-form-footer">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="equipment-form-footer-button equipment-form-footer-cancel"
      >
        <X size={16} className="mr-2" />
        Отмена
      </button>
      
      {showDisposeButton && onDispose && (
        <button
          type="button"
          onClick={onDispose}
          disabled={isLoading}
          className="equipment-form-footer-button equipment-form-footer-dispose"
        >
          <Trash2 size={16} className="mr-2" />
          Списать
        </button>
      )}
      
      <button
        type="submit"
        className={`equipment-form-footer-button ${isCreating ? 'equipment-form-footer-add' : 'equipment-form-footer-submit'}`}
        disabled={!hasEditPermission || isLoading}
      >
        {isLoading ? (
          <Loader2 size={16} className="mr-2 animate-spin" />
        ) : isCreating ? (
          <PlusCircle size={16} className="mr-2" />
        ) : (
          <Save size={16} className="mr-2" />
        )}
        {isCreating ? 'Добавить' : 'Сохранить'}
      </button>
    </div>
  );
}