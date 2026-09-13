// components/equipment/DisposedEquipment/DisposedEquipmentFilters.tsx
import React from 'react';
import { Calendar } from 'lucide-react';
import './styles/DisposedEquipmentFilters.css';

interface DisposedEquipmentFiltersProps {
  years: number[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export function DisposedEquipmentFilters({
  years,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  dateRange,
  onDateRangeChange
}: DisposedEquipmentFiltersProps) {
  return (
    <div className="def-filters-container">
      <div className="def-filters-row">
        <div className="def-filter-group">
          <label className="def-filter-label">Год списания</label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="def-filter-select"
          >
            <option value="all">Все годы</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="def-filter-group">
          <label className="def-filter-label">Месяц</label>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="def-filter-select"
          >
            <option value="all">Все месяцы</option>
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="def-date-range">
        <label className="def-filter-label">Период списания</label>
        <div className="def-date-range-inputs">
          <div className="def-date-input-wrapper">
            <Calendar className="def-date-icon" size={18} />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
              className="def-date-input"
            />
          </div>
          <span className="def-date-separator">—</span>
          <div className="def-date-input-wrapper">
            <Calendar className="def-date-icon" size={18} />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
              className="def-date-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}