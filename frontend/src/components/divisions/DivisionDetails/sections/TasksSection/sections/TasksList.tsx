import React from 'react';
import { TaskItem } from './TaskItem';
import { Task } from '../../../../../../types/tasks';
import '../DivisionTasksSection.css';

interface TasksListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStep: (taskId: string, stepId: string, isCompleted: boolean) => void;
}

export function TasksList({
  tasks,
  onEditTask,
  onDeleteTask,
  onToggleStep,
}: TasksListProps) {
  return (
    <div className="tasks-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onToggleStep={onToggleStep}
        />
      ))}
    </div>
  );
}