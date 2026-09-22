// components/EmployeeSchedule/EmployeeSchedule.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, ScheduleEvent } from '../../../../types';
import { employeesApi } from '../../../../api';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/EmployeeSchedule.css';
import ScheduleModal from '../../Schedule/components/ScheduleModal/ScheduleModal';
import ScheduleContextMenu from '../../Schedule/components/ScheduleContextMenu/ScheduleContextMenu';
import { EVENT_PRIORITY } from '../../config/scheduleEvents';

interface EmployeeScheduleProps {
    employee: Employee;
    token: string;
    eventColors: Record<string, string>;
    eventLabels: Record<string, string>;
    eventShortLabels: Record<string, string>;
    canEdit?: boolean;
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    employeeId: number;
    date: Date;
}

interface BulkRange {
    type: 'dates';
    employeeId?: number;
    startDate?: Date;
    endDate?: Date;
}

const EmployeeSchedule: React.FC<EmployeeScheduleProps> = ({
    employee,
    token,
    eventColors,
    eventLabels,
    eventShortLabels,
    canEdit = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);

    const [rangeStart, setRangeStart] = useState<{ employeeId: number; date: Date } | null>(null);
    const [hoverTarget, setHoverTarget] = useState<{ employeeId: number; date: Date } | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null);
    const [selectedEventType, setSelectedEventType] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [existingEvent, setExistingEvent] = useState<ScheduleEvent | null>(null);
    const [bulkRange, setBulkRange] = useState<BulkRange | null>(null);

    const days = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth - 1, 1);
        const lastDay = new Date(currentYear, currentMonth, 0);
        const daysArray: Date[] = [];
        for (let d = 1; d <= lastDay.getDate(); d++) {
            daysArray.push(new Date(currentYear, currentMonth - 1, d));
        }
        return daysArray;
    }, [currentYear, currentMonth]);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const data = await employeesApi.getScheduleEvents(token, {
                    year: currentYear,
                    month: currentMonth,
                });
                const employeeEvents = data.filter(e => e.employee === employee.id);
                setEvents(employeeEvents);
            } catch (err) {
                console.error('Ошибка загрузки событий:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [token, currentYear, currentMonth, employee.id]);

    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getEventFor = (employeeId: number, date: Date): ScheduleEvent | undefined => {
        const dateStr = formatLocalDate(date);
        return events.find(e => e.employee === employeeId && e.date === dateStr);
    };

    const hasEventsInRange = useMemo(() => {
        if (!bulkRange || bulkRange.type !== 'dates') return false;
        if (bulkRange.employeeId && bulkRange.startDate && bulkRange.endDate) {
            const start = new Date(bulkRange.startDate);
            const end = new Date(bulkRange.endDate);
            const cur = new Date(start);
            while (cur <= end) {
                if (getEventFor(bulkRange.employeeId, cur)) return true;
                cur.setDate(cur.getDate() + 1);
            }
        }
        return false;
    }, [bulkRange, events, currentYear, currentMonth]);

    const prevMonth = () => {
        if (currentMonth === 1) { setCurrentYear(prev => prev - 1); setCurrentMonth(12); }
        else { setCurrentMonth(prev => prev - 1); }
        setSelectedDate(null);
        setRangeStart(null);
        setHoverTarget(null);
        setBulkRange(null);
        closeContextMenu();
    };

    const nextMonth = () => {
        if (currentMonth === 12) { setCurrentYear(prev => prev + 1); setCurrentMonth(1); }
        else { setCurrentMonth(prev => prev + 1); }
        setSelectedDate(null);
        setRangeStart(null);
        setHoverTarget(null);
        setBulkRange(null);
        closeContextMenu();
    };

    const handleDateHeaderClick = (day: Date) => {
        if (selectedDate && selectedDate.getTime() === day.getTime()) {
            setSelectedDate(null);
        } else {
            setSelectedDate(day);
        }
    };

    const toggleExpand = () => setIsExpanded(prev => !prev);

    const isInRange = (empId: number, date: Date): boolean => {
        if (!rangeStart || rangeStart.employeeId !== empId) return false;
        if (!hoverTarget || hoverTarget.employeeId !== empId) {
            return rangeStart.date.toDateString() === date.toDateString();
        }
        const startTime = rangeStart.date.getTime();
        const targetTime = hoverTarget.date.getTime();
        const currentTime = date.getTime();
        const minTime = Math.min(startTime, targetTime);
        const maxTime = Math.max(startTime, targetTime);
        return currentTime >= minTime && currentTime <= maxTime;
    };

    const openSingleModal = (emp: Employee, date: Date) => {
        setRangeStart(null);
        setHoverTarget(null);
        setBulkRange(null);
        setSelectedEmployee(emp);
        setSelectedEventDate(date);
        const existing = getEventFor(emp.id, date);
        if (existing) {
            setExistingEvent(existing);
            setSelectedEventType(existing.event_type);
            setComment(existing.comment || '');
        } else {
            setExistingEvent(null);
            setSelectedEventType('');
            setComment('');
        }
        setModalOpen(true);
    };

    const handleCellClick = (employee: Employee, date: Date, e: React.MouseEvent) => {
        if (!canEdit) return;
        if (contextMenu) setContextMenu(null);

        if (e.detail === 2) {
            setRangeStart(null);
            setHoverTarget(null);
            openSingleModal(employee, date);
            return;
        }

        if (rangeStart) {
            const sameEmployee = rangeStart.employeeId === employee.id;
            if (sameEmployee) {
                const minDate = rangeStart.date < date ? rangeStart.date : date;
                const maxDate = rangeStart.date < date ? date : rangeStart.date;
                setSelectedEmployee(employee);
                setSelectedEventDate(date);
                setExistingEvent(null);
                setSelectedEventType('');
                setComment('');
                setRangeStart(null);
                setHoverTarget(null);
                setBulkRange({
                    type: 'dates',
                    employeeId: employee.id,
                    startDate: minDate,
                    endDate: maxDate,
                });
                setModalOpen(true);
            } else {
                // Так как всегда один сотрудник, этот случай маловероятен, но сбрасываем
                setRangeStart({ employeeId: employee.id, date: date });
                setHoverTarget(null);
            }
        } else {
            setRangeStart({ employeeId: employee.id, date: date });
            setHoverTarget(null);
        }
    };

    const handleCellMouseEnter = (employee: Employee, date: Date) => {
        if (rangeStart && rangeStart.employeeId === employee.id) {
            setHoverTarget({ employeeId: employee.id, date: date });
        } else {
            setHoverTarget(null);
        }
    };

    const handleCellMouseLeave = () => { };

    const handleTableMouseLeave = () => { };

    const handleContextMenu = (e: React.MouseEvent, employee: Employee, date: Date) => {
        e.preventDefault();
        if (!canEdit) return;
        if (contextMenu) setContextMenu(null);
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            employeeId: employee.id,
            date: date,
        });
    };

    const closeContextMenu = () => setContextMenu(null);

    const handleContextMenuAction = async (action: 'clear' | string) => {
        if (!contextMenu) return;
        const { employeeId, date } = contextMenu;
        const emp = employee;

        let targetEmployeeIds: number[] = [];
        let targetDates: Date[] = [];

        if (rangeStart && hoverTarget && rangeStart.employeeId === hoverTarget.employeeId) {
            const minDate = rangeStart.date < hoverTarget.date ? rangeStart.date : hoverTarget.date;
            const maxDate = rangeStart.date < hoverTarget.date ? hoverTarget.date : rangeStart.date;
            const cur = new Date(minDate);
            while (cur <= maxDate) {
                targetDates.push(new Date(cur));
                cur.setDate(cur.getDate() + 1);
            }
            targetEmployeeIds = [rangeStart.employeeId];
        }

        if (targetEmployeeIds.length === 0) {
            targetEmployeeIds = [employeeId];
            targetDates = [date];
        }

        const isClear = action === 'clear';
        const eventType = isClear ? '' : action;

        try {
            const promises: Promise<any>[] = [];
            for (const empId of targetEmployeeIds) {
                for (const d of targetDates) {
                    const dateStr = formatLocalDate(d);
                    const existing = getEventFor(empId, d);
                    if (isClear) {
                        if (existing) {
                            promises.push(employeesApi.deleteScheduleEvent(token, existing.id!));
                        }
                    } else {
                        if (existing) {
                            promises.push(employeesApi.updateScheduleEvent(token, existing.id!, {
                                event_type: eventType,
                                comment: existing.comment || '',
                            }));
                        } else {
                            promises.push(employeesApi.createScheduleEvent(token, {
                                employee: empId,
                                date: dateStr,
                                event_type: eventType,
                                comment: '',
                            }));
                        }
                    }
                }
            }
            await Promise.all(promises);
            await refreshEvents();
            closeContextMenu();
            setRangeStart(null);
            setHoverTarget(null);
        } catch (error) {
            console.error('Failed to apply context menu action', error);
            alert('Ошибка при применении действия');
        }
    };

    const handleClearRange = async () => {
        if (!bulkRange || bulkRange.type !== 'dates') return;

        const eventsToDelete: ScheduleEvent[] = [];
        const { employeeId, startDate, endDate } = bulkRange;
        if (employeeId && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const cur = new Date(start);
            while (cur <= end) {
                const event = getEventFor(employeeId, cur);
                if (event) eventsToDelete.push(event);
                cur.setDate(cur.getDate() + 1);
            }
        }

        if (eventsToDelete.length === 0) {
            alert('В выбранном диапазоне нет событий для удаления.');
            return;
        }

        if (!window.confirm(`Вы уверены, что хотите удалить ${eventsToDelete.length} событий?`)) return;

        try {
            const promises = eventsToDelete.map(event =>
                employeesApi.deleteScheduleEvent(token, event.id!)
            );
            await Promise.all(promises);
            await refreshEvents();
            closeModal();
        } catch (error) {
            console.error('Ошибка при очистке диапазона:', error);
            alert('Не удалось удалить события.');
        }
    };

    const handleSaveEvent = async () => {
        if (bulkRange) {
            try {
                if (bulkRange.type === 'dates' && bulkRange.employeeId && bulkRange.startDate && bulkRange.endDate) {
                    const startStr = formatLocalDate(bulkRange.startDate);
                    const endStr = formatLocalDate(bulkRange.endDate);
                    await employeesApi.bulkUpdateScheduleEvents(token, {
                        employee_ids: [bulkRange.employeeId],
                        start_date: startStr,
                        end_date: endStr,
                        event_type: selectedEventType,
                        comment: comment || undefined,
                    });
                }
                await refreshEvents();
                setModalOpen(false);
                setBulkRange(null);
            } catch (error) {
                console.error('Failed to save bulk events', error);
                alert('Ошибка при сохранении массовых событий');
            }
            return;
        }

        if (!selectedEmployee || !selectedEventDate) return;
        const dateStr = formatLocalDate(selectedEventDate);

        try {
            if (existingEvent) {
                await employeesApi.updateScheduleEvent(token, existingEvent.id!, {
                    event_type: selectedEventType,
                    comment,
                });
            } else {
                await employeesApi.createScheduleEvent(token, {
                    employee: selectedEmployee.id,
                    date: dateStr,
                    event_type: selectedEventType,
                    comment,
                });
            }
            await refreshEvents();
            setModalOpen(false);
        } catch (error) {
            console.error('Failed to save event', error);
        }
    };

    const handleDeleteEvent = async () => {
        if (!existingEvent) return;
        try {
            await employeesApi.deleteScheduleEvent(token, existingEvent.id!);
            await refreshEvents();
            setModalOpen(false);
        } catch (error) {
            console.error('Failed to delete event', error);
        }
    };

    const refreshEvents = async () => {
        try {
            const data = await employeesApi.getScheduleEvents(token, {
                year: currentYear,
                month: currentMonth,
            });
            const employeeEvents = data.filter(e => e.employee === employee.id);
            setEvents(employeeEvents);
        } catch (error) {
            console.error('Failed to refresh events', error);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setBulkRange(null);
        setRangeStart(null);
        setHoverTarget(null);
    };

    const getBulkCount = (): number | null => {
        if (!bulkRange || bulkRange.type !== 'dates') return null;
        if (bulkRange.startDate && bulkRange.endDate) {
            const diff = Math.abs(bulkRange.endDate.getTime() - bulkRange.startDate.getTime());
            return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
        }
        return null;
    };
    const bulkCount = getBulkCount();

    if (loading) {
        return <div className="employee-schedule-loading">Загрузка графика...</div>;
    }

    return (
        <div className="employee-schedule-container" onClick={closeContextMenu}>
            <div className="employee-schedule-header" onClick={toggleExpand}>
                <div className="employee-schedule-title">
                    <Calendar size={20} className="schedule-icon" />
                    <span>График работы</span>
                </div>
                <div className="employee-schedule-toggle">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            <div className={`employee-schedule-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="employee-schedule-inner">
                    <div className="employee-schedule-controls">
                        <div className="employee-schedule-spacer"></div>
                        <div className="employee-schedule-nav" onClick={(e) => e.stopPropagation()}>
                            <button onClick={prevMonth} className="nav-btn">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="month-label">
                                {new Date(currentYear, currentMonth - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={nextMonth} className="nav-btn">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <div className="employee-schedule-date-picker" onClick={(e) => e.stopPropagation()}>
                            {selectedDate ? (
                                <>
                                    <span className="date-display">
                                        {selectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <button className="clear-date-btn" onClick={() => setSelectedDate(null)} title="Очистить дату">
                                        ×
                                    </button>
                                </>
                            ) : (
                                <span className="date-placeholder">Выберите день</span>
                            )}
                        </div>
                    </div>

                    {selectedDate && (
                        <div className="employee-selected-status">
                            <div className="selected-status-info">
                                {(() => {
                                    const event = getEventFor(employee.id, selectedDate);
                                    if (event) {
                                        const color = eventColors[event.event_type] || '#ccc';
                                        const label = eventLabels[event.event_type] || event.event_type;
                                        return (
                                            <div className="status-card static" style={{ '--status-color': color } as React.CSSProperties}>
                                                <span className="status-dot" />
                                                <span className="status-label">{label}</span>
                                                {event.comment && <span className="event-comment"> — {event.comment}</span>}
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="status-card static" style={{ '--status-color': '#10b981' } as React.CSSProperties}>
                                                <span className="status-dot" />
                                                <span className="status-label">В строю</span>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    )}

                    <div className="employee-schedule-table-wrapper" key={`${currentYear}-${currentMonth}`}>
                        <div className="fade-in">
                            <table className="employee-schedule-table">
                                <thead>
                                    <tr>
                                        <th className="index-col">№</th>
                                        <th className="employee-col">Сотрудник</th>
                                        {days.map(day => {
                                            const isSelected = selectedDate && day.getTime() === selectedDate.getTime();
                                            return (
                                                <th
                                                    key={day.toISOString()}
                                                    className={`day-header ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleDateHeaderClick(day)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <span className="day-number">{day.getDate()}</span>
                                                    <span className="day-weekday">{day.toLocaleString('ru', { weekday: 'short' })}</span>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="index">1</td>
                                        <td className="employee-name">{employee.full_name}</td>
                                        {days.map(day => {
                                            const event = getEventFor(employee.id, day);
                                            const color = event ? eventColors[event.event_type] : 'transparent';
                                            const shortLabel = event ? eventShortLabels[event.event_type] : '';
                                            const fullLabel = event ? eventLabels[event.event_type] : '';
                                            const inRange = isInRange(employee.id, day);
                                            const rangeClass = inRange ? 'range-in-range' : '';
                                            return (
                                                <td
                                                    key={day.toISOString()}
                                                    className={`schedule-cell ${rangeClass}`}
                                                    style={{ backgroundColor: color }}
                                                    onClick={(e) => handleCellClick(employee, day, e)}
                                                    onContextMenu={(e) => handleContextMenu(e, employee, day)}
                                                    onMouseEnter={() => handleCellMouseEnter(employee, day)}
                                                    onMouseLeave={handleCellMouseLeave}
                                                    title={fullLabel || ''}
                                                >
                                                    {event && <span className="event-label">{shortLabel}</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <ScheduleModal
                modalOpen={modalOpen}
                closeModal={closeModal}
                selectedEmployee={selectedEmployee}
                selectedDate={selectedEventDate}
                selectedEventType={selectedEventType}
                setSelectedEventType={setSelectedEventType}
                comment={comment}
                setComment={setComment}
                existingEvent={existingEvent}
                bulkRange={bulkRange}
                bulkCount={bulkCount}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                onClearRange={handleClearRange}
                hasEventsInRange={hasEventsInRange}
                eventLabels={eventLabels}
            />
            <ScheduleContextMenu
                contextMenu={contextMenu}
                closeContextMenu={closeContextMenu}
                getEventFor={getEventFor}
                eventLabels={eventLabels}
                eventColors={eventColors}
                onAction={handleContextMenuAction}
            />
        </div>
    );
};

export default EmployeeSchedule;