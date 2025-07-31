import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Task, TaskCategory } from '../../../../../types/tasks';
import { tasksApi } from '../../../../../api/tasks';
import { divisionsApi } from '../../../../../api/divisions';
import { TasksHeader } from './TasksHeader';
import { TasksFilters } from './TasksFilters';
import { TasksList } from './TasksList';
import { TasksCalendarView } from './TasksCalendarView';
import { TasksCalendarSidebar } from './TasksCalendarSidebar';
import { CreateTaskModal } from '../../../../tasks/CreateTaskModal';
import './DivisionTasksSection.css';

interface CalendarState {
  date: Date;
  view: 'month' | 'year';
  activeStartDate: Date;
}

export function DivisionTasksSection() {
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [division, setDivision] = useState<any>(null);
  const [subdivisionName, setSubdivisionName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [loading, setLoading] = useState(true);
  const userData = JSON.parse(localStorage.getItem('user')) || {};
  const currentUserId = userData.id || userData.user?.id || null;

  const [calendarState, setCalendarState] = useState<CalendarState>({
    date: new Date(),
    view: 'month',
    activeStartDate: new Date() // Инициализируем активную дату
  });

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('accessToken');
  const subdivisionId = searchParams.get('subdivision');

  // Загрузка задач
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const params = {
          division: id,
          subdivision: subdivisionId || undefined,
          show_completed: "true",
          show_only_mine: showOnlyMine
        };
    

        const [tasksData, divisionData] = await Promise.all([
          tasksApi.getTasks(params, token!),
          divisionsApi.getDivisionById(id!, token!)
        ]);

        const tasksWithCompletion = tasksData.map(task => ({
          ...task,
          is_completed: task.steps.length > 0 && task.steps.every(step => step.is_completed)
        }));

        setDivision(divisionData);

        
        if (subdivisionId) {
          const subdivision = divisionData.subdivisions?.find(s => s.id.toString() === subdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        }
  
        setTasks(tasksWithCompletion);
        
  
      } catch (error) {
        console.error('Не удалось загрузить данные:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadTasks();
  }, [id, subdivisionId, token, showCreateModal, showOnlyMine]);

  // Фильтрация задач
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Фильтрация по подразделению
      const subdivisionMatch = !subdivisionId ||
        (task.subdivision && task.subdivision.id.toString() === subdivisionId.toString());

      // 2. Фильтрация по поиску
      const searchMatch = searchTerm === '' ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.steps.some(step =>
          step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (step.comments && step.comments.toLowerCase().includes(searchTerm.toLowerCase()))
        );

      // 3. Фильтрация по категории и завершенности
      const categoryMatch =
        selectedCategory === 'all' ? !task.is_completed : // ТОЛЬКО НЕЗАВЕРШЕННЫЕ для "Все"
          selectedCategory === 'completed' ? task.is_completed :
            !task.is_completed && task.category === selectedCategory;

      // 4. Фильтрация по датам
      let dateMatch = true;
      if (startDate || endDate) {
        dateMatch = task.steps.some(step => {
          const stepStart = step.start_date;
          const stepEnd = step.end_date;

          if (startDate && !endDate) return stepStart >= startDate;
          if (!startDate && endDate) return stepEnd <= endDate;
          if (startDate && endDate) return stepStart <= endDate && stepEnd >= startDate;
          return true;
        });
      }

      // 5. Фильтрация по "Свои задачи"
      const mineMatch = !showOnlyMine ||
        (task.is_private && task.created_by?.id === currentUserId);

      return subdivisionMatch && searchMatch && categoryMatch && dateMatch && mineMatch;
    });
  }, [tasks, selectedCategory, searchTerm, subdivisionId, startDate, endDate, showOnlyMine, currentUserId]);
  // Обработчики действий
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить задачу?')) {
      try {
        await tasksApi.deleteTask(taskId);
        setTasks(tasks.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowCreateModal(true);
  };

  const handleCreateTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      const createdTask = await tasksApi.createTask({
        title: newTask.title,
        category: newTask.category,
        division_id: newTask.division.id,
        subdivision_id: newTask.subdivision?.id ?? null,
        is_private: newTask.is_private,
        steps: newTask.steps.map(step => ({
          name: step.name,
          comments: step.comments,
          start_date: step.start_date,
          end_date: step.end_date,
        })),
      });
      setTasks([...tasks, createdTask]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Authentication token missing');

      const response = await tasksApi.updateTask(
        token,
        String(updatedTask.id),
        {
          title: updatedTask.title,
          category: updatedTask.category,
          division_id: updatedTask.division.id,
          subdivision_id: updatedTask.subdivision?.id ?? null,
          is_private: updatedTask.is_private,
          steps: updatedTask.steps.map(step => ({
            name: step.name,
            comments: step.comments || '',
            start_date: step.start_date,
            end_date: step.end_date
          }))
        }
      );

      setTasks(prevTasks => {
        // Удаляем задачу из текущего списка
        const filteredTasks = prevTasks.filter(task => task.id !== updatedTask.id);

        // Проверяем, должна ли задача остаться в текущем подразделении
        const shouldKeepTask =
          response.division.id.toString() === id &&
          (subdivisionId ? response.subdivision?.id?.toString() === subdivisionId : true);

        // Если задача осталась в текущем подразделении, добавляем обновленную версию
        return shouldKeepTask ? [...filteredTasks, response] : filteredTasks;
      });

      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };


  const toggleTaskStep = async (taskId: string, stepId: string, isCompleted: boolean) => {
    try {
      await tasksApi.updateTaskStep(stepId, isCompleted);

      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          const updatedSteps = task.steps.map(step =>
            step.id === stepId ? { ...step, is_completed: isCompleted } : step
          );

          const allStepsCompleted = updatedSteps.length > 0 &&
            updatedSteps.every(step => step.is_completed);

          return {
            ...task,
            steps: updatedSteps,
            is_completed: allStepsCompleted // Обновляем статус задачи
          };
        }
        return task;
      }));
    } catch (error) {
      console.error('Failed to toggle task step:', error);
    }
  };


  // Функция для обновления состояния календаря
  const updateCalendarState = (newState: Partial<CalendarState>) => {
    setCalendarState(prev => ({ ...prev, ...newState }));
  };

  // Обработчик клика на этапе в сайдбаре
  const handleStepClick = (step: Step) => {
    const startDate = new Date(step.start_date);

    // Переключаемся на вкладку календаря
    setActiveView('calendar');

    // Устанавливаем дату начала этапа
    updateCalendarState({
      date: startDate,
      view: 'month'
    });
  };

  return (
    <div className="tasks-container">
      <div className="tasks-content-wrapper">
        <TasksHeader
          subdivisionName={subdivisionName}
          divisionName={division?.name}
          onBack={() => navigate(`/divisions/${id}`)}
          onCreateTask={() => setShowCreateModal(true)}
        />

        <div className="tasks-layout">
          <div className="tasks-filters-section">
            <TasksFilters
              tasks={tasks}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              activeView={activeView}
              onViewChange={setActiveView}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              showOnlyMine={showOnlyMine}
              onToggleMine={() => setShowOnlyMine(!showOnlyMine)}
            />
          </div>

          <div className="tasks-main-section">
            {loading ? (
              <div className="tasks-loading">
                <div className="tasks-spinner"></div>
              </div>
            ) : (
              <>
                {activeView === 'list' ? (
                  <TasksList
                    tasks={filteredTasks}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onToggleStep={toggleTaskStep}
                  />
                ) : (
                  <div className="calendar-view-container">
                    <TasksCalendarView
                      tasks={filteredTasks}
                      onTaskClick={handleEditTask}
                      calendarState={calendarState}
                      onCalendarStateChange={updateCalendarState}
                    />
                    <TasksCalendarSidebar
                      tasks={filteredTasks}
                      onTaskClick={handleEditTask}
                      onStepClick={handleStepClick}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {showCreateModal && (
          <CreateTaskModal
            initialTask={selectedTask}
            divisionId={id!}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedTask(null);
            }}
            onCreate={handleCreateTask}
            onUpdate={handleUpdateTask}
          />
        )}
      </div>
    </div>
  );
}