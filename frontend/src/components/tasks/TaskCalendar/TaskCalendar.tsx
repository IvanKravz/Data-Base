import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { format, isSameDay } from 'date-fns';
import Calendar from 'react-calendar';
import { TaskDetailsModal } from '../TaskDetailsModal';
import { Task } from '../../../types/tasks';
import { TaskCategory, isTaskCompleted } from '../../../types/taskCategories';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    !isTaskCompleted(task)
  );

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task =>
      task.steps.some(step => {
        const stepStart = new Date(step.startDate);
        const stepEnd = new Date(step.endDate);
        return date >= stepStart && date <= stepEnd;
      })
    );
  };

  // Get tasks by category for a date
  const getTasksByCategory = (date: Date) => {
    const tasksOnDate = getTasksForDate(date);
    return tasksOnDate.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<TaskCategory, number>);
  };

  // Get tasks with steps on selected date
  const tasksWithStepsOnDate = getTasksForDate(selectedDate);

  const renderTileContent = ({ date }: { date: Date }) => {
    const tasksByCategory = getTasksByCategory(date);
    const hasTasksOnDate = Object.values(tasksByCategory).some(count => count > 0);

    if (!hasTasksOnDate) return null;

    return (
      <div className="absolute bottom-1 left-0 right-0 flex justify-center items-center gap-1">
        {tasksByCategory.urgent > 0 && (
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        )}
        {tasksByCategory.planned > 0 && (
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        )}
        {tasksByCategory.attention > 0 && (
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
        )}
      </div>
    );
  };

  const renderTaskCard = (task: Task) => {
    const categoryColors = {
      urgent: 'bg-red-50 border-red-200 text-red-700',
      planned: 'bg-blue-50 border-blue-200 text-blue-700',
      attention: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    };

    const relevantSteps = task.steps.filter(step => {
      const stepStart = new Date(step.startDate);
      const stepEnd = new Date(step.endDate);
      return isSameDay(selectedDate, stepStart) || isSameDay(selectedDate, stepEnd);
    });

    return (
      <div 
        key={task.id}
        onClick={() => setSelectedTask(task)}
        className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer
          ${categoryColors[task.category]}
          hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
      >
        <h4 className="font-medium mb-2 group-hover:text-current">{task.title}</h4>
        <div className="space-y-2">
          {relevantSteps.map(step => (
            <div key={step.id} className="text-sm">
              <div className="font-medium opacity-80">{step.name}</div>
              <div className="text-xs opacity-60">
                {format(new Date(step.startDate), 'HH:mm')} - {format(new Date(step.endDate), 'HH:mm')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setView(view === 'month' ? 'year' : 'month')}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {view === 'month' ? 'Показать год' : 'Показать месяц'}
          </button>
          <div className="text-sm text-gray-500">
            {format(selectedDate, 'LLLL yyyy')}
          </div>
        </div>

        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          view={view}
          onViewChange={({ view }) => setView(view as 'month' | 'year')}
          className="w-full rounded-xl shadow-sm border border-gray-200 p-4"
          tileClassName={({ date }) => {
            const hasTasksOnDate = getTasksForDate(date).length > 0;
            return `relative ${hasTasksOnDate ? 'font-medium' : ''}`;
          }}
          tileContent={renderTileContent}
          prevLabel={<ChevronLeft className="h-4 w-4" />}
          nextLabel={<ChevronRight className="h-4 w-4" />}
          navigationLabel={({ date }) => 
            <span className="font-medium">
              {format(date, view === 'month' ? 'LLLL' : 'yyyy')}
            </span>
          }
        />

        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-gray-600">Срочно</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-gray-600">Плановые</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-gray-600">Внимание</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">
            {searchTerm ? 'Результаты поиска' : `Задачи на ${format(selectedDate, 'dd.MM.yyyy')}`}
          </h3>
          <span className="text-sm text-gray-500">
            {searchTerm ? `Найдено: ${filteredTasks.length}` : `Задач: ${tasksWithStepsOnDate.length}`}
          </span>
        </div>

        <div className="space-y-3">
          {(searchTerm ? filteredTasks : tasksWithStepsOnDate).map(renderTaskCard)}

          {(searchTerm ? filteredTasks : tasksWithStepsOnDate).length === 0 && (
            <p className="text-center text-gray-500 py-8">
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