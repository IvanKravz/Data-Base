import React from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';
import { Task } from '../../../../types/tasks';
import { taskCategories } from '../../../../types/taskCategories';

interface HeaderProps {
  task: Task;
  isEditing: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const categoryStyles = {
  urgent: {
    badge: 'bg-red-100 text-red-700 border border-red-200',
  },
  planned: {
    badge: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  attention: {
    badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  }
};

export function Header({ task, isEditing, onClose, onEdit, onDelete }: HeaderProps) {
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Редактирование задачи' : task.title}
          </h2>
          {!isEditing && (
            <span className={`text-sm px-2 py-1 rounded-full ${categoryStyles[task.category].badge}`}>
              {taskCategories[task.category].label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && onEdit && (
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
    </div>
  );
}