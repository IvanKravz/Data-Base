import React from 'react';

interface FormActionsProps {
  onCancel: () => void;
}

export function FormActions({ onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Отмена
      </button>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Создать
      </button>
    </div>
  );
}