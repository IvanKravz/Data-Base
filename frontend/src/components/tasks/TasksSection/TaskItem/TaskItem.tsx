import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Pencil,
  Trash2,
  Lock,
  Crown,
  Calendar,
  Users,
  Info,
  User,
  AlertCircle,
} from 'lucide-react';
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

interface ContextMenuState {
  x: number;
  y: number;
}

export const TaskItem = React.memo(({ task, onEditTask, onDeleteTask, onToggleStep, index }: TaskItemProps) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [localSteps, setLocalSteps] = useState(task.steps);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const { canEditTask, canDeleteTask, getCurrentUser } = useAppPermissions();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
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

  const overdueStepsCount = useMemo(() => {
    if (isCompleted) return 0;
    const now = new Date();
    return localSteps.filter(step => !step.is_completed && new Date(step.end_date) < now).length;
  }, [localSteps, isCompleted]);

  const { categoryBadgeClass, categoryBadgeText, categoryStripClass } = useMemo(() => {
    if (isCompleted) {
      return {
        categoryBadgeClass: 'tasks-badge-completed',
        categoryBadgeText: 'Завершено',
        categoryStripClass: 'tasks-card-strip-completed',
      };
    }
    switch (task.category) {
      case 'urgent':
        return {
          categoryBadgeClass: 'tasks-badge-urgent',
          categoryBadgeText: 'Срочно',
          categoryStripClass: 'tasks-card-strip-urgent',
        };
      case 'planned':
        return {
          categoryBadgeClass: 'tasks-badge-planned',
          categoryBadgeText: '',
          categoryStripClass: 'tasks-card-strip-planned',
        };
      default:
        return {
          categoryBadgeClass: 'tasks-badge-attention',
          categoryBadgeText: 'Внимание',
          categoryStripClass: 'tasks-card-strip-attention',
        };
    }
  }, [isCompleted, task.category]);

  const overdueTooltip = useMemo(() => {
    if (overdueStepsCount === 0) return '';
    if (overdueStepsCount === 1) return 'Просрочен 1 этап';
    const lastDigit = overdueStepsCount % 10;
    const lastTwoDigits = overdueStepsCount % 100;
    let word = 'этапов';
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) word = 'этапов';
    else if (lastDigit === 1) word = 'этап';
    else if (lastDigit >= 2 && lastDigit <= 4) word = 'этапа';
    return `Просрочено ${overdueStepsCount} ${word}`;
  }, [overdueStepsCount]);

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
      startShort: formatDateShort(minStart.toISOString()),
      endShort: formatDateShort(maxEnd.toISOString()),
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
    // Левая кнопка — раскрытие/сворачивание. Правую игнорируем.
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.tasks-icon-btn') || target.closest('.tasks-step-checkbox')) {
      return;
    }
    setDetailsExpanded(!detailsExpanded);
  };

  const handleStepItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // ===== Контекстное меню (правый клик) =====

  const openContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!canEdit && !canDelete) return;
      // Не даём открыться нативного меню браузера
      e.preventDefault();
      e.stopPropagation();

      const MENU_WIDTH = 200;
      const MENU_HEIGHT = 100; // приблизительно
      const x = Math.min(e.clientX, window.innerWidth - MENU_WIDTH - 8);
      const y = Math.min(e.clientY, window.innerHeight - MENU_HEIGHT - 8);
      setContextMenu({ x, y });
    },
    [canEdit, canDelete],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      closeContextMenu();
      onEditTask(task);
    },
    [closeContextMenu, onEditTask, task],
  );

  const handleContextDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      closeContextMenu();
      onDeleteTask(task.id);
    },
    [closeContextMenu, onDeleteTask, task.id],
  );

  // Закрытие меню: клик вне, Esc, скролл, ресайз
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (ev: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(ev.target as Node)
      ) {
        closeContextMenu();
      }
    };

    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') closeContextMenu();
    };

    const handleScrollOrResize = () => closeContextMenu();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [contextMenu, closeContextMenu]);

  const expandedClass = detailsExpanded ? `tasks-card-expanded-${task.category}` : '';

  const assigneeName = task.assignee?.full_name;
  const assigneePosition = task.assignee?.position;

  return (
    <>
      <div
        className={`tasks-card ${isCompleted ? 'tasks-card-completed' : ''} ${expandedClass}`}
        onClick={toggleDetails}
        onContextMenu={openContextMenu}
      >
        {/* Цветная полоса-индикатор */}
        <div className={`tasks-card-strip ${categoryStripClass}`} />

        {/* Основная часть: контент задачи */}
        <div className="tasks-card-main">
          <div className="tasks-card-title-row">
            {index !== undefined && (
              <span className="tasks-card-number">{index}.</span>
            )}
            <h3 className="tasks-card-title" title={task.title}>{task.title}</h3>
          </div>

          {/* Метаданные: срок · исполнитель · прогресс */}
          <div className="tasks-card-meta">
            {taskDateRange && (
              <span className="tasks-card-meta-item">
                <Calendar size={13} />
                {taskDateRange.startShort} – {taskDateRange.endShort}
              </span>
            )}

            {assigneeName && (
              <>
                <span className="tasks-card-meta-sep">·</span>
                <span
                  className="tasks-card-meta-item"
                  title={`Ответственный исполнитель${assigneePosition ? `: ${assigneePosition}` : ''}`}
                >
                  <User size={13} />
                  {assigneeName}
                </span>
              </>
            )}

            {localSteps.length > 0 && (
              <>
                <span className="tasks-card-meta-sep">·</span>
                <span className="tasks-card-progress-mini">
                  <span className="tasks-card-progress-mini-track">
                    <span
                      className="tasks-card-progress-mini-fill"
                      style={{ width: `${progressPercentage}%`, display: 'block' }}
                    />
                  </span>
                  <span className="tasks-card-progress-mini-text">
                    {Math.round(progressPercentage)}%
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Правая зона: [actions] [badges] */}
        <div className="tasks-card-status">
          {/* Кнопки действий — слева от бейджей, вверху.
              Появляются при раскрытии карточки (detailsExpanded). */}
          {(canEdit || canDelete) && (
            <div className={`tasks-card-actions ${detailsExpanded ? 'tasks-card-actions-visible' : ''}`}>
              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTask(task);
                  }}
                  className="tasks-icon-btn tasks-edit-btn"
                  aria-label="Редактировать"
                  title="Редактировать"
                >
                  <Pencil size={15} />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="tasks-icon-btn tasks-delete-btn"
                  aria-label="Удалить"
                  title="Удалить"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}

          {/* Бейджи */}
          <div className="tasks-card-badges">
            <span className={`tasks-badge ${categoryBadgeClass}`}>{categoryBadgeText}</span>
            {overdueStepsCount > 0 && (
              <span className="tasks-overdue-indicator" title={overdueTooltip}>
                <AlertCircle size={12} />
                {overdueStepsCount}
              </span>
            )}
          </div>
        </div>

        {/* Панель деталей */}
        {detailsExpanded && (
          <div className="tasks-details-panel">
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
                  <div className="tasks-progress-bar">
                    <div className="tasks-progress-fill" style={{ width: `${progressPercentage}%` }} />
                  </div>
                </div>
              </div>
            </div>

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

              {assigneeName && (
                <div className="tasks-detail-item">
                  <span className="tasks-detail-label">
                    <User size={14} /> Исполнитель
                  </span>
                  <span className="tasks-detail-value">
                    {assigneeName}
                    {assigneePosition && (
                      <span className="tasks-detail-sub"> ({assigneePosition})</span>
                    )}
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

            <div className="tasks-inline-steps">
              <div className="tasks-inline-steps-header">
                <h5>Этапы выполнения</h5>
              </div>
              <div className="tasks-inline-steps-list">
                {localSteps.map((step, idx) => {
                  const isStepOverdue = !step.is_completed && new Date(step.end_date) < new Date();
                  return (
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
                      <span className={`tasks-inline-step-name ${step.is_completed ? 'completed' : ''}`}>
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
                      {isStepOverdue && (
                        <span className="tasks-inline-step-overdue" title="Этап просрочен">
                          <AlertCircle size={12} /> Просрочен
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Контекстное меню (портал в body) */}
      {contextMenu && createPortal(
        <div
          ref={contextMenuRef}
          className="tasks-card-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {canEdit && (
            <button
              type="button"
              className="tasks-context-menu-item tasks-context-menu-item-edit"
              onClick={handleContextEdit}
            >
              <Pencil size={14} />
              Редактировать
            </button>
          )}
          {canEdit && canDelete && <div className="tasks-context-menu-sep" />}
          {canDelete && (
            <button
              type="button"
              className="tasks-context-menu-item tasks-context-menu-item-delete"
              onClick={handleContextDelete}
            >
              <Trash2 size={14} />
              Удалить
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  );
});

TaskItem.displayName = 'TaskItem';