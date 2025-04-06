
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { format } from 'date-fns';
import Calendar from 'react-calendar';
import { TaskDetailsModal } from '../../TaskDetailsModal';
import { Task } from '../../../../types/tasks';
import { TaskCategory, isTaskCompleted } from '../../../../types/taskCategories';
import 'react-calendar/dist/Calendar.css';

interface TaskCalendarProps {
  selectedDivision: string;
  searchTerm: string;
  onDeleteTask?: (taskId: string) => void;
}

export function TaskCalendar({ selectedDivision, searchTerm, onDeleteTask }: TaskCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('month');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const loading = useSelector((state: RootState) => state.tasks.loading);

  // Filter tasks based on division, search term and completion status
  const filteredTasks = tasks.filter(task => 
    (selectedDivision === 'all' || task.divisionId === selectedDivision) &&
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !isTaskCompleted(task) // Only show incomplete tasks
  );

  // Get tasks for a specific date with their categories
  const getTasksForDate = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return filteredTasks.filter(task =>
      task.steps.some(step => {
        const stepStartDate = format(new Date(step.startDate), 'yyyy-MM-dd');
        const stepEndDate = format(new Date(step.endDate), 'yyyy-MM-dd');
        return formattedDate >= stepStartDate && formattedDate <= stepEndDate;
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
  const tasksWithStepsOnDate = filteredTasks.filter(task =>
    task.steps.some(step => {
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      const stepStartDate = format(new Date(step.startDate), 'yyyy-MM-dd');
      const stepEndDate = format(new Date(step.endDate), 'yyyy-MM-dd');
      return selectedDateStr >= stepStartDate && selectedDateStr <= stepEndDate;
    })
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setView(view === 'month' ? 'year' : 'month')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            {view === 'month' ? 'Показать год' : 'Показать месяц'}
          </button>
        </div>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          view={view}
          onViewChange={({ view }) => setView(view as 'month' | 'year')}
          className="w-full rounded-lg shadow-sm border border-gray-200"
          tileClassName={({ date }) => {
            const hasTasksOnDate = getTasksForDate(date).length > 0;
            return hasTasksOnDate ? 'has-tasks' : '';
          }}
          tileContent={({ date }) => {
            const tasksByCategory = getTasksByCategory(date);
            const hasTasksOnDate = Object.values(tasksByCategory).some(count => count > 0);

            if (!hasTasksOnDate) return null;

            return (
              <div className="absolute bottom-1 left-0 right-0 flex justify-center items-center gap-1">
                {tasksByCategory.urgent > 0 && (
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                )}
                {tasksByCategory.planned > 0 && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
                {tasksByCategory.attention > 0 && (
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                )}
              </div>
            );
          }}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">
            {searchTerm ? 'Результаты поиска' : `Задачи на ${format(selectedDate, 'dd.MM.yyyy')}`}
          </h3>
          <span className="text-sm text-gray-600">
            {searchTerm ? `Найдено: ${filteredTasks.length}` : `Задач: ${tasksWithStepsOnDate.length}`}
          </span>
        </div>

        <div className="space-y-4">
          {(searchTerm ? filteredTasks : tasksWithStepsOnDate).map(task => (
            <div 
              key={task.id} 
              className="border border-gray-200 rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-center gap-2">
                <div 
                  className={`h-2 w-2 rounded-full ${
                    task.category === 'urgent' ? 'bg-red-500' :
                    task.category === 'planned' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}
                />
                <h4 className="font-medium text-gray-900">
                  {task.title}
                </h4>
              </div>
              <div className="mt-2 space-y-2">
                {task.steps.map(step => (
                  <div key={step.id} className="text-sm">
                    <p className="text-gray-600">
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(step.startDate), 'dd.MM.yyyy HH:mm')} - {format(new Date(step.endDate), 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {(searchTerm ? filteredTasks : tasksWithStepsOnDate).length === 0 && (
            <p className="text-center text-gray-500 py-4">
              {searchTerm 
                ? 'Нет задач, соответствующих поиску'
                : 'Нет задач на выбранную дату'
              }
            </p>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={onDeleteTask}
        />
      )}
    </div>
  );
}
