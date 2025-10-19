import React from 'react';
import { TaskCalendar } from '../../../../../tasks/TasksSection/sections/TaskCalendar';
import { Task } from '../../../../../../types/tasks';
import '../DivisionTasksSection.css';

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
  return (
    <div className="tasks-calendar-wrapper">
      <TaskCalendar 
        tasks={tasks} 
        onTaskClick={onTaskClick}
        calendarState={calendarState}
        onCalendarStateChange={onCalendarStateChange}
      />
    </div>
  );
}