import React from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function Header({ title, onClose, onEdit, onDelete }: HeaderProps) {
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-900">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-blue-600"
          >
            <Pencil className="h-5 w-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-red-600"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}