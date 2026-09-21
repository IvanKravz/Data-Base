// TaskCalendar.tsx
import React from 'react';
import { format, isValid, isWithinInterval, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
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
  onCalendarStateChange: (state: { date?: Date; view?: 'month' | 'year' }) => void;
  /** Вызывается ТОЛЬКО когда пользователь выбрал конкретный день (не при навигации) */
  onDateSelect?: (date: Date) => void;
  highlightedRange?: {
    start: Date;
    end: Date;
    category: Task['category'];
    taskId: string;
    stepId?: string;
  } | null;
  /** Диапазон из панели фильтров — визуальная подсветка выбранного периода */
  filterRange?: { start: Date; end: Date } | null;
}

export function TaskCalendar({
  tasks,
  onTaskClick,
  calendarState,
  onCalendarStateChange,
  onDateSelect,
  highlightedRange,
  filterRange,
}: TaskCalendarProps) {
  const { date: selectedDate, view } = calendarState ?? { date: new Date(), view: 'month' };

  const handleDateChange = (date: Date) => {
    onCalendarStateChange({ date });
    onDateSelect?.(date);
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

  const getCountsByCategory = (taskList: Task[]): Record<string, number> => {
    return taskList.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const isDateInRange = (date: Date, rangeStart: Date, rangeEnd: Date): boolean => {
    const d = startOfDay(date);
    const s = startOfDay(rangeStart);
    const e = startOfDay(rangeEnd);
    return isWithinInterval(d, { start: s, end: e });
  };

  const isMonthInRange = (monthDate: Date, rangeStart: Date, rangeEnd: Date): boolean => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = startOfDay(new Date(year, month, 1));
    const lastDay = startOfDay(new Date(year, month + 1, 0));
    return isWithinInterval(firstDay, { start: rangeStart, end: rangeEnd }) ||
      isWithinInterval(lastDay, { start: rangeStart, end: rangeEnd }) ||
      (firstDay <= rangeStart && lastDay >= rangeEnd);
  };

  return (
    <div className="tasks-calendar-container">
      <div className="tasks-calendar-main">
        <div className="tasks-calendar-wrapper">
          <Calendar
            key={`${view}-${selectedDate.toISOString()}`}
            onChange={handleDateChange}
            value={selectedDate}
            view={view}
            onViewChange={({ view }) => handleViewChange(view as 'month' | 'year')}
            className="tasks-calendar"
            onActiveStartDateChange={handleActiveStartDateChange}
            tileClassName={({ date, view: tileView, activeStartDate }) => {
              const classes = [];

              // День соседнего месяца
              const isOutsideMonth =
                tileView === 'month' &&
                !!activeStartDate &&
                date.getMonth() !== activeStartDate.getMonth();

              if (isOutsideMonth) {
                classes.push('tasks-calendar-outside-month');
              }

              // Есть ли задачи
              const tasksOnDate = tileView === 'year'
                ? getTasksForMonth(date)
                : getTasksForDate(date);

              if (tasksOnDate.length > 0) {
                classes.push('tasks-calendar-has-events');
              }

              // Подсветка диапазона фильтра (нейтральный синий)
              if (filterRange) {
                const { start, end } = filterRange;
                const isInFilterRange = tileView === 'year'
                  ? isMonthInRange(date, start, end)
                  : isDateInRange(date, start, end);
                if (isInFilterRange) {
                  classes.push('tasks-calendar-in-filter-range');
                }
              }

              // Подсветка диапазона конкретного этапа задачи (по категории)
              if (highlightedRange) {
                const { start, end, category } = highlightedRange;
                const isInRange = tileView === 'year'
                  ? isMonthInRange(date, start, end)
                  : isDateInRange(date, start, end);
                if (isInRange) {
                  classes.push(`tasks-calendar-in-range tasks-calendar-in-range-${category}`);
                }
              }

              return classes.join(' ');
            }}
            tileContent={({ date, view: tileView, activeStartDate }) => {
              const isOutsideMonth =
                tileView === 'month' &&
                !!activeStartDate &&
                date.getMonth() !== activeStartDate.getMonth();

              const tasksOnDate = tileView === 'year'
                ? getTasksForMonth(date)
                : getTasksForDate(date);

              const hasTasks = tasksOnDate.length > 0;
              const counts = hasTasks ? getCountsByCategory(tasksOnDate) : null;

              if (!isOutsideMonth && !hasTasks) return null;

              return (
                <>
                  {isOutsideMonth && (
                    <span className="tasks-calendar-tile-month-label">
                      {format(date, 'LLL', { locale: ru })}
                    </span>
                  )}

                  {counts && (
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
                  )}
                </>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}