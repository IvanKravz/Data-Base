import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Task, TaskCategory } from '../../../../../types/tasks';
import { tasksApi } from '../../../../../api/tasks';
import { divisionsApi } from '../../../../../api/divisions';
import { TasksHeader } from '../../../../tasks/TasksSection/TasksHeader';
import { TasksFilters } from '../../../../tasks/TasksSection/TasksFilters';
import { TasksList } from '../../../../tasks/TasksSection/TasksList';
import { TasksCalendarView } from '../../../../tasks/TasksSection/TasksCalendarView';
import { TasksCalendarSidebar } from '../../../../tasks/TasksSection/TasksCalendarSidebar';
import { CreateTaskModal } from '../../../../tasks/CreateTaskModal';
import './DivisionTasksSection.css';
import { isExploitationChief, isExploitationEmployee, getCurrentUser } from '../../../../../api/utils/permissions';

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
    activeStartDate: new Date()
  });

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('accessToken');
  const subdivisionId = searchParams.get('subdivision');

  // Получаем данные текущего пользователя
  const currentUser = getCurrentUser();

  // Стабилизированные значения для зависимостей
  const stableToken = useMemo(() => token, [token]);
  const stableSubdivisionId = useMemo(() => subdivisionId, [subdivisionId]);
  const stableCurrentUser = useMemo(() => currentUser, [JSON.stringify(currentUser)]);

  // Определяем тип пользователя
  const isExploitationUser = useMemo(() => isExploitationChief() || isExploitationEmployee(), []);
  const isChief = useMemo(() => isExploitationChief(), []);

  // Для эксплуатационных пользователей отключаем глобальный режим
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  // Обработчик возврата назад
  const handleBack = useCallback(() => {
    if (id) {
      // Если есть subdivision в URL, возвращаемся к подразделению с учетом отделения
      if (stableSubdivisionId) {
        navigate(`/divisions/${id}?subdivision=${stableSubdivisionId}`);
      } else {
        navigate(`/divisions/${id}`);
      }
    }
  }, [navigate, id, stableSubdivisionId]);

  // Загрузка задач
  useEffect(() => {
    const loadTasks = async () => {
      if (!stableToken) return;

      try {
        setLoading(true);

        // Если пользователь эксплуатации и нет id (глобальный режим для обычных пользователей)
        if (isExploitationUser && !id) {
          const userDivisionId = stableCurrentUser?.division_info?.id;

          if (userDivisionId) {
            // Для начальника - все задачи подразделения
            // Для сотрудника - задачи его отделения
            const params = isChief ?
              {
                division: userDivisionId,
                show_completed: "true",
                show_only_mine: showOnlyMine
              } :
              {
                division: userDivisionId,
                subdivision: stableCurrentUser.division_info.subdivision?.id,
                show_completed: "true",
                show_only_mine: showOnlyMine
              };

            const [tasksData, div] = await Promise.all([
              tasksApi.getTasks(params, stableToken),
              divisionsApi.getDivisionById(userDivisionId, stableToken)
            ]);

            const tasksWithCompletion = tasksData.map(task => ({
              ...task,
              is_completed: task.steps.length > 0 && task.steps.every(step => step.is_completed)
            }));

            if (!isChief) {
              const userSubdivision = div.subdivisions?.find(
                s => s.id.toString() === stableCurrentUser.division_info.subdivision?.id?.toString()
              );
              setSubdivisionName(userSubdivision?.name || '');
            }

            setDivision(div);
            setTasks(tasksWithCompletion);
          } else {
            // Если нет информации о подразделении, загружаем все задачи
            const tasksData = await tasksApi.getTasks({
              show_completed: "true",
              show_only_mine: showOnlyMine
            }, stableToken);

            const tasksWithCompletion = tasksData.map(task => ({
              ...task,
              is_completed: task.steps.length > 0 && task.steps.every(step => step.is_completed)
            }));

            setTasks(tasksWithCompletion);
          }
        } else if (isGlobalView) {
          // Глобальный режим для обычных пользователей - загружаем все задачи
          const tasksData = await tasksApi.getTasks({
            show_completed: "true",
            show_only_mine: showOnlyMine
          }, stableToken);

          const tasksWithCompletion = tasksData.map(task => ({
            ...task,
            is_completed: task.steps.length > 0 && task.steps.every(step => step.is_completed)
          }));

          setTasks(tasksWithCompletion);
        } else {
          // Режим подразделения (есть id)
          const params = {
            division: id,
            subdivision: stableSubdivisionId || undefined,
            show_completed: "true",
            show_only_mine: showOnlyMine
          };

          const [tasksData, divisionData] = await Promise.all([
            tasksApi.getTasks(params, stableToken),
            divisionsApi.getDivisionById(id, stableToken)
          ]);

          const tasksWithCompletion = tasksData.map(task => ({
            ...task,
            is_completed: task.steps.length > 0 && task.steps.every(step => step.is_completed)
          }));

          setDivision(divisionData);

          if (stableSubdivisionId) {
            const subdivision = divisionData.subdivisions?.find(s => s.id.toString() === stableSubdivisionId.toString());
            setSubdivisionName(subdivision?.name || '');
          }

          setTasks(tasksWithCompletion);
        }
      } catch (error) {
        console.error('Не удалось загрузить данные:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [id, stableToken, stableSubdivisionId, showOnlyMine, isGlobalView, isExploitationUser, isChief, stableCurrentUser]);

  // Получаем заголовок в зависимости от контекста
  const getHeaderTitle = useCallback(() => {
    // Для пользователей эксплуатации в "глобальном" режиме (когда нет id)
    if (isExploitationUser && !id) {
      const divisionName = stableCurrentUser?.division_info?.name || 'Ваше подразделение';
      // Для всех эксплуатационных пользователей показываем только подразделение
      return `Задачи: ${divisionName}`;
    }
  
    // Для глобального режима обычных пользователей
    if (isGlobalView) {
      return 'Все задачи';
    }
  
    // Для режима конкретного подразделения
    return `Задачи: ${division?.name || ''} ${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  }, [isExploitationUser, id, stableCurrentUser, isGlobalView, division, subdivisionName]);

  // Логика фильтрации для отделения
  const filterBySubdivision = useCallback((items: Task[]) => {
    // Для сотрудника эксплуатации не фильтруем по отделению - показываем все задачи подразделения
    if (isExploitationUser && !id) {
      return items;
    }

    // Для обычных случаев
    if (isGlobalView) return items;
    if (!stableSubdivisionId) return items;

    return items.filter(item =>
      item.subdivision?.id?.toString() === stableSubdivisionId.toString()
    );
  }, [isExploitationUser, id, isGlobalView, stableSubdivisionId]);

  // Фильтрация задач
  const filteredTasks = useMemo(() => {
    const subdivisionFilteredTasks = filterBySubdivision(tasks);

    return subdivisionFilteredTasks.filter(task => {
      // 1. Фильтрация по поиску
      const searchMatch = searchTerm === '' ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.steps.some(step =>
          step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (step.comments && step.comments.toLowerCase().includes(searchTerm.toLowerCase()))
        );

      // 2. Фильтрация по категории и завершенности
      const categoryMatch =
        selectedCategory === 'all' ? !task.is_completed :
          selectedCategory === 'completed' ? task.is_completed :
            !task.is_completed && task.category === selectedCategory;

      // 3. Фильтрация по датам
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

      // 4. Фильтрация по "Свои задачи"
      const mineMatch = !showOnlyMine ||
        (task.is_private && task.created_by?.id === currentUserId);

      return searchMatch && categoryMatch && dateMatch && mineMatch;
    });
  }, [tasks, filterBySubdivision, selectedCategory, searchTerm, startDate, endDate, showOnlyMine, currentUserId]);

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
      // Для эксплуатационных пользователей в глобальном режиме используем их подразделение
      let divisionId = newTask.division?.id;
      let subdivisionId = newTask.subdivision?.id;

      if (isExploitationUser && !id) {
        divisionId = stableCurrentUser?.division_info?.id;
        if (!isChief) {
          subdivisionId = stableCurrentUser?.division_info?.subdivision?.id;
        }
      }

      const createdTask = await tasksApi.createTask({
        title: newTask.title,
        category: newTask.category,
        division_id: divisionId,
        subdivision_id: subdivisionId ?? null,
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
          division_id: updatedTask.division?.id || null,
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
        const filteredTasks = prevTasks.filter(task => task.id !== updatedTask.id);

        // Если мы в режиме подразделения, проверяем, должна ли задача остаться
        if (id) {
          const shouldKeepTask =
            response.division.id.toString() === id &&
            (stableSubdivisionId ? response.subdivision?.id?.toString() === stableSubdivisionId : true);
          return shouldKeepTask ? [...filteredTasks, response] : filteredTasks;
        }

        // В глобальном режиме просто добавляем обновленную задачу
        return [...filteredTasks, response];
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
            is_completed: allStepsCompleted
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
    setActiveView('calendar');
    updateCalendarState({
      date: startDate,
      view: 'month'
    });
  };

  // Функция для отображения сообщения когда нет задач
  const renderNoTasksMessage = () => {
    const hasActiveFilters = searchTerm || selectedCategory !== 'all' || startDate || endDate || showOnlyMine;

    if (hasActiveFilters) {
      return (
        <div className="tasks-empty-state">
          <h3>Задачи не найдены</h3>
          <p>Попробуйте изменить параметры фильтрации или очистить фильтры</p>
        </div>
      );
    } else {
      return (
        <div className="tasks-empty-state">
          <h3>Задачи отсутствуют</h3>
          <p>Создайте первую задачу, нажав кнопку "Создать задачу"</p>
        </div>
      );
    }
  };

  return (
    <div className="tasks-container">
      <div className="tasks-content-wrapper">
        <TasksHeader
          subdivisionName={subdivisionName}
          divisionName={division?.name}
          onBack={handleBack}
          onCreateTask={() => setShowCreateModal(true)}
          showBackButton={!!id} // Простая проверка - показывать кнопку назад только если есть id
          headerTitle={getHeaderTitle()}
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
                {filteredTasks.length === 0 ? (
                  renderNoTasksMessage()
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
              </>
            )}
          </div>
        </div>

        {showCreateModal && (
          <CreateTaskModal
            initialTask={selectedTask}
            divisionId={id} // Может быть undefined в глобальном режиме
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