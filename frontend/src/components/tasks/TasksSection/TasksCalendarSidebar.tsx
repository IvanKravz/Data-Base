import React, { useState, useMemo } from 'react';
import { Task, Step } from '../../../types/tasks';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './styles/TasksCalendarSidebar.css';

interface TasksCalendarSidebarProps {
  tasks: Task[];
  selectedDate: Date;
  onTaskClick: (task: Task) => void;
  onStepClick: (step: Step) => void;
}

export function TasksCalendarSidebar({ tasks, selectedDate, onTaskClick, onStepClick }: TasksCalendarSidebarProps) {
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  const [expandedDivisions, setExpandedDivisions] = useState<string[]>([]);

  // Фильтруем задачи, которые имеют шаги на выбранную дату
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

  // Группируем задачи по подразделениям
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
    // Преобразуем в массив для удобства рендера
    return Object.entries(groups).map(([id, { name, tasks }]) => ({ id, name, tasks }));
  }, [tasksOnDate]);

  // Инициализируем развёрнутыми все подразделения при первом рендере
  useState(() => {
    if (groupedTasks.length > 0 && expandedDivisions.length === 0) {
      setExpandedDivisions(groupedTasks.map(g => g.id));
    }
  });

  const toggleDivision = (divisionId: string) => {
    setExpandedDivisions(prev =>
      prev.includes(divisionId) ? prev.filter(id => id !== divisionId) : [...prev, divisionId]
    );
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleStepClick = (step: Step, e: React.MouseEvent) => {
    e.stopPropagation();
    onStepClick(step);
  };

  // Вспомогательная функция для получения диапазона дат задачи
  const getTaskDateRange = (task: Task): string => {
    if (!task.steps.length) return 'Нет этапов';
    const startDates = task.steps.map(s => new Date(s.start_date).getTime());
    const endDates = task.steps.map(s => new Date(s.end_date).getTime());
    const minStart = new Date(Math.min(...startDates));
    const maxEnd = new Date(Math.max(...endDates));
    return `${format(minStart, 'dd.MM.yyyy')} - ${format(maxEnd, 'dd.MM.yyyy')}`;
  };

  return (
    <div className="tasks-calendar-sidebar">
      <div className="tasks-sidebar-content">
        <h3 className="tasks-sidebar-title">
          Задачи на {format(selectedDate, 'dd.MM.yyyy')}
        </h3>
        <div className="tasks-sidebar-list">
          {groupedTasks.length > 0 ? (
            groupedTasks.map(group => {
              const isDivisionExpanded = expandedDivisions.includes(group.id);
              return (
                <div key={group.id} className="tasks-sidebar-division-group">
                  <div className="tasks-sidebar-division-header" onClick={() => toggleDivision(group.id)}>
                    <h4 className="tasks-sidebar-division-title">
                      {group.name}
                      <span className="tasks-sidebar-division-count">{group.tasks.length}</span>
                    </h4>
                    <button className="tasks-sidebar-division-toggle">
                      {isDivisionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  {isDivisionExpanded && (
                    <div className="tasks-sidebar-division-content">
                      {group.tasks.map(task => {
                        const isExpanded = expandedTaskIds.includes(task.id);
                        const completedSteps = task.steps.filter(s => s.is_completed).length;
                        const divisionName = task.division?.name || '—';
                        const subdivisionName = task.subdivision?.name || '—';

                        return (
                          <div key={task.id} className={`tasks-sidebar-item tasks-sidebar-item-${task.category}`}>
                            <div className="tasks-sidebar-item-header" onClick={() => toggleTaskExpanded(task.id)}>
                              <div className="tasks-sidebar-item-text">
                                <h4 className="tasks-sidebar-item-title">{task.title}</h4>
                                <div className="tasks-sidebar-item-meta">
                                  <span className="tasks-sidebar-item-division">
                                    {divisionName} {subdivisionName !== '—' && ` / ${subdivisionName}`}
                                  </span>
                                  <span className="tasks-sidebar-item-dates">{getTaskDateRange(task)}</span>
                                </div>
                                <p className="tasks-sidebar-item-details">
                                  Этапов: {task.steps.length} • Завершено: {completedSteps}
                                </p>
                              </div>
                              <button className="tasks-sidebar-toggle" onClick={(e) => { e.stopPropagation(); toggleTaskExpanded(task.id); }}>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="tasks-sidebar-steps">
                                {task.steps.map((step, index) => (
                                  <div key={step.id} className="tasks-sidebar-step" onClick={(e) => handleStepClick(step, e)}>
                                    <div className="tasks-sidebar-step-info">
                                      <span className="tasks-sidebar-step-name">
                                        Этап {index + 1}: {step.name}
                                      </span>
                                      <span className="tasks-sidebar-step-date">
                                        {format(new Date(step.start_date), 'dd.MM.yyyy')} - {format(new Date(step.end_date), 'dd.MM.yyyy')}
                                      </span>
                                    </div>
                                    {step.is_completed && <div className="tasks-sidebar-step-completed">✓</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="tasks-sidebar-no-tasks">Нет задач на выбранную дату</p>
          )}
        </div>
      </div>
    </div>
  );
}