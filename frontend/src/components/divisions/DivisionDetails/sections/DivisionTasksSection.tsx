import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState } from '../../../../store/store';
import { Task } from '../../../../types/tasks';
import { ArrowLeft } from 'lucide-react';
import { SearchBar } from '../../../common/SearchBar';
import { TaskCard } from '../../../tasks/TaskCard';
import { CreateTaskModal } from '../../../tasks/CreateTaskModal';
import { fetchTasks } from '../../../../store/thunks/tasksThunks';
import { deleteTask } from '../../../../store/slices/tasksSlice';
import './style.css';
import { Header } from '../../../tasks/TaskCard/sections/Header';
import { DivisionFilter } from '../../../tasks/TasksSection/sections/DivisionFilter';
import { TaskCategoryFilter } from '../../../tasks/TasksSection/sections/TaskCategoryFilter';
import { TasksList } from '../../../tasks/TasksSection/sections/TasksList';
import { TaskCalendar } from '../../../tasks/TasksSection/sections/TaskCalendar';

export function DivisionTasksSection() {
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all' | 'completed'>('all');


  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const { tasks, loading } = useSelector((state: RootState) => state.tasks);
  const division = useSelector((state: RootState) => 
    state.facilities.divisions.results?.find(d => d.id == id)
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchTasks(id));
    }
  }, [dispatch, id]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.steps.some(step => 
        step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.comments.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить задачу?')) {
      await dispatch(deleteTask(taskId));
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowCreateModal(true);
  };

  const handleCreateTask = () => {
    setShowCreateModal(true);
  };

  const onBack = () => {
    navigate(`/divisions/${id}`);
  };

  return (
    <div className="section-container">
      <div className="flex justify-between items-center mb-6">
        <h2 className="section-title">
          <button onClick={onBack} className="back-button">
            <ArrowLeft className="back-button-icon" />
          </button>
          Задачи подразделения: {division?.name || 'Загрузка...'}
        </h2>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Создать задачу
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* <Header
          activeView={activeView}
          onViewChange={setActiveView}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateTask={handleCreateTask}
        /> */}

        <DivisionFilter
          selectedDivision={selectedDivision}
          onDivisionChange={setSelectedDivision}
        />

        <TaskCategoryFilter
          tasks={filteredTasks}
          selectedDivision={selectedDivision}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-gray-200 animate-spin">
                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeView === 'list' ? (
            <TasksList
              selectedDivision={selectedDivision}
              selectedCategory={selectedCategory}
              searchTerm={searchTerm}
            />
          ) : (
            <TaskCalendar
              selectedDivision={selectedDivision}
              searchTerm={searchTerm}
            />
          )}
        </div>
      )}


      {showCreateModal && (
        <CreateTaskModal
          initialTask={selectedTask}
          divisionId={id}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}