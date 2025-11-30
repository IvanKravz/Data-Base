// TaskItem.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Pencil, Trash2, Lock, ChevronDown, ChevronUp, X, ListTodo, Crown } from 'lucide-react';
import { Task } from '../../../../types/tasks';
import './TaskItem.css';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';

interface TaskItemProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStep: (taskId: string, stepId: string, isCompleted: boolean) => void;
}

export const TaskItem = React.memo(({ task, onEditTask, onDeleteTask, onToggleStep }: TaskItemProps) => {
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [progressHovered, setProgressHovered] = useState(false);
  const [localSteps, setLocalSteps] = useState(task.steps);
  const { canEditTask, canDeleteTask, getCurrentUser } = useAppPermissions();

  // Функции форматирования дат
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

  // ОТЛАДКА: Логируем получение новых этапов
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

  // Проверка прав на действие с учетом ролей
  const canEdit = canEditTask(task, currentUser);
  const canDelete = canDeleteTask(task, currentUser);

  // Проверка, является ли создатель руководителем
  const isCreatorLeader = task.created_by?.roles?.includes('director') ||
    task.created_by?.roles?.includes('deputy_director');

  const completedStepsCount = localSteps.filter(s => s.is_completed).length;
  const progressPercentage = localSteps.length > 0 ? (completedStepsCount / localSteps.length) * 100 : 0;

  const handleStepToggle = (stepId: string, currentCompleted: boolean) => {
    onToggleStep(task.id, stepId, currentCompleted);
  };

  const lastCompletedStep = localSteps
    .filter(step => step.is_completed && step.completed_by && step.completed_at)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];

  return (
    <>
      <div className={`tasks-list-item ${isCompleted ? 'tasks-completed' : ''}`}>
        <div className="tasks-item-content">
          <div className="tasks-item-main">
            <div className="tasks-item-header">
              <div className="tasks-badge-wrapper">
                <span className={`tasks-badge ${badgeClass}`}>
                  {badgeText}
                </span>
                {isCreatorLeader && (
                  <Crown className="inline-block ml-2 h-4 w-4 text-yellow-500" title="Создано руководителем" />
                )}
              </div>
              <div className="tasks-item-actions">
                {canEdit && (
                  <button
                    onClick={() => onEditTask(task)}
                    className="tasks-action-button tasks-action-edit"
                    aria-label="Редактировать задачу"
                  >
                    <Pencil className="tasks-action-icon" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="tasks-action-button tasks-action-delete"
                    aria-label="Удалить задачу"
                  >
                    <Trash2 className="tasks-action-icon" />
                  </button>
                )}
              </div>
            </div>
            <div className="tasks-item-title-section">
              <div className="tasks-title-wrapper">
                <h3 className="tasks-item-title">
                  {task.title}
                  {task.is_private && (
                    <Lock className="inline-block ml-2 h-4 w-4 text-gray-500" />
                  )}
                </h3>
              </div>
            </div>

            <div className="tasks-item-header">
              <div className="tasks-meta-info">
                <span className="tasks-meta-label">Подразделение:</span>
                <span className="tasks-meta-value">
                  {task.division.name ? ` ${task.division.name}` : ''} {task.subdivision?.name ? ` / ${task.subdivision?.name}` : ''}
                </span>
              </div>
            </div>

            {task.created_by && (
              <div className="tasks-meta-info">
                <span className="tasks-meta-label">Создал:</span>
                <span className="tasks-meta-value">
                  {task.created_by.username} ({formatDateTime(task.created_at)})
                  {(task.created_by.roles?.includes('director') || task.created_by.roles?.includes('deputy_director')) && (
                    <Crown className="inline-block ml-1 h-3 w-3 text-yellow-500" title="Руководитель" />
                  )}
                </span>
              </div>
            )}

            {task.updated_by && task.updated_at && (
              <div className="tasks-meta-info">
                <span className="tasks-meta-label">Изменено:</span>
                <span className="tasks-meta-value">
                  {task.updated_by.username} ({formatDateTime(task.updated_at)})
                  {(task.updated_by.roles?.includes('director') || task.updated_by.roles?.includes('deputy_director')) && (
                    <Crown className="inline-block ml-1 h-3 w-3 text-yellow-500" title="Руководитель" />
                  )}
                </span>
              </div>
            )}

            {task.is_private && (
              <div className="tasks-meta-info">
                <span className="tasks-meta-label">Приватная задача</span>
              </div>
            )}

            {isCompleted && lastCompletedStep && (
              <div className="tasks-meta-info">
                <span className="tasks-meta-label">Завершил:</span>
                <span className="tasks-meta-value">
                  {lastCompletedStep.completed_by.username} ({formatDateTime(lastCompletedStep.completed_at)})
                </span>
              </div>
            )}

            <div className="tasks-progress-container">
              <span className="tasks-progress-text">
                Выполнено {completedStepsCount} из {localSteps.length} этапов
              </span>
              <div
                className="tasks-progress-bar"
                onMouseEnter={() => setProgressHovered(true)}
                onMouseLeave={() => setProgressHovered(false)}
                onClick={() => setStepsExpanded(true)}
              >
                <div
                  className="tasks-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
                {progressHovered && (
                  <div className="tasks-progress-hover-text">
                    Показать этапы
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно с этапами */}
      {stepsExpanded && (
        <>
          <div
            className="tasks-steps-backdrop"
            onClick={() => setStepsExpanded(false)}
          />
          <div className="tasks-steps-container">
            <button
              className="tasks-steps-close"
              onClick={() => setStepsExpanded(false)}
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>

            <div className="tasks-steps-header">
              <h3 className="tasks-steps-title">{task.title}</h3>
              <div className="tasks-steps-subtitle">
                <span>Этапы выполнения:</span>
                {task.is_private && (
                  <Lock size={14} className="text-gray-500" />
                )}
                {isCreatorLeader && (
                  <Crown size={14} className="text-yellow-500" title="Создано руководителем" />
                )}
              </div>
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
                      {step.comments && (
                        <p className="tasks-step-comments">{step.comments}</p>
                      )}
                      <p className="tasks-step-time">
                        {formatDate(step.start_date)} - {formatDate(step.end_date)}
                      </p>
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