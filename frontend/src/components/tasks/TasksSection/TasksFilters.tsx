import React from 'react';
import { format, parseISO } from 'date-fns';
import { List, Calendar as CalendarIcon } from 'lucide-react';
import { SearchBar } from '../../common/SearchBar';
import { TaskCategoryFilter } from './TaskCategoryFilter';
import { Task } from '../../../types/tasks';
import DatePicker from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import 'react-datepicker/dist/react-datepicker.css';
import './style.css';

type TaskCategory = 'all' | 'completed' | 'urgent' | 'planned' | 'attention';

interface TasksFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: 'all' | 'completed' | TaskCategory;
  onCategoryChange: (category: 'all' | 'completed' | TaskCategory) => void;
  activeView: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
  tasks: Task[];
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
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showOnlyMine,
  onToggleMine,
}: TasksFiltersProps) {
  // parseISO('2026-03-03') возвращает локальную полночь 3 марта,
  // а не UTC-полночь, как new Date('2026-03-03').
  const startDateObj = startDate ? parseISO(startDate) : undefined;
  const endDateObj = endDate ? parseISO(endDate) : undefined;

  const handleDateRangeChange = (update: [Date | null, Date | null]) => {
    const [start, end] = update;
    // format(date, 'yyyy-MM-dd') берёт локальный день —
    // toISOString().split('T')[0] в UTC+3 превращал 3 марта в '2026-03-02'.
    onStartDateChange(start ? format(start, 'yyyy-MM-dd') : null);
    onEndDateChange(end ? format(end, 'yyyy-MM-dd') : null);
  };

  const clearDates = () => {
    onStartDateChange(null);
    onEndDateChange(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    // parseISO → локальная дата; new Date(dateStr) в UTC+3 даёт 3am,
    // но toLocaleDateString всё равно вернёт правильный день.
    // Используем parseISO для единообразия.
    const date = parseISO(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const displayRange =
    startDate || endDate
      ? `${formatDate(startDate)} — ${formatDate(endDate)}`
      : 'Период не выбран';
  const hasRange = !!(startDate || endDate);

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

        <div className="tasks-view-toggle-container">
          <label className="tasks-filter-label">Вид отображения</label>
          <div className="tasks-view-toggle">
            <button
              onClick={() => onViewChange('list')}
              className={`tasks-view-toggle-button ${activeView === 'list' ? 'tasks-view-toggle-active' : ''
                }`}
            >
              <List className="tasks-view-icon" />
              <span>Список</span>
            </button>
            <button
              onClick={() => onViewChange('calendar')}
              className={`tasks-view-toggle-button ${activeView === 'calendar' ? 'tasks-view-toggle-active' : ''
                }`}
            >
              <CalendarIcon className="tasks-view-icon" />
              <span>Календарь</span>
            </button>
          </div>
        </div>

        <div className="tasks-date-filter">
          <label className="tasks-filter-label">Период выполнения</label>

          <div className="tasks-date-display">
            <span className="tasks-date-range-text">{displayRange}</span>
            {hasRange && (
              <button onClick={clearDates} className="tasks-date-clear">
                Очистить
              </button>
            )}
          </div>

          <div className="tasks-date-calendar">
            <DatePicker
              inline
              selectsRange
              startDate={startDateObj}
              endDate={endDateObj}
              onChange={handleDateRangeChange}
              monthsShown={1}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              className="tasks-date-picker"
              locale={ru}
            />
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
      </div>
    </div>
  );
}