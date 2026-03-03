import React, { useMemo } from 'react';
import { format, isValid } from 'date-fns';
import Calendar from 'react-calendar';
import { Task } from '../../../types/tasks';
import 'react-calendar/dist/Calendar.css';
import './styles/TaskCalendar.css';

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

  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date }) => {
    onCalendarStateChange({ date: activeStartDate });
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
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

  // Get tasks for a whole month
  const getTasksForMonth = (date: Date): Task[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    return tasks.filter(task =>
      task.steps.some(step => {
        const stepStart = getValidDate(step.start_date);
        const stepEnd = getValidDate(step.end_date);
        if (!stepStart || !stepEnd) return false;
        return stepStart <= endOfMonth && stepEnd >= startOfMonth;
      })
    );
  };

  // Group tasks by category
  const getCountsByCategory = (taskList: Task[]): Record<string, number> => {
    return taskList.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

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
          key={`${view}-${selectedDate.toISOString()}`}
          onChange={handleDateChange}
          value={selectedDate}
          view={view}
          onViewChange={({ view }) => handleViewChange(view as 'month' | 'year')}
          className="tasks-calendar"
          onActiveStartDateChange={handleActiveStartDateChange}
          tileClassName={({ date }) => {
            const tasksOnDate = view === 'year' ? getTasksForMonth(date) : getTasksForDate(date);
            return tasksOnDate.length > 0 ? 'tasks-calendar-has-events' : '';
          }}
          tileContent={({ date }) => {
            const tasksOnDate = view === 'year' ? getTasksForMonth(date) : getTasksForDate(date);
            if (tasksOnDate.length === 0) return null;

            const counts = getCountsByCategory(tasksOnDate);

            return (
              <div className="tasks-calendar-indicator">
                {counts.urgent > 0 && (
                  <span className="tasks-calendar-count tasks-calendar-count-urgent">
                    {counts.urgent}
                  </span>
                )}
                {counts.planned > 0 && (
                  <span className="tasks-calendar-count tasks-calendar-count-planned">
                    {counts.planned}
                  </span>
                )}
                {counts.attention > 0 && (
                  <span className="tasks-calendar-count tasks-calendar-count-attention">
                    {counts.attention}
                  </span>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}