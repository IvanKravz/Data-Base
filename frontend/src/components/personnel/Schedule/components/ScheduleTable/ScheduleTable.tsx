// components/ScheduleTable/ScheduleTable.tsx
import React, { useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { Employee, ScheduleEvent } from '../../../types';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
    onDateHeaderClick?: (date: Date | null) => void;
    selectedDate?: Date | null;
    eventColors: Record<string, string>;
    eventLabels: Record<string, string>;
    eventShortLabels: Record<string, string>;
    viewMode: 'flat' | 'grouped';
    storageKey?: string;
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
    viewMode,
    storageKey = 'default',
}) => {
    const fullStorageKey = useMemo(
        () => `schedule_table_collapsed_${storageKey}_${viewMode}`,
        [storageKey, viewMode],
    );

    const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(new Set());
    const [collapsedSubdivisions, setCollapsedSubdivisions] = useState<Set<string>>(new Set());
    const [collapsedGlobalManagement, setCollapsedGlobalManagement] = useState<boolean>(true);
    const [collapsedDepartmentManagement, setCollapsedDepartmentManagement] = useState<Set<string>>(new Set());
    const [isInitialized, setIsInitialized] = useState(false);

    // Сортировка внутри группы (аналогично TableView)
    const sortEmployeesInGroup = (list: Employee[]): Employee[] => {
        return [...list].sort((a, b) => {
            if (a.category === 'management' && b.category !== 'management') return -1;
            if (a.category !== 'management' && b.category === 'management') return 1;
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.full_name.localeCompare(b.full_name);
        });
    };

    // Плоский список (глобальное руководство + отделы + отделения)
    const flatSortedEmployees = useMemo(() => {
        const globalManagement = employees.filter(p => p.category === 'management' && !p.division);
        const sortedGlobal = sortEmployeesInGroup(globalManagement);

        const divisionsMap = new Map<string, any>();
        employees.forEach(person => {
            if (!person.division) return;
            const divId = String(person.division.id);
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
                const subId = String(person.subdivision?.id || 'no-subdivision');
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
            (a, b) => (a.division.order || 9999) - (b.division.order || 9999),
        );

        const result: Employee[] = [...sortedGlobal];
        for (const div of sortedDivisions) {
            result.push(...sortEmployeesInGroup(div.managers));
            const sortedSubs = Array.from(div.subdivisions.values()).sort(
                (a, b) => (a.subdivision.order || 9999) - (b.subdivision.order || 9999),
            );
            for (const sub of sortedSubs) {
                result.push(...sortEmployeesInGroup(sub.employees));
            }
        }
        return result;
    }, [employees]);

    // === Группировка (как в TableView) ===
    const groupedData = useMemo(() => {
        if (viewMode !== 'grouped') return null;
        const result = employees.reduce(
            (acc, person) => {
                const isManagement = person.category === 'management';
                const hasDivision = !!person.division;
                if (isManagement && !hasDivision) {
                    if (!acc.globalManagement) acc.globalManagement = { employees: [] };
                    acc.globalManagement.employees.push(person);
                    return acc;
                }
                if (!hasDivision) return acc;
                const divisionId = String(person.division.id);
                const divisionName = person.division.name;
                const divisionOrder = person.division.order || 9999;
                if (!acc.divisions[divisionId]) {
                    acc.divisions[divisionId] = {
                        divisionName,
                        divisionOrder,
                        managers: [],
                        subdivisions: {},
                    };
                }
                const divisionEntry = acc.divisions[divisionId];
                if (isManagement && !person.subdivision) {
                    divisionEntry.managers.push(person);
                    return acc;
                }
                const subdivisionId = String(person.subdivision?.id || 'no-subdivision');
                const subdivisionName = person.subdivision?.name || 'Без отделения';
                const subdivisionOrder = person.subdivision?.order || 9999;
                if (!divisionEntry.subdivisions[subdivisionId]) {
                    divisionEntry.subdivisions[subdivisionId] = {
                        subdivisionName,
                        subdivisionOrder,
                        employees: [],
                    };
                }
                divisionEntry.subdivisions[subdivisionId].employees.push(person);
                return acc;
            },
            {
                globalManagement: null as { employees: Employee[] } | null,
                divisions: {} as Record<string, any>,
            },
        );

        if (result.globalManagement) {
            result.globalManagement.employees = sortEmployeesInGroup(result.globalManagement.employees);
        }
        const sortedDivisionIds = Object.keys(result.divisions).sort(
            (a, b) => result.divisions[a].divisionOrder - result.divisions[b].divisionOrder,
        );
        sortedDivisionIds.forEach((divisionId) => {
            const division = result.divisions[divisionId];
            division.managers = sortEmployeesInGroup(division.managers);
            const subdivisionIds = Object.keys(division.subdivisions);
            subdivisionIds.sort(
                (a, b) => division.subdivisions[a].subdivisionOrder - division.subdivisions[b].subdivisionOrder,
            );
            division.sortedSubdivisionIds = subdivisionIds;
            subdivisionIds.forEach((subId) => {
                division.subdivisions[subId].employees = sortEmployeesInGroup(division.subdivisions[subId].employees);
            });
        });

        return {
            globalManagement: result.globalManagement,
            divisions: result.divisions,
            sortedDivisionIds,
        };
    }, [employees, viewMode]);

    // Восстановление / дефолтная инициализация состояния свёрнутости
    useLayoutEffect(() => {
        if (viewMode !== 'grouped') return;
        if (isInitialized) return;
        if (!groupedData) return;

        const saved = sessionStorage.getItem(fullStorageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (typeof data.collapsedGlobalManagement === 'boolean')
                    setCollapsedGlobalManagement(data.collapsedGlobalManagement);
                if (Array.isArray(data.collapsedDepartmentManagement))
                    setCollapsedDepartmentManagement(new Set(data.collapsedDepartmentManagement));
                if (Array.isArray(data.collapsedDivisions))
                    setCollapsedDivisions(new Set(data.collapsedDivisions));
                if (Array.isArray(data.collapsedSubdivisions))
                    setCollapsedSubdivisions(new Set(data.collapsedSubdivisions));
                setIsInitialized(true);
                return;
            } catch (e) { /* ignore */ }
        }

        const allDivisionIds = Object.keys(groupedData.divisions);
        const allSubdivisionKeys = new Set<string>();
        Object.entries(groupedData.divisions).forEach(([divId, div]: [string, any]) => {
            if (div.sortedSubdivisionIds) {
                div.sortedSubdivisionIds.forEach((subId: string) => {
                    allSubdivisionKeys.add(`${divId}-${subId}`);
                });
            }
        });
        setCollapsedDivisions(new Set(allDivisionIds));
        setCollapsedSubdivisions(allSubdivisionKeys);
        setCollapsedDepartmentManagement(new Set(allDivisionIds));
        setCollapsedGlobalManagement(true);
        setIsInitialized(true);
    }, [groupedData, fullStorageKey, viewMode, isInitialized]);

    // Сохранение состояния свёрнутости
    useEffect(() => {
        if (viewMode !== 'grouped' || !isInitialized) return;
        const toSave = {
            collapsedGlobalManagement,
            collapsedDepartmentManagement: Array.from(collapsedDepartmentManagement),
            collapsedDivisions: Array.from(collapsedDivisions),
            collapsedSubdivisions: Array.from(collapsedSubdivisions),
        };
        sessionStorage.setItem(fullStorageKey, JSON.stringify(toSave));
    }, [
        collapsedGlobalManagement,
        collapsedDepartmentManagement,
        collapsedDivisions,
        collapsedSubdivisions,
        fullStorageKey,
        viewMode,
        isInitialized,
    ]);

    const toggleDivision = (divisionId: string) => {
        setCollapsedDivisions(prev => {
            const next = new Set(prev);
            if (next.has(divisionId)) next.delete(divisionId);
            else next.add(divisionId);
            return next;
        });
    };

    const toggleSubdivision = (divisionId: string, subdivisionId: string) => {
        const key = `${divisionId}-${subdivisionId}`;
        setCollapsedSubdivisions(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleGlobalManagement = () => setCollapsedGlobalManagement(prev => !prev);

    const toggleDepartmentManagement = (divisionId: string) => {
        setCollapsedDepartmentManagement(prev => {
            const next = new Set(prev);
            if (next.has(divisionId)) next.delete(divisionId);
            else next.add(divisionId);
            return next;
        });
    };

    const isSameDay = (date1: Date, date2: Date): boolean =>
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();

    const handleDateHeaderClick = (day: Date) => {
        if (!onDateHeaderClick) return;
        if (selectedDate && isSameDay(day, selectedDate)) {
            onDateHeaderClick(null);
        } else {
            onDateHeaderClick(day);
        }
    };

    const totalCols = 4 + days.length;

    // === Рендер одной строки сотрудника ===
    const renderEmployeeRow = (employee: Employee, idx: number, highlightManagement = false) => (
        <tr key={employee.id} className={highlightManagement ? 'schedule-management-row' : undefined}>
            <td className="employee-index">{idx}</td>
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
    );

    const renderTableHead = () => (
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
    );

    // === Плоский режим ===
    if (viewMode === 'flat') {
        return (
            <div className="schedule-table-wrapper" onMouseLeave={onTableMouseLeave}>
                <table className="schedule-table">
                    {renderTableHead()}
                    <tbody>
                        {flatSortedEmployees.map((employee, idx) =>
                            renderEmployeeRow(employee, idx + 1, employee.category === 'management'),
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    // === Группированный режим ===
    if (!isInitialized || !groupedData) return null;

    let rowIndex = 0;

    return (
        <div className="schedule-table-wrapper" onMouseLeave={onTableMouseLeave}>
            <table className="schedule-table schedule-table--grouped">
                {renderTableHead()}
                <tbody>
                    {/* Глобальное руководство */}
                    {groupedData.globalManagement && groupedData.globalManagement.employees.length > 0 && (
                        <>
                            <tr
                                className="schedule-division-header-row schedule-global-management-header"
                                onClick={toggleGlobalManagement}
                                style={{ cursor: 'pointer' }}
                            >
                                <td colSpan={totalCols} className="schedule-group-header-cell">
                                    <div className="schedule-group-header-content">
                                        <button
                                            type="button"
                                            className="schedule-collapse-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleGlobalManagement();
                                            }}
                                        >
                                            {collapsedGlobalManagement ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                        <span>Руководство (главный руководитель и заместители)</span>
                                        <span className="schedule-group-count">
                                            {' '}({groupedData.globalManagement.employees.length})
                                        </span>
                                    </div>
                                </td>
                            </tr>
                            {!collapsedGlobalManagement &&
                                groupedData.globalManagement.employees.map(p =>
                                    renderEmployeeRow(p, ++rowIndex, true),
                                )}
                        </>
                    )}

                    {/* Подразделения */}
                    {groupedData.sortedDivisionIds.map(divisionId => {
                        const division = groupedData.divisions[divisionId];
                        const isDivisionCollapsed = collapsedDivisions.has(divisionId);
                        const hasManagers = division.managers.length > 0;
                        const isDeptMgmtCollapsed = collapsedDepartmentManagement.has(divisionId);

                        const employeeCount =
                            division.managers.length +
                            Object.values(division.subdivisions).reduce(
                                (sum: number, sub: any) => sum + sub.employees.length,
                                0,
                            );

                        return (
                            <React.Fragment key={divisionId}>
                                <tr
                                    className="schedule-division-header-row"
                                    onClick={() => toggleDivision(divisionId)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td colSpan={totalCols} className="schedule-group-header-cell">
                                        <div className="schedule-group-header-content">
                                            <button
                                                type="button"
                                                className="schedule-collapse-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleDivision(divisionId);
                                                }}
                                            >
                                                {isDivisionCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            <span>{division.divisionName}</span>
                                            <span className="schedule-group-count"> ({employeeCount})</span>
                                        </div>
                                    </td>
                                </tr>
                                {!isDivisionCollapsed && (
                                    <>
                                        {hasManagers && (
                                            <>
                                                <tr
                                                    className="schedule-subdivision-header-row"
                                                    onClick={() => toggleDepartmentManagement(divisionId)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td colSpan={totalCols} className="schedule-subgroup-header-cell">
                                                        <div className="schedule-group-header-content">
                                                            <button
                                                                type="button"
                                                                className="schedule-collapse-button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleDepartmentManagement(divisionId);
                                                                }}
                                                            >
                                                                {isDeptMgmtCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                            </button>
                                                            <span>Руководство отдела</span>
                                                            <span className="schedule-group-count"> ({division.managers.length})</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {!isDeptMgmtCollapsed &&
                                                    division.managers.map((p: Employee) =>
                                                        renderEmployeeRow(p, ++rowIndex, true),
                                                    )}
                                            </>
                                        )}

                                        {division.sortedSubdivisionIds?.map((subId: string) => {
                                            const subdivision = division.subdivisions[subId];
                                            const subKey = `${divisionId}-${subId}`;
                                            const isSubCollapsed = collapsedSubdivisions.has(subKey);
                                            return (
                                                <React.Fragment key={subId}>
                                                    <tr
                                                        className="schedule-subdivision-header-row"
                                                        onClick={() => toggleSubdivision(divisionId, subId)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <td colSpan={totalCols} className="schedule-subgroup-header-cell">
                                                            <div className="schedule-group-header-content">
                                                                <button
                                                                    type="button"
                                                                    className="schedule-collapse-button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleSubdivision(divisionId, subId);
                                                                    }}
                                                                >
                                                                    {isSubCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                                </button>
                                                                <span>{subdivision.subdivisionName}</span>
                                                                <span className="schedule-group-count">
                                                                    {' '}({subdivision.employees.length})
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {!isSubCollapsed &&
                                                        subdivision.employees.map((p: Employee) =>
                                                            renderEmployeeRow(p, ++rowIndex, p.category === 'management'),
                                                        )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ScheduleTable;