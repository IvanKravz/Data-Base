// TasksCalendarSidebar.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Task, Step } from '../../../types/tasks';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import './styles/TasksCalendarSidebar.css';

interface TasksCalendarSidebarProps {
  tasks: Task[];
  selectedDate: Date;
  onTaskClick: (task: Task) => void;
  onStepClick: (step: Step) => void;
  onToggleStep?: (taskId: string, stepId: string, currentCompleted: boolean) => void;
  currentRange?: {
    start: Date;
    end: Date;
    category: Task['category'];
    taskId: string;
    stepId?: string;
  } | null;
  onHighlightRange: (range: {
    start: Date;
    end: Date;
    category: Task['category'];
    taskId: string;
    stepId?: string;
  } | null) => void;
  onClearHighlight: () => void;
}

export function TasksCalendarSidebar({
  tasks,
  selectedDate,
  onTaskClick,
  onStepClick,
  onToggleStep,
  currentRange,
  onHighlightRange,
  onClearHighlight,
}: TasksCalendarSidebarProps) {
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  const [activeDivisionId, setActiveDivisionId] = useState<string | null>(null);

  const tasksOnDate = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return tasks.filter(task =>
      task.steps.some(step => {
        const start = step.start_date ? new Date(step.start_date) : null;
        const end = step.end_date ? new Date(step.end_date) : null;
        if (!start || !end) return false;
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        return dateStr >= startStr && dateStr <= endStr;
      })
    );
  }, [tasks, selectedDate]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, { name: string; tasks: Task[] }> = {};
    tasksOnDate.forEach(task => {
      const divisionId = task.division?.id || 'no-division';
      const divisionName = task.division?.name || 'Без подразделения';
      if (!groups[divisionId]) {
        groups[divisionId] = { name: divisionName, tasks: [] };
      }
      groups[divisionId].tasks.push(task);
    });
    return Object.entries(groups).map(([id, { name, tasks }]) => ({ id, name, tasks }));
  }, [tasksOnDate]);

  // При смене выбранной даты автоматически открываем первую вкладку подразделения
  // и сворачиваем все ранее раскрытые задачи.
  useEffect(() => {
    if (groupedTasks.length > 0) {
      setActiveDivisionId(groupedTasks[0].id);
    } else {
      setActiveDivisionId(null);
    }
    setExpandedTaskIds([]);
    // Следим только за сменой даты; пересчёт groupedTasks не должен сбрасывать
    // пользовательский выбор вкладки.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleTaskTitleClick = (task: Task) => {
    const starts = task.steps.map(s => new Date(s.start_date).getTime());
    const ends = task.steps.map(s => new Date(s.end_date).getTime());
    const minStart = new Date(Math.min(...starts));
    const maxEnd = new Date(Math.max(...ends));

    const isAlreadyHighlighted =
      currentRange && currentRange.taskId === task.id && !currentRange.stepId;

    if (isAlreadyHighlighted) {
      onHighlightRange(null);
    } else {
      onHighlightRange({
        start: minStart,
        end: maxEnd,
        category: task.category,
        taskId: task.id,
      });
    }
  };

  const handleStepClickWithRange = (step: Step, task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const start = new Date(step.start_date);
    const end = new Date(step.end_date);

    const isAlreadyHighlighted =
      currentRange &&
      currentRange.taskId === task.id &&
      currentRange.stepId === step.id;

    if (isAlreadyHighlighted) {
      onHighlightRange(null);
    } else {
      onHighlightRange({
        start,
        end,
        category: task.category,
        taskId: task.id,
        stepId: step.id,
      });
    }

    onStepClick(step);
  };

  const getTaskDateRange = (task: Task): string => {
    if (!task.steps.length) return 'Нет этапов';
    const startDates = task.steps.map(s => new Date(s.start_date).getTime());
    const endDates = task.steps.map(s => new Date(s.end_date).getTime());
    const minStart = new Date(Math.min(...startDates));
    const maxEnd = new Date(Math.max(...endDates));
    return `${format(minStart, 'dd.MM.yyyy')} - ${format(maxEnd, 'dd.MM.yyyy')}`;
  };

  const activeTasks = useMemo(() => {
    if (!activeDivisionId) return [];
    const group = groupedTasks.find(g => g.id === activeDivisionId);
    return group ? group.tasks : [];
  }, [groupedTasks, activeDivisionId]);

  if (groupedTasks.length === 0) {
    return (
      <div className="tasks-calendar-sidebar">
        <div className="tasks-sidebar-content">
          <div className="tasks-sidebar-header">
            <h3 className="tasks-sidebar-title">
              Задачи на {format(selectedDate, 'dd.MM.yyyy')}
            </h3>
            <button
              className="tasks-sidebar-clear-button"
              onClick={onClearHighlight}
              title="Очистить выделение"
            >
              <X size={16} />
              <span>Очистить</span>
            </button>
          </div>
          <p className="tasks-sidebar-no-tasks">Нет задач на выбранную дату</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-calendar-sidebar">
      <div className="tasks-sidebar-content">
        <div className="tasks-sidebar-header">
          <h3 className="tasks-sidebar-title">
            Задачи на {format(selectedDate, 'dd.MM.yyyy')}
          </h3>
          <button
            className="tasks-sidebar-clear-button"
            onClick={onClearHighlight}
            title="Очистить выделение"
          >
            <X size={16} />
            <span>Очистить</span>
          </button>
        </div>

        <div className="tasks-sidebar-tabs">
          {groupedTasks.map(group => (
            <button
              key={group.id}
              className={`tasks-sidebar-tab ${activeDivisionId === group.id ? 'tasks-sidebar-tab-active' : ''
                }`}
              onClick={() => setActiveDivisionId(group.id)}
            >
              <span>{group.name}</span>
              <span className="tasks-sidebar-tab-count">{group.tasks.length}</span>
            </button>
          ))}
        </div>

        <div className="tasks-sidebar-list-wrapper">
          <div className="tasks-sidebar-list">
            {activeTasks.map(task => {
              const isExpanded = expandedTaskIds.includes(task.id);
              const completedSteps = task.steps.filter(s => s.is_completed).length;
              const totalSteps = task.steps.length;
              const progressPercent =
                totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
              const divisionName = task.division?.name || '—';
              const subdivisionName = task.subdivision?.name || '—';
              const creatorName =
                task.created_by?.name ||
                task.created_by?.username ||
                task.created_by?.email ||
                'Неизвестно';

              const itemClass = [
                'tasks-sidebar-item',
                `tasks-sidebar-item-${task.category}`,
                isExpanded
                  ? `tasks-sidebar-item-expanded-bg tasks-sidebar-item-expanded-bg-${task.category}`
                  : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div key={task.id} className={itemClass}>
                  <div className="tasks-sidebar-item-header">
                    <div
                      className="tasks-sidebar-item-text"
                      onClick={() => handleTaskTitleClick(task)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h4 className="tasks-sidebar-item-title">{task.title}</h4>
                    </div>
                    <button
                      className="tasks-sidebar-toggle"
                      onClick={e => {
                        e.stopPropagation();
                        toggleTaskExpanded(task.id);
                      }}
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="tasks-sidebar-item-expanded">
                      <div className="tasks-sidebar-item-meta">
                        <div className="tasks-sidebar-item-creator">
                          <span>Создал задачу: {creatorName}</span>
                        </div>
                        <span className="tasks-sidebar-item-division">
                          {divisionName} {subdivisionName !== '—' && ` / ${subdivisionName}`}
                        </span>
                        <span className="tasks-sidebar-item-dates">
                          Сроки: {getTaskDateRange(task)}
                        </span>
                      </div>

                      <p className="tasks-sidebar-item-details">
                        Этапов: {totalSteps} • Завершено: {completedSteps}
                      </p>

                      <div className="tasks-sidebar-progress">
                        <div className="tasks-sidebar-progress-header">
                          <span>Прогресс</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="tasks-sidebar-progress-bar">
                          <div
                            className="tasks-sidebar-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="tasks-sidebar-steps">
                        {task.steps.map((step, index) => (
                          <div
                            key={step.id}
                            className="tasks-sidebar-step"
                            onClick={e => handleStepClickWithRange(step, task, e)}
                          >
                            <div className="tasks-sidebar-step-info">
                              <div className="tasks-sidebar-step-row">
                                <input
                                  type="checkbox"
                                  checked={step.is_completed}
                                  onChange={e => {
                                    e.stopPropagation();
                                    onToggleStep?.(task.id, step.id, step.is_completed);
                                  }}
                                  onClick={e => e.stopPropagation()}
                                />
                                <span className="tasks-sidebar-step-name">
                                  Этап {index + 1}: {step.name}
                                </span>
                              </div>
                              <span className="tasks-sidebar-step-date">
                                {format(new Date(step.start_date), 'dd.MM.yyyy')} -{' '}
                                {format(new Date(step.end_date), 'dd.MM.yyyy')}
                              </span>
                            </div>
                            {step.is_completed && (
                              <div className="tasks-sidebar-step-completed">✓</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}