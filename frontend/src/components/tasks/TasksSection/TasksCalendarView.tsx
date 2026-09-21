// TasksCalendarView.tsx
import React, { useMemo } from 'react';
import { TaskCalendar } from './TaskCalendar';
import { TaskWeekView } from './TaskWeekView';
import { Task } from '../../../types/tasks';
import './styles/TasksCalendarView.css';

type CalendarViewMode = 'week' | 'month' | 'year';

interface HighlightedRange {
    start: Date;
    end: Date;
    category: Task['category'];
    taskId: string;
    stepId?: string;
}

interface TasksCalendarViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onTaskDelete?: (taskId: string) => void;
    onToggleStep?: (taskId: string, stepId: string, currentCompleted: boolean) => void;
    calendarState: {
        date: Date;
        view: CalendarViewMode;
    };
    onCalendarStateChange: (state: { date?: Date; view?: CalendarViewMode }) => void;
    /** Пользователь кликнул по конкретному дню в месячном виде */
    onDateSelect?: (date: Date) => void;
    highlightedRange?: HighlightedRange | null;
    onHighlightRange?: (range: HighlightedRange | null) => void;
    /** Диапазон выбранного периода из панели фильтров — визуальная подсветка */
    filterRange?: { start: Date; end: Date } | null;
}

export function TasksCalendarView({
    tasks,
    onTaskClick,
    onTaskDelete,
    onToggleStep,
    calendarState,
    onCalendarStateChange,
    onDateSelect,
    highlightedRange,
    onHighlightRange,
    filterRange,
}: TasksCalendarViewProps) {
    const { date: selectedDate, view } = calendarState;

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        tasks.forEach((task) => {
            task.steps.forEach((step) => {
                if (step.start_date) {
                    years.add(new Date(step.start_date).getFullYear());
                }
                if (step.end_date) {
                    years.add(new Date(step.end_date).getFullYear());
                }
            });
        });
        years.add(new Date().getFullYear());
        return Array.from(years).sort((a, b) => a - b);
    }, [tasks]);

    const handleYearClick = (year: number) => {
        onCalendarStateChange({
            date: new Date(year, 0, 1),
            view: 'year',
        });
    };

    const handleTodayClick = () => {
        const today = new Date();
        onCalendarStateChange({
            date: today,
            view: 'month',
        });
    };

    const isWeekView = view === 'week';

    return (
        <div className="tasks-calendar-view">
            <div className="tasks-calendar-mode-toggle">
                <button
                    className={`tasks-calendar-mode-btn ${view === 'week' ? 'tasks-calendar-mode-btn-active' : ''
                        }`}
                    onClick={() => onCalendarStateChange({ view: 'week' })}
                >
                    Неделя
                </button>
                <button
                    className={`tasks-calendar-mode-btn ${view === 'month' ? 'tasks-calendar-mode-btn-active' : ''
                        }`}
                    onClick={() => onCalendarStateChange({ view: 'month' })}
                >
                    Месяц
                </button>
                <button
                    className={`tasks-calendar-mode-btn ${view === 'year' ? 'tasks-calendar-mode-btn-active' : ''
                        }`}
                    onClick={() => onCalendarStateChange({ view: 'year' })}
                >
                    Год
                </button>
            </div>

            {!isWeekView && (
                <div className="tasks-calendar-years">
                    <button
                        className="tasks-calendar-year-today"
                        onClick={handleTodayClick}
                        title="Вернуться к текущему месяцу"
                    >
                        Сегодня
                    </button>
                    {availableYears.map((year) => (
                        <button
                            key={year}
                            className={`tasks-calendar-year ${view === 'year' && selectedDate.getFullYear() === year
                                    ? 'tasks-calendar-year-active'
                                    : ''
                                }`}
                            onClick={() => handleYearClick(year)}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            )}

            {isWeekView ? (
                <TaskWeekView
                    tasks={tasks}
                    selectedDate={selectedDate}
                    onDateChange={(date) => onCalendarStateChange({ date })}
                    onTaskEdit={onTaskClick}
                    onTaskDelete={onTaskDelete}
                    onToggleStep={onToggleStep}
                    highlightedRange={highlightedRange}
                    onHighlightRange={onHighlightRange}
                />
            ) : (
                <TaskCalendar
                    tasks={tasks}
                    onTaskClick={onTaskClick}
                    calendarState={{
                        date: selectedDate,
                        view: view === 'year' ? 'year' : 'month',
                    }}
                    onCalendarStateChange={onCalendarStateChange}
                    onDateSelect={onDateSelect}
                    highlightedRange={highlightedRange}
                    filterRange={filterRange}
                />
            )}
        </div>
    );
}