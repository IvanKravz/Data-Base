import React from 'react';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import '../style.css';

interface HeaderProps {
  activeView: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCreateTask: () => void;
}

export function Header({ 
  activeView, 
  onViewChange, 
  searchTerm, 
  onSearchChange,
  onCreateTask
}: HeaderProps) {
  return (
    <div className="tasks-header-container">
      <div className="tasks-search-container">
        <Search className="tasks-search-icon" />
        <input
          type="text"
          placeholder="Поиск задач..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="tasks-search-input"
        />
      </div>

      <div className="tasks-header-actions">
        <button
          onClick={() => onViewChange(activeView === 'list' ? 'calendar' : 'list')}
          className={`tasks-view-button ${
            activeView === 'calendar' ? 'tasks-view-button-active' : ''
          }`}
        >
          <CalendarIcon className="tasks-view-icon" />
        </button>

        <button
          onClick={onCreateTask}
          className="tasks-create-button"
        >
          Создать задачу
        </button>
      </div>
    </div>
  );
}