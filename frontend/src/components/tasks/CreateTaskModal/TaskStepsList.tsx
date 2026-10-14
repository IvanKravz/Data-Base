import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, ChevronDown } from 'lucide-react';
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
  // Какие этапы раскрыты. По умолчанию раскрыт только что добавленный.
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (justAddedId !== null) {
      const timer = setTimeout(() => setJustAddedId(null), 350);
      return () => clearTimeout(timer);
    }
  }, [justAddedId]);

  const handleAddStep = () => {
    const newId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newSteps = [
      ...steps,
      {
        name: '',
        comments: '',
        startDate: '',
        endDate: '',
        id: newId,
        is_completed: false,
      },
    ];
    onStepsChange(newSteps);
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.add(newId);
      return next;
    });
    setJustAddedId(newId);
  };

  const handleRemoveStep = (index: number) => {
    const stepToRemove = steps[index];
    const newSteps = steps.filter((_, i) => i !== index);
    onStepsChange(newSteps);
    if (stepToRemove?.id) {
      setOpenIds((prev) => {
        const next = new Set(prev);
        next.delete(stepToRemove.id as string);
        return next;
      });
    }
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

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const formatDateForServer = (dateString: string): string => {
    if (!dateString) return '';
    return `${dateString}T00:00:00`;
  };

  const formatDateShort = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="task-form-card">
      <div className="task-form-card-title">
        <span>Этапы выполнения</span>
        {steps.length > 0 && (
          <span className="task-form-card-title-count">{steps.length}</span>
        )}
      </div>

      <div className="task-steps-container">
        {steps.length > 0 && (
          <div className="task-steps-list">
            {steps.map((step, index) => {
              const key = step.id || `step-${index}`;
              const isOpen = openIds.has(key);
              const hasName = step.name.trim().length > 0;
              const hasDates = !!step.startDate && !!step.endDate;
              const hasComments = !!step.comments && step.comments.trim().length > 0;

              return (
                <div
                  key={key}
                  className={`task-step-row ${isOpen ? 'task-step-row-open' : ''} ${
                    justAddedId === key ? 'task-step-row-new' : ''
                  }`}
                >
                  <div
                    className="task-step-row-header"
                    onClick={() => toggleOpen(key)}
                  >
                    <span className="task-step-row-number">{index + 1}</span>

                    <div className="task-step-row-info">
                      <div className={`task-step-row-name ${!hasName ? 'task-step-row-name-placeholder' : ''}`}>
                        {hasName ? step.name : 'Новый этап'}
                      </div>
                      <div className="task-step-row-summary">
                        {hasDates ? (
                          <>
                            <span>
                              {formatDateShort(step.startDate)} — {formatDateShort(step.endDate)}
                            </span>
                            {hasComments && (
                              <>
                                <span className="task-step-row-summary-sep">·</span>
                                <span>{step.comments.slice(0, 40)}{step.comments.length > 40 ? '…' : ''}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <span>Даты не заданы</span>
                        )}
                      </div>
                    </div>

                    <div className="task-step-row-actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStep(index);
                        }}
                        className="task-step-icon-btn task-step-icon-btn-danger"
                        aria-label={`Удалить этап ${index + 1}`}
                        title="Удалить этап"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="task-step-icon-btn task-step-icon-btn-chevron"
                        aria-label={isOpen ? 'Свернуть этап' : 'Развернуть этап'}
                        tabIndex={-1}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="task-step-row-body">
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
                          placeholder="Например: подготовить черновик"
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
                          placeholder="Дополнительные детали (необязательно)"
                          rows={2}
                        />
                      </div>

                      <div className="task-step-dates-grid">
                        <div className="task-step-field">
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
                              onChange={(e) =>
                                handleStepChange(
                                  index,
                                  'startDate',
                                  formatDateForServer(e.target.value)
                                )
                              }
                              className="task-form-input task-step-date-input"
                            />
                          </div>
                        </div>

                        <div className="task-step-field">
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
                              onChange={(e) =>
                                handleStepChange(
                                  index,
                                  'endDate',
                                  formatDateForServer(e.target.value)
                                )
                              }
                              className="task-form-input task-step-date-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {steps.length === 0 ? (
          <div className="task-steps-empty-state">
            <div className="task-steps-empty-title">Пока нет этапов</div>
            <div className="task-steps-empty-text">
              Разбейте задачу на этапы — так её будет проще отслеживать
            </div>
            <button
              type="button"
              onClick={handleAddStep}
              className="task-step-add-first-btn"
            >
              <Plus className="task-step-add-first-icon" />
              Добавить первый этап
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddStep}
            className="task-step-add-last-btn"
          >
            <Plus className="task-step-add-last-icon" />
            Добавить этап
          </button>
        )}
      </div>
    </div>
  );
}