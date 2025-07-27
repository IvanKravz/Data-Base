import React, { useMemo } from 'react';
import { TaskCategory } from '../../../../types/taskCategories';
import '../style.css';

interface Task {
  id: string;
  category: TaskCategory;
  is_completed: boolean;
  is_private?: boolean;
  created_by?: { id: string };
}

interface TaskCategoryFilterProps {
  tasks?: Task[];
  selectedCategory: TaskCategory | 'all' | 'completed';
  onCategoryChange: (category: TaskCategory | 'all' | 'completed') => void;
  showOnlyMine: boolean;
  onToggleMine: () => void;
}

export function TaskCategoryFilter({
  tasks,
  selectedCategory,
  onCategoryChange,
  showOnlyMine,
  onToggleMine,
}: TaskCategoryFilterProps) {
  // const userJson = localStorage.getItem('user');
  const userData = localStorage.getItem('user');
  let currentUserId = null;

  if (userData) {
    try {
      // Пытаемся распарсить как JSON
      const user = JSON.parse(userData);
      // Проверяем разные возможные форматы
      currentUserId = user.id || user?.user?.id || null;
    } catch (e) {
      // Если не JSON, возможно это строка "user:{"id":1}"
      if (userData.startsWith('user:')) {
        try {
          const user = JSON.parse(userData.substring(5));
          currentUserId = user.id;
        } catch (parseError) {
          console.error('Ошибка парсинга user данных:', parseError);
        }
      }
    }
  }

  const sourceTasks = useMemo(() => {
    return tasks || []; // Просто возвращаем все полученные задачи
  }, [tasks]);
  
  const counts = React.useMemo(() => ({
    all: sourceTasks.filter(task => !task.is_completed).length,
    completed: sourceTasks.filter(task => task.is_completed).length,
    urgent: sourceTasks.filter(task => !task.is_completed && task.category === 'urgent').length,
    planned: sourceTasks.filter(task => !task.is_completed && task.category === 'planned').length,
    attention: sourceTasks.filter(task => !task.is_completed && task.category === 'attention').length,
  }), [sourceTasks]);

  return (
    <div className="flex flex-wrap gap-2">
      {/* Все задачи */}
      <button
        onClick={() => onCategoryChange('all')}
        className={`tasks-category-button ${selectedCategory === 'all' ? 'tasks-category-button-active all' : ''}`}
      >
        <span>Все</span>
        <span className="tasks-category-count">{counts.all}</span>
      </button>

      {/* Срочные */}
      <button
        onClick={() => onCategoryChange('urgent')}
        className={`tasks-category-button ${selectedCategory === 'urgent' ? 'tasks-category-button-active urgent' : ''} ${counts.urgent === 0 ? 'opacity-70' : 'hover:bg-gray-50'}`}
        disabled={counts.urgent === 0}
      >
        <span>Срочные</span>
        <span className="tasks-category-count">{counts.urgent}</span>
      </button>

      {/* Запланированные */}
      <button
        onClick={() => onCategoryChange('planned')}
        className={`tasks-category-button ${selectedCategory === 'planned' ? 'tasks-category-button-active planned' : ''} ${counts.planned === 0 ? 'opacity-70' : 'hover:bg-gray-50'}`}
        disabled={counts.planned === 0}
      >
        <span>Запланированные</span>
        <span className="tasks-category-count">{counts.planned}</span>
      </button>

      {/* Требуют внимания */}
      <button
        onClick={() => onCategoryChange('attention')}
        className={`tasks-category-button ${selectedCategory === 'attention' ? 'tasks-category-button-active attention' : ''} ${counts.attention === 0 ? 'opacity-70' : 'hover:bg-gray-50'}`}
        disabled={counts.attention === 0}
      >
        <span>Требуют внимания</span>
        <span className="tasks-category-count">{counts.attention}</span>
      </button>

      {/* Завершенные */}
      <button
        onClick={() => onCategoryChange('completed')}
        className={`tasks-category-button ${selectedCategory === 'completed' ? 'tasks-category-button-active completed' : ''} ${counts.completed === 0 ? 'opacity-70' : 'hover:bg-gray-50'}`}
        disabled={counts.completed === 0}
      >
        <span>Завершённые</span>
        <span className="tasks-category-count">{counts.completed}</span>
      </button>

      {/* Переключатель "Свои задачи" */}
      <button
        onClick={onToggleMine}
        className={`tasks-category-button ${showOnlyMine ? 'tasks-category-button-active mine' : ''}`}
      >
        <span>Свои задачи</span>
        <div className="ml-2 relative inline-flex items-center h-5 w-10">
          <div className={`absolute h-4 w-9 rounded-full transition-colors duration-300 ${showOnlyMine ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          <div className={`absolute h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${showOnlyMine ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
      </button>
    </div>
  );
}