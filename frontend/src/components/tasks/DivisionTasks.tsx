import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Division, Task } from '../../types';
import { TaskCard } from './TaskCard/TaskCard';
import { isTaskCompleted } from '../../types/taskCategories';

interface DivisionTasksProps {
  division: Division;
  tasks: Task[];
  onDeleteTask?: (taskId: string) => void;
}

export function DivisionTasks({ division, tasks, onDeleteTask }: DivisionTasksProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedTasks = tasks.filter(task => isTaskCompleted(task)).length;
  const progress = tasks.length > 0 
    ? (completedTasks / tasks.length) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            <h2 className="text-lg font-semibold text-gray-900">{division.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-700 ease-out transform origin-left"
                style={{ 
                  width: `${progress}%`,
                  transform: `scaleX(${progress === 0 ? 0 : 1})` 
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-700">
              {completedTasks}
            </div>
            <div className="text-sm text-gray-500">
              из {tasks.length} задач
            </div>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="p-4 space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onDelete={onDeleteTask}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              Нет активных задач
            </p>
          )}
        </div>
      </div>
    </div>
  );
}