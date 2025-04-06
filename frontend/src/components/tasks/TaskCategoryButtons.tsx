import React from 'react';
import { AlertTriangle, Clock, AlertCircle, CheckCircle2, ListTodo } from 'lucide-react';
import { TaskCategory, taskCategories, isTaskCompleted } from '../../types/taskCategories';
import { Task } from '../../types/tasks';

interface TaskCategoryButtonsProps {
  tasks: Task[];
  selectedDivision: string;
  selectedCategory: TaskCategory | 'all' | 'completed';
  onCategoryChange: (category: TaskCategory | 'all' | 'completed') => void;
}

export function TaskCategoryButtons({
  tasks, 
  selectedDivision,
  selectedCategory, 
  onCategoryChange 
}: TaskCategoryButtonsProps) {
  // Filter tasks by division first
  const divisionTasks = selectedDivision === 'all'
    ? tasks
    : tasks.filter(task => task.divisionId === selectedDivision);

  const getCategoryCount = (category: TaskCategory | 'all' | 'completed') => {
    if (category === 'all') {
      return divisionTasks.length;
    }
    if (category === 'completed') {
      return divisionTasks.filter(task => isTaskCompleted(task)).length;
    }
    return divisionTasks.filter(task => 
      task.category === category && !isTaskCompleted(task)
    ).length;
  };

  const buttons = [
    {
      key: 'all',
      category: 'all' as const,
      label: 'Все задачи',
      icon: ListTodo,
      count: getCategoryCount('all'),
      styles: {
        base: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200',
        hover: 'hover:from-gray-100 hover:to-gray-200',
        active: 'ring-2 ring-gray-400 shadow-lg',
        icon: 'text-gray-600',
        badge: 'bg-gray-100 text-gray-700'
      }
    },
    ...Object.entries(taskCategories).map(([category, { label, color }]) => ({
      key: category,
      category: category as TaskCategory,
      label,
      icon: getCategoryIcon(category as TaskCategory),
      count: getCategoryCount(category as TaskCategory),
      styles: {
        base: `bg-gradient-to-br from-${color}-50 to-${color}-100 border-${color}-200`,
        hover: `hover:from-${color}-100 hover:to-${color}-200`,
        active: `ring-2 ring-${color}-400 shadow-lg`,
        icon: `text-${color}-600`,
        badge: `bg-${color}-100 text-${color}-700`
      }
    })),
    {
      key: 'completed',
      category: 'completed' as const,
      label: 'Выполнено',
      icon: CheckCircle2,
      count: getCategoryCount('completed'),
      styles: {
        base: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
        hover: 'hover:from-green-100 hover:to-green-200',
        active: 'ring-2 ring-green-400 shadow-lg',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-700'
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {buttons.map(({ key, category, label, icon: Icon, count, styles }) => (
        <button
          key={key}
          onClick={() => onCategoryChange(category)}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${styles.base} ${styles.hover}
            ${selectedCategory === category ? styles.active : ''}
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${styles.icon} transition-transform duration-300 ${
              selectedCategory === category ? 'scale-110' : ''
            }`} />
            <span className="font-medium">{label}</span>
          </div>
          <span className={`
            px-2 py-1 text-sm rounded-full
            transition-all duration-300
            ${styles.badge}
            ${selectedCategory === category ? 'scale-110 font-medium' : ''}
          `}>
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}

function getCategoryIcon(category: TaskCategory) {
  switch (category) {
    case 'urgent':
      return AlertTriangle;
    case 'planned':
      return Clock;
    case 'attention':
      return AlertCircle;
  }
}