// TaskItem.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Pencil, Trash2, Lock, ChevronDown, ChevronUp, X, Crown, ListTodo } from 'lucide-react';
import { Task } from '../../../../types/tasks';
import './TaskItem.css';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';

interface TaskItemProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStep: (taskId: string, stepId: string, isCompleted: boolean) => void;
  index?: number;
}

export const TaskItem = React.memo(({ task, onEditTask, onDeleteTask, onToggleStep, index }: TaskItemProps) => {
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [progressHovered, setProgressHovered] = useState(false);
  const [localSteps, setLocalSteps] = useState(task.steps);
  const { canEditTask, canDeleteTask, getCurrentUser } = useAppPermissions();

  // Форматирование дат
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Обновление локальных шагов при изменении пропса
  useEffect(() => {
    setLocalSteps(task.steps);
  }, [task.steps, task.id]);

  const currentUser = getCurrentUser();

  const isCompleted = useMemo(() =>
    localSteps.length > 0 && localSteps.every(step => step.is_completed),
    [localSteps]
  );

  const { badgeClass, badgeText } = useMemo(() => {
    if (isCompleted) {
      return { badgeClass: 'tasks-badge-completed', badgeText: 'Завершено' };
    }
    switch (task.category) {
      case 'urgent':
        return { badgeClass: 'tasks-badge-urgent', badgeText: 'Срочно' };
      case 'planned':
        return { badgeClass: 'tasks-badge-planned', badgeText: 'Запланировано' };
      default:
        return { badgeClass: 'tasks-badge-attention', badgeText: 'Требует внимания' };
    }
  }, [isCompleted, task.category]);

  const canEdit = canEditTask(task, currentUser);
  const canDelete = canDeleteTask(task, currentUser);

  const isCreatorLeader = task.created_by?.roles?.includes('director') ||
    task.created_by?.roles?.includes('deputy_director');

  const completedStepsCount = localSteps.filter(s => s.is_completed).length;
  const progressPercentage = localSteps.length > 0 ? (completedStepsCount / localSteps.length) * 100 : 0;

  // Вычисляем общий диапазон дат задачи на основе шагов
  const taskDateRange = useMemo(() => {
    if (!localSteps.length) return null;
    const startDates = localSteps.map(s => new Date(s.start_date).getTime());
    const endDates = localSteps.map(s => new Date(s.end_date).getTime());
    const minStart = new Date(Math.min(...startDates));
    const maxEnd = new Date(Math.max(...endDates));
    return {
      start: formatDate(minStart.toISOString()),
      end: formatDate(maxEnd.toISOString())
    };
  }, [localSteps]);

  const handleStepToggle = (stepId: string, currentCompleted: boolean) => {
    onToggleStep(task.id, stepId, currentCompleted);
  };

  const lastCompletedStep = localSteps
    .filter(step => step.is_completed && step.completed_by && step.completed_at)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];

  return (
    <>
      <div className={`tasks-list-item ${isCompleted ? 'tasks-completed' : ''}`}>
        {index !== undefined && (
          <div className="task-item-index" aria-label={`Задача №${index}`}>
            {index}
          </div>
        )}
        <div className="tasks-item-content">
          {/* Верхняя часть: бейдж, заголовок, даты и действия */}
          <div className="tasks-item-header">
            <div className="tasks-badge-wrapper">
              <span className={`tasks-badge ${badgeClass}`}>{badgeText}</span>
              {isCreatorLeader && (
                <Crown className="tasks-creator-crown" size={16} title="Создано руководителем" />
              )}
              {taskDateRange && (
                <div className="tasks-dates">
                  <span className="tasks-date">
                    <div className="task-date-label">Начало:</div> {taskDateRange.start}
                  </span>
                  <span className="tasks-date">
                    <div className="task-date-label">Окончание:</div> {taskDateRange.end}
                  </span>
                </div>
              )}
            </div>
            <div className="tasks-item-actions">
              {canEdit && (
                <button
                  onClick={() => onEditTask(task)}
                  className="tasks-action-button tasks-action-edit"
                  aria-label="Редактировать задачу"
                >
                  <Pencil size={14} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="tasks-action-button tasks-action-delete"
                  aria-label="Удалить задачу"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Заголовок и даты задачи */}
          <div className="tasks-title-row">
            <h3 className="tasks-item-title">
              {task.title}
              {task.is_private && <Lock size={14} className="tasks-private-icon" />}
            </h3>

          </div>

          {/* Прогресс и кнопка "Этапы" */}
          <div className="tasks-progress-row">
            <div className="tasks-progress-container">
              <span className="tasks-progress-text">
                Выполнено {completedStepsCount} из {localSteps.length} этапов
              </span>
              <div
                className="tasks-progress-bar"
                onMouseEnter={() => setProgressHovered(true)}
                onMouseLeave={() => setProgressHovered(false)}
              >
                <div
                  className="tasks-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
                {progressHovered && (
                  <span className="tasks-progress-hover-text">{Math.round(progressPercentage)}%</span>
                )}
              </div>
            </div>
            <button
              className="tasks-steps-toggle-button"
              onClick={() => setStepsExpanded(true)}
            >
              <ListTodo size={16} />
              <span>Этапы</span>
            </button>
          </div>

          {/* Кнопка раскрытия дополнительной информации */}
          <button
            className="tasks-details-toggle"
            onClick={() => setDetailsExpanded(!detailsExpanded)}
          >
            <span>Подробнее</span>
            {detailsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Блок дополнительной информации (раскрывающийся) */}
          {detailsExpanded && (
            <div className="tasks-details-panel">
              {/* Подразделение / отделение */}
              <div className="tasks-detail-row">
                <span className="tasks-detail-label">Подразделение:</span>
                <span className="tasks-detail-value">
                  {task.division?.name || '—'} {task.subdivision?.name ? `/ ${task.subdivision.name}` : ''}
                </span>
              </div>

              {/* Кто создал */}
              {task.created_by && (
                <div className="tasks-detail-row">
                  <span className="tasks-detail-label">Создал:</span>
                  <span className="tasks-detail-value">
                    {task.created_by.username} ({formatDateTime(task.created_at)})
                    {(task.created_by.roles?.includes('director') || task.created_by.roles?.includes('deputy_director')) && (
                      <Crown size={12} className="tasks-detail-crown" title="Руководитель" />
                    )}
                  </span>
                </div>
              )}

              {/* Последнее изменение */}
              {task.updated_by && task.updated_at && (
                <div className="tasks-detail-row">
                  <span className="tasks-detail-label">Изменено:</span>
                  <span className="tasks-detail-value">
                    {task.updated_by.username} ({formatDateTime(task.updated_at)})
                    {(task.updated_by.roles?.includes('director') || task.updated_by.roles?.includes('deputy_director')) && (
                      <Crown size={12} className="tasks-detail-crown" title="Руководитель" />
                    )}
                  </span>
                </div>
              )}

              {/* Приватность */}
              {task.is_private && (
                <div className="tasks-detail-row">
                  <span className="tasks-detail-label">Приватная задача</span>
                </div>
              )}

              {/* Кто завершил (если задача полностью выполнена) */}
              {isCompleted && lastCompletedStep && (
                <div className="tasks-detail-row">
                  <span className="tasks-detail-label">Завершил:</span>
                  <span className="tasks-detail-value">
                    {lastCompletedStep.completed_by.username} ({formatDateTime(lastCompletedStep.completed_at)})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно с этапами (без изменений) */}
      {stepsExpanded && (
        <>
          <div className="tasks-steps-backdrop" onClick={() => setStepsExpanded(false)} />
          <div className="tasks-steps-container">
            <div className="tasks-steps-header">
              <div className="tasks-steps-header-left">
                <h3 className="tasks-steps-title">{task.title}</h3>
                <div className="tasks-steps-subtitle">
                  <span>Этапы выполнения:</span>
                  {task.is_private && <Lock size={14} className="tasks-steps-icon" />}
                  {isCreatorLeader && <Crown size={14} className="tasks-steps-icon tasks-steps-crown" title="Создано руководителем" />}
                </div>
              </div>
              <button
                className="tasks-steps-close"
                onClick={() => setStepsExpanded(false)}
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>

            <div className="tasks-steps-content">
              <div className="tasks-steps-list">
                {localSteps.map((step, index) => (
                  <div key={step.id || `step-${index}`} className="tasks-step">
                    <div
                      className={`tasks-step-indicator ${step.is_completed ? 'tasks-step-completed' : ''}`}
                      onClick={() => handleStepToggle(step.id, step.is_completed)}
                    />
                    <div className="tasks-step-details">
                      <p className={`tasks-step-name ${step.is_completed ? 'tasks-step-completed-text' : ''}`}>
                        {step.name}
                      </p>
                      <p className="tasks-step-time">
                        {formatDate(step.start_date)} – {formatDate(step.end_date)}
                      </p>
                      {step.comments && <p className="tasks-step-comments">{step.comments}</p>}

                      {step.is_completed && step.completed_by && (
                        <p className="tasks-step-completed-info">
                          Выполнил: {step.completed_by.username} ({formatDateTime(step.completed_at)})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
});

TaskItem.displayName = 'TaskItem';