import React from 'react';
import { format } from 'date-fns';
import { Task } from '../../../../types/tasks';
import { divisions } from '../../../../data/divisionsData';

interface TaskInfoProps {
  task: Task;
}

export function TaskInfo({ task }: TaskInfoProps) {
  const division = divisions.find(d => d.id === task.divisionId);
  const completedSteps = task.steps.filter(step => step.isCompleted).length;
  const progress = (completedSteps / task.steps.length) * 100;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">
            Прогресс выполнения
          </h3>
          <span className="text-sm text-gray-600">
            {completedSteps} из {task.steps.length} этапов
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Подразделение</p>
          <p className="font-medium text-gray-900">{division?.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Создано</p>
          <p className="font-medium text-gray-900">
            {format(new Date(task.createdAt), 'dd.MM.yyyy HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
}