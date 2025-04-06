import React from 'react';
import { Calendar as CalendarIcon, Search } from 'lucide-react';

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Поиск задач..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onViewChange(activeView === 'list' ? 'calendar' : 'list')}
          className={`p-2 rounded-lg transition-colors ${
            activeView === 'calendar' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CalendarIcon className="h-5 w-5" />
        </button>

        <button
          onClick={onCreateTask}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Создать задачу
        </button>
      </div>
    </div>
  );
}