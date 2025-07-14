// TaskItem.tsx
import React, { useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Task } from '../../../../../types/tasks';
import './DivisionTasksSection.css';

interface TaskItemProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStep: (taskId: string, stepId: string, isCompleted: boolean) => void;
}

export const TaskItem = React.memo(({ task, onEditTask, onDeleteTask, onToggleStep }: TaskItemProps) => {
  const isCompleted = task.steps.every(step => step.is_completed);
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

  const completedStepsCount = task.steps.filter(s => s.is_completed).length;
  const progressPercentage = (completedStepsCount / task.steps.length) * 100;

  const handleStepToggle = (stepId: string, isCompleted: boolean) => {
    onToggleStep(task.id, stepId, !isCompleted);
  };

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

  // Находим последний выполненный шаг для определения кто и когда завершил задачу
  const lastCompletedStep = task.steps
    .filter(step => step.is_completed && step.completed_by && step.completed_at)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];

  return (
    <div className={`tasks-list-item ${isCompleted ? 'tasks-completed' : ''}`}>
      <div className="tasks-item-content">
        <div className="tasks-item-main">
          <div className="tasks-item-header">
            <h3 className="tasks-item-title">{task.title}</h3>
            <span className={`tasks-badge ${badgeClass}`}>
              {badgeText}
            </span>
            <div className="tasks-meta-info">
            <span className="tasks-meta-label">Подразделение:</span>
            <span className="tasks-meta-value">
              {task.division.name ? ` ${task.division.name}` : ''} {task.subdivision?.name ? ` / ${task.subdivision?.name}` : ''}
            </span>
          </div>
          </div>

          {/* Информация о создателе */}
          {task.created_by && (
            <div className="tasks-meta-info">
              <span className="tasks-meta-label">Создал:</span>
              <span className="tasks-meta-value">
                {task.created_by.username} ({formatDateTime(task.created_at)})
              </span>
            </div>
          )}
       

          {/* Информация о завершении, если задача выполнена */}
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
              {completedStepsCount} из {task.steps.length} этапов
            </span>
            <div className="tasks-progress-bar">
              <div
                className="tasks-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="tasks-steps-container">
            <div className="tasks-steps-list">
              {task.steps.map((step) => (
                <div key={step.id} className="tasks-step">
                  <div
                    className={`tasks-step-indicator ${step.is_completed ? 'tasks-step-completed' : 'tasks-step-pending'
                      }`}
                    onClick={() => handleStepToggle(step.id, step.is_completed)}
                  />
                  <div className="tasks-step-details">
                    <p className={`tasks-step-name ${step.is_completed ? 'tasks-step-completed-text' : ''
                      }`}>
                      {step.name}
                    </p>
                    {step.comments && (
                      <p className="tasks-step-comments">{step.comments}</p>
                    )}
                    <p className="tasks-step-time">
                      {formatDate(step.start_date)} - {formatDate(step.end_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tasks-item-actions">
          <button
            onClick={() => onEditTask(task)}
            className="tasks-action-button tasks-action-edit"
            aria-label="Редактировать задачу"
          >
            <Pencil className="tasks-action-icon" />
          </button>
          <button
            onClick={() => onDeleteTask(task.id)}
            className="tasks-action-button tasks-action-delete"
            aria-label="Удалить задачу"
          >
            <Trash2 className="tasks-action-icon" />
          </button>
        </div>
      </div>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';