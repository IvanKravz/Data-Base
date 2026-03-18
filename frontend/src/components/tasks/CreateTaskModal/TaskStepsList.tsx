import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { TaskStep } from '../../../types/tasks';
import './style.css';

interface StepFormData {
  id?: string;
  name: string;
  comments: string;
  startDate: string;
  endDate: string;
  is_completed?: boolean;
  completed_by?: any;
  completed_at?: string;
}

interface TaskStepsListProps {
  steps: StepFormData[];
  onStepsChange: (steps: StepFormData[]) => void;
}

export function TaskStepsList({ steps, onStepsChange }: TaskStepsListProps) {
  const [newStepIndex, setNewStepIndex] = useState<number | null>(null);
  
  useEffect(() => {
    if (newStepIndex !== null) {
      const timer = setTimeout(() => setNewStepIndex(null), 300);
      return () => clearTimeout(timer);
    }
  }, [newStepIndex]);

  const handleAddStep = () => {
    const newSteps = [
      ...steps,
      { 
        name: '', 
        comments: '', 
        startDate: '', 
        endDate: '',
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        is_completed: false, 
      }
    ];
    onStepsChange(newSteps);
    setNewStepIndex(newSteps.length - 1);
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
    return dateString.split('T')[0];
  };

  const formatDateForServer = (dateString: string): string => {
    if (!dateString) return '';
    return `${dateString}T00:00:00`;
  };

  return (
    <div className="task-steps-container">
      <div className="task-steps-header">
        <h3 className="task-steps-title">Этапы выполнения задачи</h3>
      </div>

      <div className="task-steps-list">
        {steps.map((step, index) => (
          <div 
            key={step.id || `step-${index}`}
            className={`task-step-card ${newStepIndex === index ? 'task-step-card-new' : ''}`}
          >
            <button
              type="button"
              onClick={() => handleRemoveStep(index)}
              className="task-step-delete-btn"
              aria-label={`Удалить этап ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <div className="task-step-header">
              <div className="task-step-number">{index + 1}</div>
              <h4 className="task-step-title">Этап {index + 1}</h4>
            </div>

            <div className="task-step-content">
              <div className="task-step-field">
                <label className="task-form-label" htmlFor={`step-name-${index}`}>
                  Название этапа
                </label>
                <input
                  id={`step-name-${index}`}
                  type="text"
                  required
                  value={step.name}
                  onChange={(e) => handleStepChange(index, 'name', e.target.value)}
                  className="task-form-input"
                  placeholder="Введите название этапа"
                />
              </div>

              <div className="task-step-field">
                <label className="task-form-label" htmlFor={`step-comments-${index}`}>
                  Комментарий
                </label>
                <textarea
                  id={`step-comments-${index}`}
                  value={step.comments}
                  onChange={(e) => handleStepChange(index, 'comments', e.target.value)}
                  className="task-form-input"
                  placeholder="Добавьте комментарий к этапу"
                  rows={3}
                />
              </div>

              <div className="task-step-dates-grid">
                <div className="task-step-date-field">
                  <label className="task-form-label" htmlFor={`step-start-${index}`}>
                    Дата начала
                  </label>
                  <div className="task-step-date-input-container">
                    <Calendar className="task-step-date-icon" />
                    <input
                      id={`step-start-${index}`}
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
                
                <div className="task-step-date-field">
                  <label className="task-form-label" htmlFor={`step-end-${index}`}>
                    Дата окончания
                  </label>
                  <div className="task-step-date-input-container">
                    <Calendar className="task-step-date-icon" />
                    <input
                      id={`step-end-${index}`}
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
          </div>
        ))}
      </div>

      {steps.length === 0 ? (
        <div className="task-steps-empty-state">
          <button
            type="button"
            onClick={handleAddStep}
            className="task-step-add-first-btn"
          >
            <Plus className="task-step-add-first-icon" />
            Создать первый этап
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAddStep}
          className="task-step-add-last-btn"
        >
          <Plus className="task-step-add-last-icon" />
          Добавить новый этап
        </button>
      )}
    </div>
  );
}