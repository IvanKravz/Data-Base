import React, { useMemo, useState, useEffect } from 'react';
import { Pencil, Trash2, Lock, ChevronDown, ChevronUp, Crown, ListTodo, Calendar, Users, Info } from 'lucide-react';
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
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [progressHovered, setProgressHovered] = useState(false);
  const [localSteps, setLocalSteps] = useState(task.steps);
  const { canEditTask, canDeleteTask, getCurrentUser } = useAppPermissions();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    setLocalSteps(task.steps);
  }, [task.steps, task.id]);

  const currentUser = getCurrentUser();
  const isCompleted = useMemo(
    () => localSteps.length > 0 && localSteps.every((step) => step.is_completed),
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

  const completedStepsCount = localSteps.filter((s) => s.is_completed).length;
  const progressPercentage = localSteps.length > 0 ? (completedStepsCount / localSteps.length) * 100 : 0;

  const taskDateRange = useMemo(() => {
    if (!localSteps.length) return null;
    const startDates = localSteps.map((s) => new Date(s.start_date).getTime());
    const endDates = localSteps.map((s) => new Date(s.end_date).getTime());
    const minStart = new Date(Math.min(...startDates));
    const maxEnd = new Date(Math.max(...endDates));
    const diffDays = Math.ceil((maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24));
    return {
      start: formatDate(minStart.toISOString()),
      end: formatDate(maxEnd.toISOString()),
      durationDays: diffDays,
    };
  }, [localSteps]);

  const handleStepToggle = (stepId: string, currentCompleted: boolean) => {
    onToggleStep(task.id, stepId, currentCompleted);
  };

  const lastCompletedStep = localSteps
    .filter((step) => step.is_completed && step.completed_by && step.completed_at)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];

  const toggleDetails = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.tasks-icon-btn') || target.closest('.tasks-steps-toggle-btn') || target.closest('.tasks-step-checkbox')) {
      return;
    }
    setDetailsExpanded(!detailsExpanded);
  };

  const toggleSteps = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!detailsExpanded) {
      setDetailsExpanded(true);
      setTimeout(() => setStepsExpanded(true), 50);
    } else {
      setStepsExpanded(!stepsExpanded);
    }
  };

  // Обработчик клика по этапу – предотвращает закрытие карточки
  const handleStepItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const expandedClass = detailsExpanded ? `tasks-card-expanded-${task.category}` : '';

  return (
    <div
      className={`tasks-card ${isCompleted ? 'tasks-card-completed' : ''} ${expandedClass}`}
      onClick={toggleDetails}
    >
      {/* Шапка */}
      <div className="tasks-card-header">
        <div className="tasks-card-title-row">
          {index !== undefined && (
            <div className="tasks-card-number">
              <span>{index})</span>
            </div>
          )}
          <h3 className="tasks-card-title">{task.title}</h3>
          <div className="tasks-card-right-group">
            <span className={`tasks-badge ${badgeClass}`}>{badgeText}</span>
            <div className="tasks-card-actions">
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTask(task);
                  }}
                  className="tasks-icon-btn tasks-edit-btn"
                  aria-label="Редактировать"
                >
                  <Pencil size={16} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="tasks-icon-btn tasks-delete-btn"
                  aria-label="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Панель деталей */}
      {detailsExpanded && (
        <div className="tasks-details-panel">
          {/* Прогресс-бар и кнопка этапов */}
          <div className="tasks-detail-progress-full">
            <div className="tasks-detail-progress">
              <span className="tasks-detail-label">Прогресс:</span>
              <div className="tasks-progress-wrapper">
                <div className="tasks-progress-info">
                  <span className="tasks-progress-stats">
                    {completedStepsCount} / {localSteps.length} этапов
                  </span>
                  <span className="tasks-progress-percent">{Math.round(progressPercentage)}%</span>
                </div>
                <div
                  className="tasks-progress-bar"
                  onMouseEnter={() => setProgressHovered(true)}
                  onMouseLeave={() => setProgressHovered(false)}
                >
                  <div className="tasks-progress-fill" style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>
              <button
                className="tasks-steps-toggle-btn"
                onClick={toggleSteps}
              >
                <ListTodo size={16} />
                <span>{stepsExpanded ? 'Скрыть этапы' : 'Показать этапы'}</span>
                {stepsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Остальные детали */}
          <div className="tasks-details-list">
            {taskDateRange && (
              <div className="tasks-detail-item">
                <span className="tasks-detail-label">
                  <Calendar size={14} /> Сроки
                </span>
                <span className="tasks-detail-value">
                  {taskDateRange.start} – {taskDateRange.end}
                  <span className="tasks-detail-sub"> ({taskDateRange.durationDays} дн.)</span>
                </span>
              </div>
            )}

            <div className="tasks-detail-item">
              <span className="tasks-detail-label">
                <Users size={14} /> Подразделение
              </span>
              <span className="tasks-detail-value">
                {task.division?.name || '—'} {task.subdivision?.name ? `/ ${task.subdivision.name}` : ''}
              </span>
            </div>

            {task.created_by && (
              <div className="tasks-detail-item">
                <span className="tasks-detail-label">
                  <Info size={14} /> Создал
                </span>
                <span className="tasks-detail-value">
                  {task.created_by.username}
                  {isCreatorLeader && <Crown size={12} className="tasks-crown-icon" title="Руководитель" />}
                  <span className="tasks-detail-sub">({formatDateTime(task.created_at)})</span>
                </span>
              </div>
            )}

            {task.updated_by && task.updated_at && (
              <div className="tasks-detail-item">
                <span className="tasks-detail-label">Изменено</span>
                <span className="tasks-detail-value">
                  {task.updated_by.username}
                  {(task.updated_by.roles?.includes('director') || task.updated_by.roles?.includes('deputy_director')) && (
                    <Crown size={12} className="tasks-crown-icon" />
                  )}
                  <span className="tasks-detail-sub">({formatDateTime(task.updated_at)})</span>
                </span>
              </div>
            )}

            {isCompleted && lastCompletedStep && (
              <div className="tasks-detail-item">
                <span className="tasks-detail-label">Завершил</span>
                <span className="tasks-detail-value">
                  {lastCompletedStep.completed_by.username}
                  <span className="tasks-detail-sub">({formatDateTime(lastCompletedStep.completed_at)})</span>
                </span>
              </div>
            )}

            {task.is_private && (
              <div className="tasks-detail-item">
                <span className="tasks-detail-label tasks-private-label">
                  <Lock size={14} /> Приватная задача
                </span>
              </div>
            )}
          </div>

          {/* Список этапов (раскрывается по кнопке) */}
          {stepsExpanded && (
            <div className="tasks-inline-steps">
              <div className="tasks-inline-steps-header">
                <h5>Этапы выполнения</h5>
              </div>
              <div className="tasks-inline-steps-list">
                {localSteps.map((step, idx) => (
                  <div
                    key={step.id || `step-${idx}`}
                    className="tasks-inline-step-item"
                    onClick={handleStepItemClick}
                  >
                    <input
                      type="checkbox"
                      className="tasks-step-checkbox"
                      checked={step.is_completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStepToggle(step.id, step.is_completed);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="tasks-inline-step-name">
                      {step.name}
                    </span>
                    <span className="tasks-inline-step-date">
                      {formatDate(step.start_date)} – {formatDate(step.end_date)}
                    </span>
                    {step.comments && (
                      <span className="tasks-inline-step-comment">{step.comments}</span>
                    )}
                    {step.is_completed && step.completed_by && (
                      <span className="tasks-inline-step-completed-by">
                        ✓ {step.completed_by.username}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TaskItem.displayName = 'TaskItem';