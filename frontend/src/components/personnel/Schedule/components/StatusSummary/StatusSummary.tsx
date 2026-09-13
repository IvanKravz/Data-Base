// components/StatusSummary/StatusSummary.tsx
import React, { useMemo } from 'react';
import { Employee, ScheduleEvent } from '../../../../../types';
import './StatusSummary.css';

interface StatusSummaryProps {
    employees: Employee[];
    events: ScheduleEvent[];
    selectedDate: Date | null;
    filterStatus: string | null;
    setFilterStatus: (status: string | null) => void;
    eventLabels: Record<string, string>;
    eventColors: Record<string, string>;
    currentYear: number;
    currentMonth: number;
}

// Приоритет статусов (меньше число = выше приоритет)
const STATUS_PRIORITY: Record<string, number> = {
    'vacation': 1,
    'sick': 2,
    'business_trip': 3,
    'duty': 4,
    'other': 5,
    // 'available' — самый низкий приоритет (обрабатывается отдельно)
};

const getPriority = (statusType: string): number => {
    return STATUS_PRIORITY[statusType] ?? 10;
};

const StatusSummary: React.FC<StatusSummaryProps> = ({
    employees,
    events,
    selectedDate,
    filterStatus,
    setFilterStatus,
    eventLabels,
    eventColors,
    currentYear,
    currentMonth,
}) => {
    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isDateMode = selectedDate !== null;
    const dateStr = selectedDate ? formatLocalDate(selectedDate) : '';

    const getEmployeeStatus = (employeeId: number): string | null => {
        if (isDateMode && selectedDate) {
            // Для конкретной даты – ищем событие на этот день
            const event = events.find(e => e.employee === employeeId && e.date === dateStr);
            return event ? event.event_type : null;
        } else {
            // Месячный режим – выбираем событие с наивысшим приоритетом
            const employeeEvents = events.filter(e => e.employee === employeeId);
            if (employeeEvents.length === 0) {
                return null; // нет событий – будет "available"
            }
            // Находим событие с минимальным приоритетом (наивысшим)
            let bestEvent = employeeEvents[0];
            let bestPriority = getPriority(bestEvent.event_type);
            for (let i = 1; i < employeeEvents.length; i++) {
                const event = employeeEvents[i];
                const priority = getPriority(event.event_type);
                if (priority < bestPriority) {
                    bestPriority = priority;
                    bestEvent = event;
                }
            }
            return bestEvent.event_type;
        }
    };

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        employees.forEach(emp => {
            const status = getEmployeeStatus(emp.id);
            const key = status || 'available';
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }, [employees, events, selectedDate, currentYear, currentMonth]);

    const handleStatusClick = (statusKey: string, isTotal: boolean = false) => {
        if (isTotal) {
            setFilterStatus(null);
            return;
        }
        const nextFilter = statusKey === 'available' ? 'available' : statusKey;
        setFilterStatus(prev => (prev === nextFilter ? null : nextFilter));
    };

    return (
        <div className="status-summary-container">
            <div className="status-cards">
                <button
                    className={`status-card total ${filterStatus === null ? 'active' : ''}`}
                    onClick={() => handleStatusClick('', true)}
                    title="Показать всех сотрудников"
                >
                    <span className="status-label">Всего</span>
                    <span className="status-count">{employees.length}</span>
                </button>
                {Object.entries(statusCounts).map(([key, count]) => {
                    const isAvailable = key === 'available';
                    const label = isAvailable ? 'В строю' : (eventLabels[key] || key);
                    const color = isAvailable ? '#10b981' : (eventColors[key] || '#ccc');
                    const isActive = filterStatus === (isAvailable ? 'available' : key);
                    return (
                        <button
                            key={key}
                            className={`status-card ${isActive ? 'active' : ''}`}
                            style={{ '--status-color': color } as React.CSSProperties}
                            onClick={() => handleStatusClick(key)}
                            title={isActive ? 'Сбросить фильтр' : 'Показать сотрудников'}
                        >
                            <span className="status-dot" />
                            <span className="status-label">{label}</span>
                            <span className="status-count">{count}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusSummary;