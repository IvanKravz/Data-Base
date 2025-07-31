import React from 'react';
import { List, Calendar as CalendarIcon } from 'lucide-react';
import { SearchBar } from '../../../../common/SearchBar';
import { TaskCategoryFilter } from '../../../../tasks/TasksSection/sections/TaskCategoryFilter';
import { Task } from '../../../../../types/tasks';
import './DivisionTasksSection.css';

type TaskCategory = 'all' | 'completed' | 'urgent' | 'planned' | 'attention';

interface TasksFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: 'all' | 'completed' | TaskCategory;
  onCategoryChange: (category: 'all' | 'completed' | TaskCategory) => void;
  activeView: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
  tasks: Task[];
  // Добавляем новые пропсы для фильтрации по датам
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  showOnlyMine: boolean;
  onToggleMine: () => void;
}

export function TasksFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  activeView,
  onViewChange,
  tasks,
  // Добавляем новые пропсы
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showOnlyMine,
  onToggleMine,
}: TasksFiltersProps) {

  return (
    <div className="tasks-filters">
      <div className="tasks-filters-grid">
        <div className="tasks-search-filter">
          <label className="tasks-filter-label">Поиск задач</label>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={onSearchChange}
            placeholder="Поиск задач"
          />
        </div>
        <div className="tasks-date-filter">
          <label className="tasks-filter-label">Период выполнения</label>
          <div className="tasks-date-range">
            <div className="tasks-date-input-group">
              <label className="tasks-date-label">С:</label>
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => onStartDateChange(e.target.value || null)}
                className="tasks-date-input"
              />
            </div>
            <div className="tasks-date-input-group">
              <label className="tasks-date-label">По:</label>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onEndDateChange(e.target.value || null)}
                className="tasks-date-input"
              />
            </div>
          </div>
        </div>

        <div className="tasks-category-filter">
        <label className="tasks-filter-label">Категория</label>
          <TaskCategoryFilter
            tasks={tasks}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            showOnlyMine={showOnlyMine}
            onToggleMine={onToggleMine}
          />
        </div>

        <div className="tasks-view-toggle-container">
          <label className="tasks-filter-label">Вид отображения</label>
          <div className="tasks-view-toggle">
            <button
              onClick={() => onViewChange('list')}
              className={`tasks-view-toggle-button ${activeView === 'list' ? 'tasks-view-toggle-active' : ''}`}
            >
              <List className="tasks-view-icon" />
              <span>Список</span>
            </button>
            <button
              onClick={() => onViewChange('calendar')}
              className={`tasks-view-toggle-button ${activeView === 'calendar' ? 'tasks-view-toggle-active' : ''}`}
            >
              <CalendarIcon className="tasks-view-icon" />
              <span>Календарь</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}