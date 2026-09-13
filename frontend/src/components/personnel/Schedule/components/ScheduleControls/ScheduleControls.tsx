// components/ScheduleControls/ScheduleControls.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import './ScheduleControls.css';

interface ScheduleControlsProps {
    currentYear: number;
    currentMonth: number;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    canEdit: boolean;
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;
}

const ScheduleControls: React.FC<ScheduleControlsProps> = ({
    currentYear,
    currentMonth,
    onPrevMonth,
    onNextMonth,
    canEdit,
    selectedDate,
    setSelectedDate,
}) => {
    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleClearDate = () => {
        setSelectedDate(null);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val) {
            setSelectedDate(new Date(val));
        } else {
            setSelectedDate(null);
        }
    };

    return (
        <div className="schedule-header-right">
            {/* Блок выбора даты (слева) */}
            <div className="schedule-date-picker">
                <label>Дата:</label>
                <input
                    type="date"
                    value={selectedDate ? formatLocalDate(selectedDate) : ''}
                    onChange={handleDateChange}
                />
                {selectedDate && (
                    <button className="clear-date-btn" onClick={handleClearDate} title="Очистить дату">
                        ×
                    </button>
                )}
            </div>

            {/* Навигация по месяцам (по центру) */}
            <div className="schedule-nav">
                <button onClick={onPrevMonth} className="nav-btn">
                    <ChevronLeft size={20} />
                </button>
                <span className="month-label">
                    {new Date(currentYear, currentMonth - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={onNextMonth} className="nav-btn">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Подсказка (справа) */}
            {canEdit && (
                <div className="shift-hint">
                    <Info size={16} />
                    <span>ЛКМ: выделение диапазона, ПКМ: быстрое меню, двойной клик: редактировать</span>
                </div>
            )}
        </div>
    );
};

export default ScheduleControls;