import React from 'react';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { taskCategories, TaskCategory } from '../../../../types/taskCategories';
import '../style.css';

interface TaskCategorySelectorProps {
  category: TaskCategory;
  onChange: (category: TaskCategory) => void;
}

export function TaskCategorySelector({ category, onChange }: TaskCategorySelectorProps) {
  const getCategoryStyle = (cat: TaskCategory) => {
    const baseClasses = "task-category-btn transition-all duration-200 flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium text-sm";
    
    const activeClasses = {
      urgent: "bg-red-50 border-red-200 text-red-700 shadow-sm",
      planned: "bg-blue-50 border-blue-200 text-blue-700 shadow-sm",
      attention: "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
    };

    const inactiveClasses = {
      urgent: "bg-white border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-100",
      planned: "bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-100",
      attention: "bg-white border-gray-200 text-gray-700 hover:bg-amber-50 hover:border-amber-100"
    };

    return category === cat 
      ? `${baseClasses} ${activeClasses[cat]}`
      : `${baseClasses} ${inactiveClasses[cat]}`;
  };

  const getIconColor = (cat: TaskCategory) => {
    return category === cat 
      ? {
          urgent: "text-red-600",
          planned: "text-blue-600",
          attention: "text-amber-600"
        }[cat]
      : "text-gray-500";
  };

  return (
    <div className='modal-task-category'>
      <label className="task-form-label">Категория</label>
      <div className="grid grid-cols-1 gap-2">
        {(Object.entries(taskCategories) as [TaskCategory, { label: string }][]).map(([value, { label }]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value as TaskCategory)}
            className={getCategoryStyle(value as TaskCategory)}
          >
            <span className={getIconColor(value as TaskCategory)}>
              {value === 'urgent' && <AlertTriangle className="h-4 w-4" />}
              {value === 'planned' && <Clock className="h-4 w-4" />}
              {value === 'attention' && <AlertCircle className="h-4 w-4" />}
            </span>
            <span className="text-left">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}