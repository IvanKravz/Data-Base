import React, { useState } from 'react';
import { Task, TaskStep } from '../../../../types/tasks';
import { taskCategories } from '../../../../types/taskCategories';
import { divisions } from '../../../../data/divisionsData';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { updateTaskThunk } from '../../../../store/thunks/tasksThunks';

interface EditTaskFormProps {
  task: Task;
  onSubmit: (task: Task) => void;
  onCancel: () => void;
}

export function EditTaskForm({ task, onSubmit, onCancel }: EditTaskFormProps) {
  const [formData, setFormData] = useState(task);
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateTaskThunk({
        taskId: task.id,
        taskData: formData
      }));
      onSubmit(formData);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleAddStep = () => {
    const newStep: TaskStep = {
      id: `new-step-${Date.now()}`,
      name: '',
      comments: '',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date().toISOString().slice(0, 16),
      isCompleted: false
    };

    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const handleRemoveStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
  };

  const handleStepChange = (stepId: string, field: keyof TaskStep, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, [field]: value }
          : step
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Название задачи
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Категория
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Task['category'] })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {Object.entries(taskCategories).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Подразделение
            </label>
            <select
              value={formData.divisionId}
              onChange={(e) => setFormData({ ...formData, divisionId: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Этапы задачи
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

        <div className="space-y-4">
          {formData.steps.map((step) => (
            <div 
              key={step.id}
              className="p-4 rounded-lg border border-gray-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Название этапа
                    </label>
                    <input
                      type="text"
                      required
                      value={step.name}
                      onChange={(e) => handleStepChange(step.id, 'name', e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Комментарий
                    </label>
                    <textarea
                      value={step.comments}
                      onChange={(e) => handleStepChange(step.id, 'comments', e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                      rows={2}
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
                          onChange={(e) => handleStepChange(step.id, 'startDate', e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 pl-3 pr-10 py-2"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                          onChange={(e) => handleStepChange(step.id, 'endDate', e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 pl-3 pr-10 py-2"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveStep(step.id)}
                  className="p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {formData.steps.length === 0 && (
            <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              Добавьте этапы выполнения задачи
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}