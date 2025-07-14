import React from 'react';
import { TaskCategory } from '../../../../types/taskCategories';
import '../style.css';

interface Task {
  id: string;
  category: TaskCategory;
  is_completed: boolean;
}

interface TaskCategoryFilterProps {
  tasks?: Task[];
  selectedCategory: TaskCategory | 'all' | 'completed';
  onCategoryChange: (category: TaskCategory | 'all' | 'completed') => void;
}

export function TaskCategoryFilter({
  tasks,
  selectedCategory,
  onCategoryChange
}: TaskCategoryFilterProps) {
  const counts = React.useMemo(() => ({
    all: tasks?.filter(task => !task.is_completed).length, // Только незавершенные
    completed: tasks?.filter(task => task.is_completed).length,
    urgent: tasks?.filter(task => !task.is_completed && task.category === 'urgent').length,
    planned: tasks?.filter(task => !task.is_completed && task.category === 'planned').length,
    attention: tasks?.filter(task => !task.is_completed && task.category === 'attention').length,
  }), [tasks]);


  return (
    <div className="flex flex-wrap gap-2">
      {/* Все задачи */}
      <button
        onClick={() => onCategoryChange('all')}
        className={`tasks-category-button ${selectedCategory === 'all' ? 'tasks-category-button-active' : ''}`}
      >
        <span>Все</span>
        <span className="tasks-category-count">{counts.all}</span>
      </button>

      {/* Срочные */}
      <button
        onClick={() => onCategoryChange('urgent')}
        className={`tasks-category-button ${selectedCategory === 'urgent' ? 'tasks-category-button-active' : ''} ${counts.urgent === 0 ? 'opacity-70' : 'hover:bg-gray-50'}`}
        disabled={counts.urgent === 0}
      >
        <span>Срочные</span>
        <span className="tasks-category-count">{counts.urgent}</span>
      </button>

      {/* Запланированные */}
      <button
        onClick={() => onCategoryChange('planned')}
        className={`tasks-category-button ${selectedCategory === 'planned' ? 'tasks-category-button-active' : ''} ${counts.planned === 0 ? 'opacity-70' : 'hover:bg-gray-50'}`}
        disabled={counts.planned === 0}
      >
        <span>Запланированные</span>
        <span className="tasks-category-count">{counts.planned}</span>
      </button>

      {/* Требуют внимания */}
      <button
        onClick={() => onCategoryChange('attention')}
        className={`tasks-category-button ${selectedCategory === 'attention' ? 'tasks-category-button-active' : ''} ${counts.attention === 0 ? 'opacity-70' : 'hover:bg-gray-50'}`}
        disabled={counts.attention === 0}
      >
        <span>Требуют внимания</span>
        <span className="tasks-category-count">{counts.attention}</span>
      </button>

      {/* Завершенные */}
      <button
        onClick={() => onCategoryChange('completed')}
        className={`tasks-category-button ${selectedCategory === 'completed' ? 'tasks-category-button-active' : ''} ${counts.completed === 0 ? 'opacity-70' : 'hover:bg-gray-50'}`}
        disabled={counts.completed === 0}
      >
        <span>Завершённые</span>
        <span className="tasks-category-count">{counts.completed}</span>
      </button>
    </div>
  );
}