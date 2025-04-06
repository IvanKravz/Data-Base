import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createTask } from '../../../store/thunks/tasksThunks';
import { TaskStepsList } from './TaskStepsList';
import { TaskStep } from '../../../types/tasks';
import { taskCategories, TaskCategory } from '../../../types/taskCategories';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { divisions } from '../../../data/divisionsData';

interface TaskFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function TaskForm({ onSuccess, onError }: TaskFormProps) {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('planned');
  const [divisionId, setDivisionId] = useState(divisions[0].id);
  const [steps, setSteps] = useState<Omit<TaskStep, 'id' | 'isCompleted'>[]>([]);

  const validateDates = (step: Omit<TaskStep, 'id' | 'isCompleted'>): boolean => {
    const start = new Date(step.startDate);
    const end = new Date(step.endDate);
    return start <= end;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      onError('Введите название задачи');
      return;
    }

    if (steps.length === 0) {
      onError('Добавьте хотя бы один этап задачи');
      return;
    }

    // Validate all steps
    for (const step of steps) {
      if (!validateDates(step)) {
        onError('Дата окончания этапа не может быть раньше даты начала');
        return;
      }
    }

    try {
      const taskData = {
        title,
        category,
        divisionId,
        steps: steps.map((step, index) => ({
          ...step,
          id: `new-step-${index}`,
          isCompleted: false
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dispatch(createTask(taskData));
      onSuccess();
    } catch (err) {
      onError('Произошла ошибка при создании задачи');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Название задачи
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Введите название задачи"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Подразделение
          </label>
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            className="block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          >
            {divisions.map(division => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Категория
          </label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.entries(taskCategories) as [TaskCategory, { label: string; color: string }][]).map(([value, { label, color }]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value as TaskCategory)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  category === value
                    ? `bg-${color}-50 text-${color}-700 ring-2 ring-${color}-500 shadow-sm`
                    : `bg-white text-gray-700 border border-gray-200 hover:border-${color}-300 hover:bg-${color}-50/50`
                }`}
              >
                <span className={category === value ? 'text-current' : ''}>
                  {value === 'urgent' && <AlertTriangle className="h-5 w-5" />}
                  {value === 'planned' && <Clock className="h-5 w-5" />}
                  {value === 'attention' && <AlertCircle className="h-5 w-5" />}
                </span>
                <span className="flex-1 text-left">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <TaskStepsList
        steps={steps}
        onStepsChange={setSteps}
      />

      <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onSuccess}
          className="px-6 py-3 text-sm font-medium bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow transition-all"
        >
          Создать задачу
        </button>
      </div>
    </form>
  );
}