import React from 'react';

interface FormActionsProps {
  onCancel: () => void;
}

export function FormActions({ onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        Отмена
      </button>
      <button
        type="submit"
        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow transition-all"
      >
        Создать объект
      </button>
    </div>
  );
}