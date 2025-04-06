import React from 'react';
import { Calendar } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Year filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1.5 text-gray-700">
            Год списания
          </label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все годы</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Month filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1.5 text-gray-700">
            Месяц
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все месяцы</option>
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date range filter */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Период списания
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <span className="text-gray-500">—</span>
          <div className="flex-1">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}