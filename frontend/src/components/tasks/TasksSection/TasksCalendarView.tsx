import React, { useMemo } from 'react';
import { TaskCalendar } from './TaskCalendar';
import { Task } from '../../../types/tasks';
import './styles/TasksCalendarView.css'; 

interface TasksCalendarViewProps {
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

export function TasksCalendarView({ 
  tasks, 
  onTaskClick,
  calendarState,
  onCalendarStateChange 
}: TasksCalendarViewProps) {
  const { date: selectedDate, view } = calendarState;

  // Получаем уникальные годы из задач
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    tasks.forEach(task => {
      task.steps.forEach(step => {
        if (step.start_date) {
          const year = new Date(step.start_date).getFullYear();
          years.add(year);
        }
        if (step.end_date) {
          const year = new Date(step.end_date).getFullYear();
          years.add(year);
        }
      });
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => a - b);
  }, [tasks]);

  const handleYearClick = (year: number) => {
    onCalendarStateChange({
      date: new Date(year, 0, 1), // 1 января
      view: 'year'
    });
  };

  const handleTodayClick = () => {
    const today = new Date();
    onCalendarStateChange({
      date: today,
      view: 'month'
    });
  };

  return (
    <div className="tasks-calendar-view">
      {/* Панель выбора годов */}
      <div className="tasks-calendar-years">
        <button
          className="tasks-calendar-year-today"
          onClick={handleTodayClick}
          title="Вернуться к текущему месяцу"
        >
          Сегодня
        </button>
        {availableYears.map(year => (
          <button
            key={year}
            className={`tasks-calendar-year ${
              view === 'year' && selectedDate.getFullYear() === year
                ? 'tasks-calendar-year-active'
                : ''
            }`}
            onClick={() => handleYearClick(year)}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Компонент календаря (без своей панели годов) */}
      <TaskCalendar
        tasks={tasks}
        onTaskClick={onTaskClick}
        calendarState={calendarState}
        onCalendarStateChange={onCalendarStateChange}
      />
    </div>
  );
}