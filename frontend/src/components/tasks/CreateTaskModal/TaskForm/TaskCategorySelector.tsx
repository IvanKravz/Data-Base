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
    const baseClasses = "task-category-btn";
    const activeClass = {
      urgent: 'urgent-active',
      planned: 'planned-active',
      attention: 'attention-active'
    }[cat];
    return category === cat ? `${baseClasses} ${activeClass}` : baseClasses;
  };

  const getIconColor = (cat: TaskCategory) => {
    return category === cat ? 'currentColor' : '#6b7280';
  };

  return (
    <div className="modal-task-category">
      <label className="task-form-label">Категория</label>
      <div className="task-category-grid">
        {(Object.entries(taskCategories) as [TaskCategory, { label: string }][]).map(([value, { label }]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={getCategoryStyle(value)}
            aria-pressed={category === value}
          >
            <span className="task-category-icon">
              {value === 'urgent' && <AlertTriangle size={18} color={getIconColor(value)} />}
              {value === 'planned' && <Clock size={18} color={getIconColor(value)} />}
              {value === 'attention' && <AlertCircle size={18} color={getIconColor(value)} />}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}