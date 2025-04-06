import React from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { TaskStep } from '../../../types/tasks';

interface TaskStepsListProps {
  steps: TaskStep[];
  onStepsChange: (steps: TaskStep[]) => void;
}

export function TaskStepsList({ steps, onStepsChange }: TaskStepsListProps) {
  const handleAddStep = () => {
    onStepsChange([
      ...steps,
      { id: '', name: '', comments: '', startDate: '', endDate: '', isCompleted: false }
    ]);
  };

  const handleRemoveStep = (index: number) => {
    onStepsChange(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: keyof TaskStep, value: string | boolean) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onStepsChange(newSteps);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">
          Этапы выполнения задачи
        </h3>
        <button
          type="button"
          onClick={handleAddStep}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-blue-600 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить этап</span>
        </button>
      </div>

      {steps.map((step, index) => (
        <div key={index} className="space-y-3 p-4 border border-gray-200 rounded-lg relative">
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => handleRemoveStep(index)}
              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="font-medium text-gray-900">
            Этап {index + 1}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Название этапа
            </label>
            <input
              type="text"
              required
              value={step.name}
              onChange={(e) => handleStepChange(index, 'name', e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Введите название этапа"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Комментарий
            </label>
            <textarea
              value={step.comments}
              onChange={(e) => handleStepChange(index, 'comments', e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              rows={2}
              placeholder="Добавьте комментарий к этапу"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Дата начала
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={step.startDate}
                  onChange={(e) => handleStepChange(index, 'startDate', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 pl-3 pr-10 py-2"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Дата окончания
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={step.endDate}
                  onChange={(e) => handleStepChange(index, 'endDate', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 pl-3 pr-10 py-2"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      ))}

      {steps.length === 0 && (
        <div className="text-center py-4 border border-gray-200 rounded-lg text-gray-500">
          Добавьте этапы выполнения задачи
        </div>
      )}
    </div>
  );
}