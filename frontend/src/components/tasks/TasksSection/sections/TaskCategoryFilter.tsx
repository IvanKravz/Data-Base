import React from 'react';
import { Task } from '../../../../types/tasks';
import { TaskCategory } from '../../../../types/taskCategories';
import { TaskCategoryButtons } from '../../TaskCategoryButtons';

interface TaskCategoryFilterProps {
  tasks: Task[];
  selectedDivision: string;
  selectedCategory: TaskCategory | 'all' | 'completed';
  onCategoryChange: (category: TaskCategory | 'all' | 'completed') => void;
}

export function TaskCategoryFilter({
  tasks,
  selectedDivision,
  selectedCategory,
  onCategoryChange
}: TaskCategoryFilterProps) {
  return (
    <TaskCategoryButtons
      tasks={tasks}
      selectedDivision={selectedDivision}
      selectedCategory={selectedCategory}
      onCategoryChange={onCategoryChange}
    />
  );
}