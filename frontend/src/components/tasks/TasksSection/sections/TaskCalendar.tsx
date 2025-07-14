import React from 'react';
import { format, isValid } from 'date-fns';
import Calendar from 'react-calendar';
import { Task } from '../../../../types/tasks';
import { TaskCategory } from '../../../../types/taskCategories';
import 'react-calendar/dist/Calendar.css';
import '../style.css';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  calendarState: {
    date: Date;
    view: 'month' | 'year';
  };
  onCalendarStateChange: (state: {
    date?: Date;
    view?: 'month' | 'year';
  }) => void;
}

export function TaskCalendar({
  tasks,
  onTaskClick,
  calendarState,
  onCalendarStateChange
}: TaskCalendarProps) {
  const { date: selectedDate, view } = calendarState;

  const handleDateChange = (date: Date) => {
    onCalendarStateChange({ date });
  };

  const handleViewChange = (newView: 'month' | 'year') => {
    onCalendarStateChange({ view: newView });
  };

  const getValidDate = (date: string | Date | null | undefined): Date | null => {
    if (!date) return null;
    const d = new Date(date);
    return isValid(d) ? d : null;
  };

  // Get tasks for a specific date with their categories
  const getTasksForDate = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return tasks.filter(task =>
      task.steps.some(step => {
        const stepStartDate = getValidDate(step.start_date);
        const stepEndDate = getValidDate(step.end_date);
        if (!stepStartDate || !stepEndDate) return false;

        const stepStartDateStr = format(stepStartDate, 'yyyy-MM-dd');
        const stepEndDateStr = format(stepEndDate, 'yyyy-MM-dd');
        return formattedDate >= stepStartDateStr && formattedDate <= stepEndDateStr;
      })
    );
  };

  // Group tasks by category for a specific date
  const getTasksByCategory = (date: Date) => {
    const tasksOnDate = getTasksForDate(date);
    return tasksOnDate.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<TaskCategory, number>);
  };

  // Get tasks with steps on the selected date
  const tasksWithStepsOnDate = tasks.filter(task =>
    task.steps.some(step => {
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      const stepStartDate = getValidDate(step.start_date);
      const stepEndDate = getValidDate(step.end_date);
      if (!stepStartDate || !stepEndDate) return false;

      const stepStartDateStr = format(stepStartDate, 'yyyy-MM-dd');
      const stepEndDateStr = format(stepEndDate, 'yyyy-MM-dd');
      return selectedDateStr >= stepStartDateStr && selectedDateStr <= stepEndDateStr;
    })
  );

  return (
    <div className="tasks-calendar-container">
      <div className="tasks-calendar-main">
        <div className="tasks-calendar-controls">
          <button
            onClick={() => handleViewChange(view === 'month' ? 'year' : 'month')}
            className="tasks-calendar-view-button"
          >
            {view === 'month' ? 'Показать год' : 'Показать месяц'}
          </button>
        </div>
        <Calendar
          key={`${calendarState.view}-${calendarState.date.toISOString()}`}
          onChange={handleDateChange}
          value={selectedDate}
          view={view}
          onViewChange={({ view }) => handleViewChange(view as 'month' | 'year')}
          className="tasks-calendar"
          tileClassName={({ date }) => {
            const hasTasksOnDate = getTasksForDate(date).length > 0;
            return hasTasksOnDate ? 'tasks-calendar-has-events' : '';
          }}
          tileContent={({ date }) => {
            const tasksByCategory = getTasksByCategory(date);
            const hasTasksOnDate = Object.values(tasksByCategory).some(count => count > 0);

            if (!hasTasksOnDate) return null;

            return (
              <div className="tasks-calendar-indicator">
                {tasksByCategory.urgent > 0 && (
                  <div className="tasks-calendar-dot tasks-calendar-dot-urgent" />
                )}
                {tasksByCategory.planned > 0 && (
                  <div className="tasks-calendar-dot tasks-calendar-dot-planned" />
                )}
                {tasksByCategory.attention > 0 && (
                  <div className="tasks-calendar-dot tasks-calendar-dot-attention" />
                )}
              </div>
            );
          }}
        />
      </div>

      <div className="tasks-calendar-events">
        <div className="tasks-calendar-events-header">
          <h3 className="tasks-calendar-events-title">
            Задачи на {format(selectedDate, 'dd.MM.yyyy')}
          </h3>
          <span className="tasks-calendar-events-count">
            Задач: {tasksWithStepsOnDate.length}
          </span>
        </div>

        <div className="tasks-calendar-events-list">
          {tasksWithStepsOnDate.length > 0 ? (
            tasksWithStepsOnDate.map(task => {
              // Определяем класс категории
              const categoryClass = `tasks-calendar-event-${task.category}`;

              return (
                <div
                  key={task.id}
                  className={`tasks-calendar-event ${categoryClass}`}
                  onClick={() => onTaskClick(task)}
                >
                  <div className="tasks-calendar-event-header">
                    <div className={`tasks-calendar-event-indicator ${task.category === 'urgent' ? 'tasks-calendar-event-indicator-urgent' :
                      task.category === 'planned' ? 'tasks-calendar-event-indicator-planned' :
                        'tasks-calendar-event-indicator-attention'
                      }`} />
                    <h4 className="tasks-calendar-event-title">
                      {task.title}
                    </h4>
                  </div>
                  <div className="tasks-calendar-event-steps">
                    {task.steps.map((step, index) => (
                      <div key={step.id} className="tasks-calendar-event-step">
                        <p className="tasks-calendar-event-step-name">
                          Этап {index + 1}: {step.name}
                        </p>
                        <p className="tasks-calendar-event-step-time">
                          {format(new Date(step.start_date), 'dd.MM.yyyy')} - {format(new Date(step.end_date), 'dd.MM.yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="tasks-calendar-no-events">
              Нет задач на выбранную дату
            </p>
          )}
        </div>
      </div>
    </div>
  );
}