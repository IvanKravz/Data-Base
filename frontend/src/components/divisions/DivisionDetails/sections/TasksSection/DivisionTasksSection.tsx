import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { Task, TaskCategory } from '../../../../../types/tasks';
import { tasksApi } from '../../../../../api/tasks';
import { divisionsApi } from '../../../../../api/divisions';
import { TasksHeader } from '../../../../tasks/TasksSection/TasksHeader';
import { TasksFilters } from '../../../../tasks/TasksSection/TasksFilters';
import { TasksList } from '../../../../tasks/TasksSection/TasksList/TasksList';
import { TasksCalendarView } from '../../../../tasks/TasksSection/TasksCalendarView';
import { TasksCalendarSidebar } from '../../../../tasks/TasksSection/TasksCalendarSidebar';
import { CreateTaskModal } from '../../../../tasks/CreateTaskModal';
import './DivisionTasksSection.css';

interface CalendarState {
  date: Date;
  view: 'month' | 'year';
  activeStartDate: Date;
}

interface DivisionData {
  id: string;
  name: string;
  subdivisions?: Array<{ id: string; name: string }>;
}

export function DivisionTasksSection() {
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [division, setDivision] = useState<DivisionData | null>(null);
  const [subdivisionName, setSubdivisionName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('accessToken');
  const subdivisionId = searchParams.get('subdivision');

  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = user?.id;
  const permissions = user?.permissions;

  const [calendarState, setCalendarState] = useState<CalendarState>({
    date: new Date(),
    view: 'month',
    activeStartDate: new Date()
  });

  const stableToken = useMemo(() => token, [token]);
  const stableSubdivisionId = useMemo(() => subdivisionId, [subdivisionId]);

  const isExploitationUser = useMemo(() =>
    user?.roles?.includes('exploitation_chief') || user?.roles?.includes('exploitation_employee'), [user]);
  const isChief = useMemo(() => user?.roles?.includes('exploitation_chief'), [user]);
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  const canCreateTask = useMemo(() => permissions?.models?.Task?.includes('add') ?? false, [permissions]);

  const handleBack = useCallback(() => {
    if (!id) return;
    if (stableSubdivisionId) navigate(`/divisions/${id}?subdivision=${stableSubdivisionId}`);
    else navigate(`/divisions/${id}`);
  }, [navigate, id, stableSubdivisionId]);

  const calculateTaskCompletion = useCallback((task: Task): boolean => {
    return task.steps.length > 0 && task.steps.every(step => step.is_completed);
  }, []);

  const updateTaskInState = useCallback((updatedTask: Task) => {
    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(task => task.id === updatedTask.id);
      if (taskIndex !== -1) {
        const updatedTasks = [...prevTasks];
        updatedTasks[taskIndex] = {
          ...prevTasks[taskIndex],
          ...updatedTask,
          steps: updatedTask.steps || prevTasks[taskIndex].steps,
          is_completed: calculateTaskCompletion(updatedTask)
        };
        return updatedTasks;
      } else {
        return [{ ...updatedTask, is_completed: calculateTaskCompletion(updatedTask) }, ...prevTasks];
      }
    });
  }, [calculateTaskCompletion]);

  const loadTasksData = useCallback(async () => {
    if (!stableToken) return;
    try {
      setLoading(true);
      if (isExploitationUser && !id) {
        const userDivisionId = user?.division_info?.id;
        if (userDivisionId) {
          const params = isChief
            ? { division: userDivisionId, show_completed: "true", show_only_mine: showOnlyMine }
            : { division: userDivisionId, subdivision: user?.division_info?.subdivision?.id, show_completed: "true", show_only_mine: showOnlyMine };
          const [tasksData, divisionData] = await Promise.all([
            tasksApi.getTasks(params, stableToken),
            divisionsApi.getDivisionById(userDivisionId, stableToken)
          ]);
          const tasksWithCompletion = tasksData.map(task => ({ ...task, is_completed: calculateTaskCompletion(task) }));
          setTasks(tasksWithCompletion);
          setDivision(divisionData);
          if (!isChief && user?.division_info?.subdivision?.id) {
            const userSubdivision = divisionData.subdivisions?.find(s => s.id.toString() === user.division_info.subdivision.id.toString());
            setSubdivisionName(userSubdivision?.name || '');
          }
        } else {
          const tasksData = await tasksApi.getTasks({ show_completed: "true", show_only_mine: showOnlyMine }, stableToken);
          setTasks(tasksData.map(task => ({ ...task, is_completed: calculateTaskCompletion(task) })));
        }
      } else if (isGlobalView) {
        const tasksData = await tasksApi.getTasks({ show_completed: "true", show_only_mine: showOnlyMine }, stableToken);
        setTasks(tasksData.map(task => ({ ...task, is_completed: calculateTaskCompletion(task) })));
      } else {
        const params = { division: id!, subdivision: stableSubdivisionId || undefined, show_completed: "true", show_only_mine: showOnlyMine };
        const [tasksData, divisionData] = await Promise.all([
          tasksApi.getTasks(params, stableToken),
          divisionsApi.getDivisionById(id!, stableToken)
        ]);
        const tasksWithCompletion = tasksData.map(task => ({ ...task, is_completed: calculateTaskCompletion(task) }));
        setTasks(tasksWithCompletion);
        setDivision(divisionData);
        if (stableSubdivisionId) {
          const subdivision = divisionData.subdivisions?.find(s => s.id.toString() === stableSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        }
      }
    } catch (error) {
      console.error('Не удалось загрузить данные:', error);
    } finally {
      setLoading(false);
    }
  }, [stableToken, id, isExploitationUser, isGlobalView, isChief, user, showOnlyMine, stableSubdivisionId, calculateTaskCompletion]);

  useEffect(() => {
    loadTasksData();
  }, [loadTasksData]);

  const filterBySubdivision = useCallback((items: Task[]) => {
    if (isExploitationUser && !id) return items;
    if (isGlobalView || !stableSubdivisionId) return items;
    return items.filter(item => item.subdivision?.id?.toString() === stableSubdivisionId.toString());
  }, [isExploitationUser, id, isGlobalView, stableSubdivisionId]);

  const filteredTasks = useMemo(() => {
    const subdivisionFiltered = filterBySubdivision(tasks);
    return subdivisionFiltered.filter(task => {
      const searchMatch = searchTerm === '' ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.steps.some(step => step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (step.comments && step.comments.toLowerCase().includes(searchTerm.toLowerCase())));
      const categoryMatch = selectedCategory === 'all' ? !task.is_completed :
        selectedCategory === 'completed' ? task.is_completed :
          !task.is_completed && task.category === selectedCategory;
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
      const mineMatch = !showOnlyMine || (task.is_private && task.created_by?.id === currentUserId);
      return searchMatch && categoryMatch && dateMatch && mineMatch;
    });
  }, [tasks, filterBySubdivision, selectedCategory, searchTerm, startDate, endDate, showOnlyMine, currentUserId]);

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить задачу?')) {
      try {
        await tasksApi.deleteTask(taskId, stableToken!);
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowCreateModal(true);
  };

  const handleCreateTask = async (newTaskData: Omit<Task, 'id'>) => {
    try {
      let divisionId = newTaskData.division_id;
      let subdivisionId = newTaskData.subdivision_id;
      if (isExploitationUser && !id) {
        divisionId = user?.division_info?.id;
        if (!isChief) subdivisionId = user?.division_info?.subdivision?.id;
      }
      const finalTaskData = { ...newTaskData, division_id: divisionId, subdivision_id: subdivisionId ?? null };
      const createdTask = await tasksApi.createTask(finalTaskData, stableToken!);
      updateTaskInState(createdTask);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const isTempId = (id: string | undefined) => !id || id.toString().startsWith('temp-');
      const response = await tasksApi.updateTask(
        stableToken!,
        String(updatedTask.id),
        {
          title: updatedTask.title,
          category: updatedTask.category,
          division_id: updatedTask.division?.id,
          subdivision_id: updatedTask.subdivision?.id ?? null,
          is_private: updatedTask.is_private,
          steps: updatedTask.steps.map(step => ({
            id: (step.id && !isTempId(step.id) && !isNaN(Number(step.id))) ? parseInt(step.id) : undefined,
            name: step.name,
            comments: step.comments || '',
            start_date: step.start_date,
            end_date: step.end_date,
            is_completed: step.is_completed
          }))
        }
      );
      updateTaskInState(response);
      setShowCreateModal(false);
      setSelectedTask(null);
      setTimeout(() => loadTasksData(), 100);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const toggleTaskStep = async (taskId: string, stepId: string, currentCompleted: boolean) => {
    const newCompletedStatus = !currentCompleted;
    const previousTasks = tasks;
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        const updatedSteps = task.steps.map(step => step.id === stepId ? { ...step, is_completed: newCompletedStatus } : step);
        return { ...task, steps: updatedSteps, is_completed: updatedSteps.every(s => s.is_completed) };
      }
      return task;
    }));
    try {
      await tasksApi.updateTaskStep(stepId, newCompletedStatus, stableToken!);
    } catch (error) {
      console.error('Failed to toggle step:', error);
      setTasks(previousTasks);
    }
  };

  const updateCalendarState = (newState: Partial<CalendarState>) => {
    setCalendarState(prev => ({ ...prev, ...newState }));
  };

  const handleStepClick = (step: any) => {
    setActiveView('calendar');
    updateCalendarState({ date: new Date(step.start_date), view: 'month' });
  };

  const renderNoTasksMessage = () => {
    const hasActiveFilters = searchTerm || selectedCategory !== 'all' || startDate || endDate || showOnlyMine;
    return (
      <div className="tasks-empty-state">
        <h3>Задачи отсутствуют</h3>
        <p>{hasActiveFilters ? 'Попробуйте изменить параметры фильтрации или очистить фильтры' : 'Создайте первую задачу, нажав кнопку "Создать задачу"'}</p>
      </div>
    );
  };

  const renderTasksContent = () => {
    if (loading) return <div className="tasks-loading"><div className="tasks-spinner"></div></div>;
    if (filteredTasks.length === 0) return renderNoTasksMessage();
    if (activeView === 'list') {
      return <TasksList tasks={filteredTasks} onEditTask={handleEditTask} onDeleteTask={handleDeleteTask} onToggleStep={toggleTaskStep} />;
    }
    return (
      <div className="calendar-view-container">
        <TasksCalendarView tasks={filteredTasks} onTaskClick={handleEditTask} calendarState={calendarState} onCalendarStateChange={updateCalendarState} />
        <TasksCalendarSidebar tasks={filteredTasks} selectedDate={calendarState.date} onTaskClick={handleEditTask} onStepClick={handleStepClick} />
      </div>
    );
  };

  const getHeaderTitle = () => {
    if (isExploitationUser && !id) {
      const divisionName = user?.division_info?.name || 'Ваше подразделение';
      return `Задачи: ${divisionName}`;
    }
    if (isGlobalView) return 'Все задачи';
    return `Задачи: ${division?.name || ''} ${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  };

  const restrictedDivisionId = useMemo(() => {
    if (isExploitationUser && !isChief && user?.division_info?.id) return user.division_info.id;
    return null;
  }, [isExploitationUser, isChief, user]);
  const restrictedSubdivisionId = useMemo(() => {
    if (isExploitationUser && !isChief && user?.division_info?.subdivision?.id) return user.division_info.subdivision.id;
    return null;
  }, [isExploitationUser, isChief, user]);

  return (
    <div className="tasks-container">
      <div className="tasks-content-wrapper">
        <TasksHeader
          subdivisionName={subdivisionName}
          divisionName={division?.name}
          onBack={handleBack}
          onCreateTask={() => canCreateTask && setShowCreateModal(true)}
          showBackButton={!!id}
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
            {renderTasksContent()}
          </div>
        </div>
        {showCreateModal && (
          <CreateTaskModal
            initialTask={selectedTask}
            divisionId={id}
            restrictedDivisionId={restrictedDivisionId}
            restrictedSubdivisionId={restrictedSubdivisionId}
            onClose={() => { setShowCreateModal(false); setSelectedTask(null); }}
            onCreate={handleCreateTask}
            onUpdate={handleUpdateTask}
          />
        )}
      </div>
    </div>
  );
}