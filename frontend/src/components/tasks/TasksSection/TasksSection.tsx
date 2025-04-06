import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { TasksList } from '../TasksList/TasksList';
import { TaskCalendar } from '../TaskCalendar/TaskCalendar';
import { Header } from './sections/Header';
import { DivisionFilter } from './sections/DivisionFilter';
import { TaskCategoryFilter } from './sections/TaskCategoryFilter';
import { TaskCategory } from '../../../types/taskCategories';
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

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.steps.some(step => 
        step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.comments.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

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
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}