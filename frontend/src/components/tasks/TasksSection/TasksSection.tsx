import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { TasksList } from '../TasksList/TasksList';
import { TaskCalendar } from '../TaskCalendar/TaskCalendar';
import { Header } from './sections/Header';
import { DivisionFilter } from './sections/DivisionFilter';
import { TaskCategoryFilter } from './sections/TaskCategoryFilter';
import { TaskCategory, isTaskCompleted } from '../../../types/taskCategories';
import { fetchTasks } from '../../../store/thunks/tasksThunks';
import { CreateTaskModal } from '../CreateTaskModal';

export function TasksSection() {
  const dispatch = useDispatch();
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const loading = useSelector((state: RootState) => state.tasks.loading);

  useEffect(() => {
    dispatch(fetchTasks(selectedDivision !== 'all' ? selectedDivision : undefined));
  }, [dispatch, selectedDivision]);

  // Calculate task counts for all categories
  const calculateTaskCounts = (tasks: Task[], divisionId: string) => {
    const filteredTasks = divisionId === 'all' 
      ? tasks 
      : tasks.filter(task => task.division?.id === divisionId);
  
    return {
      all: filteredTasks.length,
      urgent: filteredTasks.filter(t => t.category === 'urgent').length,
      planned: filteredTasks.filter(t => t.category === 'planned').length,
      attention: filteredTasks.filter(t => t.category === 'attention').length,
      completed: filteredTasks.filter(isTaskCompleted).length,
    };
  };
  
  const taskCounts = useMemo(() => calculateTaskCounts(tasks, selectedDivision), 
    [tasks, selectedDivision]);
  
  // Фильтрация задач для отображения
  const filteredTasks = useMemo(() => {
    const divisionFiltered = selectedDivision === 'all' 
      ? tasks 
      : tasks.filter(t => t.division?.id === selectedDivision);
  
    return divisionFiltered.filter(task => {
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.steps.some(step => 
          step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (step.comments && step.comments.toLowerCase().includes(searchTerm.toLowerCase()))
        );
  
      if (!matchesSearch) return false;
  
      switch (selectedCategory) {
        case 'completed': return isTaskCompleted(task);
        case 'all': return true;
        default: return task.category === selectedCategory;
      }
    });
  }, [tasks, selectedDivision, selectedCategory, searchTerm]);

  const handleCreateTask = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <Header
          activeView={activeView}
          onViewChange={setActiveView}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateTask={handleCreateTask}
        />

        <DivisionFilter
          selectedDivision={selectedDivision}
          onDivisionChange={setSelectedDivision}
        />

        <TaskCategoryFilter
          taskCounts={taskCounts}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeView === 'list' ? (
            <TasksList tasks={filteredTasks} />
          ) : (
            <TaskCalendar tasks={filteredTasks} />
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          divisionId={selectedDivision !== 'all' ? selectedDivision : undefined}
        />
      )}
    </div>
  );
}