// components/ScheduleTable/ScheduleTable.tsx
import React, { useMemo } from 'react';
import { Employee, ScheduleEvent } from '../../../types';
import './ScheduleTable.css';

interface ScheduleTableProps {
    employees: Employee[];
    days: Date[];
    getEventFor: (employeeId: number, date: Date) => ScheduleEvent | undefined;
    isInRange: (empId: number, date: Date) => boolean;
    canEdit: boolean;
    onCellClick: (employee: Employee, date: Date, e: React.MouseEvent) => void;
    onCellMouseEnter: (employee: Employee, date: Date) => void;
    onCellMouseLeave: () => void;
    onTableMouseLeave: () => void;
    onContextMenu: (e: React.MouseEvent, employee: Employee, date: Date) => void;
    // Теперь onDateHeaderClick может принимать null (для сброса)
    onDateHeaderClick?: (date: Date | null) => void;
    selectedDate?: Date | null;
    eventColors: Record<string, string>;
    eventLabels: Record<string, string>;
    eventShortLabels: Record<string, string>;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
    employees,
    days,
    getEventFor,
    isInRange,
    canEdit,
    onCellClick,
    onCellMouseEnter,
    onCellMouseLeave,
    onTableMouseLeave,
    onContextMenu,
    onDateHeaderClick,
    selectedDate,
    eventColors,
    eventLabels,
    eventShortLabels,
}) => {
    // Функция сортировки внутри группы (аналог из TableView)
    const sortEmployeesInGroup = (employees: Employee[]): Employee[] => {
        return [...employees].sort((a, b) => {
            if (a.category === 'management' && b.category !== 'management') return -1;
            if (a.category !== 'management' && b.category === 'management') return 1;
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.full_name.localeCompare(b.full_name);
        });
    };

    // Полная сортировка, повторяющая flatSortedData из TableView (без поиска)
    const sortedEmployees = useMemo(() => {
        const globalManagement = employees.filter(p => p.category === 'management' && !p.division);
        const sortedGlobal = sortEmployeesInGroup(globalManagement);

        const divisionsMap = new Map<string, any>();
        employees.forEach(person => {
            if (!person.division) return;
            const divId = person.division.id;
            if (!divisionsMap.has(divId)) {
                divisionsMap.set(divId, {
                    division: person.division,
                    managers: [],
                    subdivisions: new Map(),
                });
            }
            const divEntry = divisionsMap.get(divId)!;
            if (person.category === 'management' && !person.subdivision) {
                divEntry.managers.push(person);
            } else {
                const subId = person.subdivision?.id || 'no-subdivision';
                if (!divEntry.subdivisions.has(subId)) {
                    divEntry.subdivisions.set(subId, {
                        subdivision: person.subdivision || { id: 'no-subdivision', name: 'Без отделения', order: 9999 },
                        employees: [],
                    });
                }
                divEntry.subdivisions.get(subId)!.employees.push(person);
            }
        });

        const sortedDivisions = Array.from(divisionsMap.values()).sort(
            (a, b) => (a.division.order || 9999) - (b.division.order || 9999)
        );

        const result: Employee[] = [...sortedGlobal];
        for (const div of sortedDivisions) {
            result.push(...sortEmployeesInGroup(div.managers));
            const sortedSubs = Array.from(div.subdivisions.values()).sort(
                (a, b) => (a.subdivision.order || 9999) - (b.subdivision.order || 9999)
            );
            for (const sub of sortedSubs) {
                result.push(...sortEmployeesInGroup(sub.employees));
            }
        }
        return result;
    }, [employees]);

    // Проверка совпадения дат
    const isSameDay = (date1: Date, date2: Date): boolean => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    };

    // Обработчик клика по заголовку дня – сбрасывает фильтр, если дата уже выбрана
    const handleDateHeaderClick = (day: Date) => {
        if (!onDateHeaderClick) return;
        if (selectedDate && isSameDay(day, selectedDate)) {
            onDateHeaderClick(null); // Снимаем выделение
        } else {
            onDateHeaderClick(day);  // Выбираем новую дату
        }
    };

    return (
        <div className="schedule-table-wrapper" onMouseLeave={onTableMouseLeave}>
            <table className="schedule-table">
                <thead>
                    <tr>
                        <th className="index-col">№ п/п</th>
                        <th className="position-col">Должность</th>
                        <th className="rank-col">Звание</th>
                        <th className="employee-col">ФИО</th>
                        {days.map(day => {
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            return (
                                <th
                                    key={day.toISOString()}
                                    className={`day-header ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleDateHeaderClick(day)}
                                    style={{ cursor: onDateHeaderClick ? 'pointer' : 'default' }}
                                >
                                    <span className="day-number">{day.getDate()}</span>
                                    <span className="day-weekday">{day.toLocaleString('ru', { weekday: 'short' })}</span>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sortedEmployees.map((employee, idx) => (
                        <tr key={employee.id}>
                            <td className="employee-index">{idx + 1}</td>
                            <td className="employee-position">{employee.position || ''}</td>
                            <td className="employee-rank">{employee.rank || ''}</td>
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
                                        onClick={(e) => onCellClick(employee, day, e)}
                                        onContextMenu={(e) => onContextMenu(e, employee, day)}
                                        onMouseEnter={() => onCellMouseEnter(employee, day)}
                                        onMouseLeave={onCellMouseLeave}
                                        title={fullLabel || ''}
                                    >
                                        {event && <span className="event-label">{shortLabel}</span>}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ScheduleTable;