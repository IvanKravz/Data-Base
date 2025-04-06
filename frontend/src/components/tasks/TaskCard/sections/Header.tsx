import React from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { TaskCategory } from '../../../../types/taskCategories';
import { taskCategories } from '../../../../types/taskCategories';

interface HeaderProps {
  title: string;
  category: TaskCategory;
  isCompleted: boolean;
  styles: {
    badge: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function Header({
  title,
  category,
  isCompleted,
  styles,
  onEdit,
  onDelete,
  isExpanded,
  onToggleExpand
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <h3 className="font-medium text-gray-900">
          {title}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full ${styles.badge}`}>
          {isCompleted ? 'Выполнено' : taskCategories[category].label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/50 text-blue-600"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/50 text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleExpand}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/50 text-gray-600"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}