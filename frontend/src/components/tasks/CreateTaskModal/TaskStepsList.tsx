import React from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { TaskStep } from '../../../types/tasks';
import './style.css';

interface TaskStepsListProps {
  steps: Omit<TaskStep, 'id' | 'isCompleted'>[];
  onStepsChange: (steps: Omit<TaskStep, 'id' | 'isCompleted'>[]) => void;
}

export function TaskStepsList({ steps, onStepsChange }: TaskStepsListProps) {
  const handleAddStep = () => {
    onStepsChange([
      ...steps,
      { name: '', comments: '', startDate: '', endDate: '' }
    ]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onStepsChange(newSteps);
  };

  const handleStepChange = (
    index: number,
    field: keyof Omit<TaskStep, 'id' | 'isCompleted'>,
    value: string
  ) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onStepsChange(newSteps);
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    return dateString.split('T')[0]; // Преобразуем из формата datetime-local в date
  };

  const formatDateForServer = (dateString: string): string => {
    if (!dateString) return '';
    return `${dateString}T00:00`; // Добавляем время для совместимости с datetime-local
  };

  return (
    <div className="task-steps-container">
      <div className="task-steps-header">
        <h3 className="task-steps-title">
          Этапы выполнения задачи
        </h3>
        <button
          type="button"
          onClick={handleAddStep}
          className="task-steps-add-btn"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить этап</span>
        </button>
      </div>

      {steps.map((step, index) => (
        <div key={index} className="task-step-card">
          <div className="task-step-delete-btn-container">
            <button
              type="button"
              onClick={() => handleRemoveStep(index)}
              className="task-step-delete-btn"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="task-step-title">
            Этап {index + 1}
          </div>

          <div>
            <label className="task-form-label">
              Название этапа
            </label>
            <input
              type="text"
              required
              value={step.name}
              onChange={(e) => handleStepChange(index, 'name', e.target.value)}
              className="task-form-input"
              placeholder="Введите название этапа"
            />
          </div>

          <div>
            <label className="task-form-label">
              Комментарий
            </label>
            <textarea
              value={step.comments}
              onChange={(e) => handleStepChange(index, 'comments', e.target.value)}
              className="task-form-input"
              rows={2}
              placeholder="Добавьте комментарий к этапу"
            />
          </div>

          <div className="task-step-dates-grid">
            <div>
              <label className="task-form-label-date">
                Дата начала
              </label>
              <div className="task-step-date-input-container">
                <input
                  type="date"
                  required
                  value={formatDateForInput(step.startDate)}
                  onChange={(e) => handleStepChange(
                    index,
                    'startDate',
                    formatDateForServer(e.target.value)
                  )}
                  className="task-step-date-input"
                />
              </div>
            </div>
            <div>
              <label className="task-form-label-date">
                Дата окончания
              </label>
              <div className="task-step-date-input-container">
                <input
                  type="date"
                  required
                  value={formatDateForInput(step.endDate)}
                  onChange={(e) => handleStepChange(
                    index,
                    'endDate',
                    formatDateForServer(e.target.value)
                  )}
                  className="task-step-date-input"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {steps.length === 0 && (
        <div className="task-steps-empty-state">
          Добавьте этапы выполнения задачи
        </div>
      )}
    </div>
  );
}