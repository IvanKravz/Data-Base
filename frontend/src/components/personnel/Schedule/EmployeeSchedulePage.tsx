// components/EmployeeSchedulePage/EmployeeSchedulePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { employeesApi } from '../../../api/employees';
import { divisionsApi } from '../../../api';
import { Employee, ScheduleEvent } from '../../../types';
import { useAppPermissions } from '../../../api/utils/AppPermissionsContext';
import ScheduleHeader from './components/ScheduleHeader/ScheduleHeader';
import ScheduleControls from './components/ScheduleControls/ScheduleControls';
import ScheduleTable from './components/ScheduleTable/ScheduleTable';
import ScheduleModal from './components/ScheduleModal/ScheduleModal';
import ScheduleContextMenu from './components/ScheduleContextMenu/ScheduleContextMenu';
import ScheduleLoading from './components/ScheduleLoading/ScheduleLoading';
import StatusSummary from './components/StatusSummary/StatusSummary';
import { EVENT_COLORS, EVENT_LABELS, EVENT_SHORT_LABELS } from '../config/scheduleEvents';
import './EmployeeSchedule.css';

const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month - 1, 1);
  const days: Date[] = [];
  while (date.getMonth() === month - 1) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

interface BulkRange {
  type: 'dates';
  employeeId?: number;
  startDate?: Date;
  endDate?: Date;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  employeeId: number;
  date: Date;
}

interface ScheduleLocationState {
  divisionName?: string;
  subdivisionName?: string;
  fromDivisionPage?: boolean;
}

export function EmployeeSchedulePage() {
  const token = localStorage.getItem('accessToken');
  const { canAccessPage, getCurrentUser } = useAppPermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const canEdit = canAccessPage('ScheduleEvent', 'change');

  const locationState = (location.state as ScheduleLocationState | null) ?? null;
  const fromDivisionPage = locationState?.fromDivisionPage === true;

  const divisionIdFromUrl = searchParams.get('division');
  const subdivisionIdFromUrl = searchParams.get('subdivision');
  const divisionIdNum = divisionIdFromUrl ? Number(divisionIdFromUrl) : undefined;
  const subdivisionIdNum = subdivisionIdFromUrl ? Number(subdivisionIdFromUrl) : undefined;

  // === Названия подразделения и отделения (из URL) ===
  const [divisionName, setDivisionName] = useState<string | null>(null);
  const [subdivisionName, setSubdivisionName] = useState<string | null>(null);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [existingEvent, setExistingEvent] = useState<ScheduleEvent | null>(null);

  const [rangeStart, setRangeStart] = useState<{ employeeId: number; date: Date } | null>(null);
  const [hoverTarget, setHoverTarget] = useState<{ employeeId: number; date: Date } | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [bulkRange, setBulkRange] = useState<BulkRange | null>(null);

  const [selectedReportDate, setSelectedReportDate] = useState<Date | null>(new Date());
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // === Режим отображения таблицы (Список / По подразделениям) ===
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>(() => {
    const saved = localStorage.getItem('schedule_view_mode');
    return saved === 'flat' || saved === 'grouped' ? saved : 'flat';
  });

  const handleViewModeChange = (mode: 'flat' | 'grouped') => {
    setViewMode(mode);
    localStorage.setItem('schedule_view_mode', mode);
  };

  // === Названия подразделения и отделения (по API, если пришли не с карточки) ===
  useEffect(() => {
    if (!divisionIdFromUrl) {
      setDivisionName(null);
      setSubdivisionName(null);
      return;
    }

    const stateDivName = locationState?.divisionName ?? null;
    const stateSubName = locationState?.subdivisionName ?? null;

    if (stateDivName) setDivisionName(stateDivName);
    if (stateSubName) setSubdivisionName(stateSubName);

    const needsDivision = !stateDivName;
    const needsSubdivision = !!subdivisionIdFromUrl && !stateSubName;

    if (!needsDivision && !needsSubdivision) return;

    let cancelled = false;
    if (needsDivision) setDivisionName(null);
    if (needsSubdivision) setSubdivisionName(null);

    (async () => {
      try {
        const div = await divisionsApi.getDivisionById(divisionIdFromUrl, token);
        if (cancelled) return;
        if (needsDivision) setDivisionName(div?.name ?? null);

        if (needsSubdivision && subdivisionIdFromUrl && div?.subdivisions) {
          const sub = div.subdivisions.find(
            (s: any) => String(s.id) === String(subdivisionIdFromUrl),
          );
          if (!cancelled) setSubdivisionName(sub?.name ?? null);
        }
      } catch (err) {
        console.error('Не удалось получить данные подразделения/отделения', err);
        if (cancelled) return;
        if (needsDivision) setDivisionName(null);
        if (needsSubdivision) setSubdivisionName(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionIdFromUrl, subdivisionIdFromUrl, token]);

  const employeesFilteredByDivision = useMemo(() => {
    let base = employees;
    if (divisionIdNum) base = base.filter((e) => Number(e.division?.id) === divisionIdNum);
    if (subdivisionIdNum) base = base.filter((e) => Number(e.subdivision?.id) === subdivisionIdNum);
    return base;
  }, [employees, divisionIdNum, subdivisionIdNum]);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const data = await employeesApi.getScheduleEmployees(token, {
          division: divisionIdNum,
          subdivision: subdivisionIdNum,
        });
        setEmployees(data);
      } catch (error) {
        console.error('Failed to load employees for schedule', error);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [token, divisionIdNum, subdivisionIdNum]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentYear || !currentMonth) return;
      setLoadingEvents(true);
      try {
        const data = await employeesApi.getScheduleEvents(token, {
          year: currentYear,
          month: currentMonth,
          division: divisionIdNum,
          subdivision: subdivisionIdNum,
        });
        setEvents(data);
      } catch (error) {
        console.error('Failed to load events', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [currentYear, currentMonth, token, divisionIdNum, subdivisionIdNum]);

  useEffect(() => {
    const today = new Date();
    if (today.getFullYear() === currentYear && today.getMonth() === currentMonth - 1) {
      setSelectedReportDate(today);
    } else {
      setSelectedReportDate(new Date(currentYear, currentMonth - 1, 1));
    }
  }, [currentYear, currentMonth]);

  const days = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEventFor = (employeeId: number, date: Date): ScheduleEvent | undefined => {
    const dateStr = formatLocalDate(date);
    return events.find((e) => e.employee === employeeId && e.date === dateStr);
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

  const filteredEmployees = useMemo(() => {
    const base = employeesFilteredByDivision;
    if (filterStatus === null) return base;

    return base.filter((emp) => {
      if (selectedReportDate) {
        const event = getEventFor(emp.id, selectedReportDate);
        if (filterStatus === 'available') return !event;
        return event?.event_type === filterStatus;
      } else {
        if (filterStatus === 'available') return !events.some((e) => e.employee === emp.id);
        return events.some((e) => e.employee === emp.id && e.event_type === filterStatus);
      }
    });
  }, [employeesFilteredByDivision, events, filterStatus, selectedReportDate, currentYear, currentMonth]);

  const isInRange = (empId: number, date: Date): boolean => {
    if (!rangeStart) return false;
    if (rangeStart.employeeId !== empId) return false;

    if (!hoverTarget) {
      return rangeStart.date.toDateString() === date.toDateString();
    }
    if (rangeStart.employeeId !== hoverTarget.employeeId) return false;

    const startTime = rangeStart.date.getTime();
    const targetTime = hoverTarget.date.getTime();
    const currentTime = date.getTime();
    const minTime = Math.min(startTime, targetTime);
    const maxTime = Math.max(startTime, targetTime);
    return currentTime >= minTime && currentTime <= maxTime;
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
      const start = rangeStart;
      const sameEmployee = start.employeeId === employee.id;

      if (sameEmployee) {
        const minDate = start.date < date ? start.date : date;
        const maxDate = start.date < date ? date : start.date;

        setSelectedEmployee(employee);
        setSelectedDate(date);
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
        setRangeStart({ employeeId: employee.id, date });
        setHoverTarget(null);
      }
    } else {
      setRangeStart({ employeeId: employee.id, date });
      setHoverTarget(null);
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
      await Promise.all(
        eventsToDelete.map((event) => employeesApi.deleteScheduleEvent(token, event.id!)),
      );
      await refreshEvents();
      closeModal();
    } catch (error) {
      console.error('Ошибка при очистке диапазона:', error);
      alert('Не удалось удалить события.');
    }
  };

  const openSingleModal = (employee: Employee, date: Date) => {
    setRangeStart(null);
    setHoverTarget(null);
    setBulkRange(null);
    setSelectedEmployee(employee);
    setSelectedDate(date);
    const existing = getEventFor(employee.id, date);
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

  const handleCellMouseEnter = (employee: Employee, date: Date) => {
    if (rangeStart && rangeStart.employeeId === employee.id) {
      setHoverTarget({ employeeId: employee.id, date });
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
      date,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleContextMenuAction = async (action: 'clear' | string) => {
    if (!contextMenu) return;
    const { employeeId, date } = contextMenu;
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    let targetEmployeeIds: number[] = [];
    let targetDates: Date[] = [];

    if (rangeStart && hoverTarget) {
      if (rangeStart.employeeId === hoverTarget.employeeId) {
        const minDate = rangeStart.date < hoverTarget.date ? rangeStart.date : hoverTarget.date;
        const maxDate = rangeStart.date < hoverTarget.date ? hoverTarget.date : rangeStart.date;
        const cur = new Date(minDate);
        while (cur <= maxDate) {
          targetDates.push(new Date(cur));
          cur.setDate(cur.getDate() + 1);
        }
        targetEmployeeIds = [rangeStart.employeeId];
      }
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
            if (existing) promises.push(employeesApi.deleteScheduleEvent(token, existing.id!));
          } else {
            if (existing) {
              promises.push(
                employeesApi.updateScheduleEvent(token, existing.id!, {
                  event_type: eventType,
                  comment: existing.comment || '',
                }),
              );
            } else {
              promises.push(
                employeesApi.createScheduleEvent(token, {
                  employee: empId,
                  date: dateStr,
                  event_type: eventType,
                  comment: '',
                }),
              );
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

    if (!selectedEmployee || !selectedDate) return;
    const dateStr = formatLocalDate(selectedDate);

    try {
      if (existingEvent) {
        await employeesApi.updateScheduleEvent(token, existingEvent.id!, {
          event_type: selectedEventType,
          comment,
        });
        setEvents((prev) =>
          prev.map((e) =>
            e.id === existingEvent.id
              ? { ...e, event_type: selectedEventType, comment }
              : e,
          ),
        );
      } else {
        const newEvent = await employeesApi.createScheduleEvent(token, {
          employee: selectedEmployee.id,
          date: dateStr,
          event_type: selectedEventType,
          comment,
        });
        setEvents((prev) => [...prev, newEvent]);
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save event', error);
    }
  };

  const refreshEvents = async () => {
    try {
      const data = await employeesApi.getScheduleEvents(token, {
        year: currentYear,
        month: currentMonth,
        division: divisionIdNum,
        subdivision: subdivisionIdNum,
      });
      setEvents(data);
    } catch (error) {
      console.error('Failed to refresh events', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!existingEvent) return;
    try {
      await employeesApi.deleteScheduleEvent(token, existingEvent.id!);
      setEvents((prev) => prev.filter((e) => e.id !== existingEvent.id));
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setBulkRange(null);
    setRangeStart(null);
    setHoverTarget(null);
  };

  const prevMonth = () => {
    setRangeStart(null);
    setHoverTarget(null);
    setBulkRange(null);
    closeContextMenu();
    if (currentMonth === 1) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    setRangeStart(null);
    setHoverTarget(null);
    setBulkRange(null);
    closeContextMenu();
    if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
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

  const handleBack = () => {
    if (divisionIdFromUrl) {
      navigate(`/divisions/${divisionIdFromUrl}`);
      return;
    }
    navigate(-1);
  };

  // === Подзаголовок шапки ===
  // Приоритет:
  //  1) URL содержит division → «Подразделение [· Отделение]».
  //     Отделение берём по порядку:
  //       a) из URL, если оно там есть;
  //       b) иначе из фактического списка сотрудников, если все из одного отделения;
  //       c) иначе из данных пользователя, если его подразделение совпадает с URL.
  //  2) URL без division → подразделение/отделение пользователя или «Все подразделения».
  const headerSubtitle = useMemo(() => {
    // ----- Случай 1: URL содержит division -----
    if (divisionIdFromUrl) {
      const parts: string[] = [];
      parts.push(divisionName ?? 'Загрузка...');

      let subLabel: string | null = null;

      if (subdivisionIdFromUrl) {
        // (a) Отделение явно в URL
        subLabel = subdivisionName ?? 'Загрузка...';
      } else if (!loadingEmployees && employees.length > 0) {
        // (b) Вычисляем по фактическому списку сотрудников
        const subIds = new Set<number>();
        let firstSubName: string | null = null;
        for (const emp of employees) {
          if (emp.subdivision?.id != null) {
            subIds.add(Number(emp.subdivision.id));
            if (!firstSubName && emp.subdivision.name) {
              firstSubName = emp.subdivision.name;
            }
          }
        }
        if (subIds.size === 1 && firstSubName) {
          subLabel = firstSubName;
        }
      } else if (!loadingEmployees && employees.length === 0) {
        // (c) Список пуст → fallback на отделение пользователя,
        //      если его подразделение совпадает с открытым
        const currentUser = getCurrentUser();
        const uDivId = currentUser?.division_info?.id;
        const uSubName: string | null =
          currentUser?.division_info?.subdivision?.name ?? null;

        if (String(uDivId) === String(divisionIdFromUrl) && uSubName) {
          subLabel = uSubName;
        }
      }

      if (subLabel) parts.push(subLabel);
      return parts.join(' · ');
    }

    // ----- Случай 2: URL без division -----
    if (loadingEmployees) return 'Загрузка...';

    const currentUser = getCurrentUser();
    const uDivisionName: string | null = currentUser?.division_info?.name ?? null;
    const uSubdivisionName: string | null =
      currentUser?.division_info?.subdivision?.name ?? null;

    const divisionIds = new Set<number>();
    const subdivisionIds = new Set<number>();
    let firstDivisionName: string | null = null;
    let firstSubdivisionName: string | null = null;

    for (const emp of employees) {
      if (emp.division?.id != null) {
        divisionIds.add(Number(emp.division.id));
        if (!firstDivisionName && emp.division.name) {
          firstDivisionName = emp.division.name;
        }
      }
      if (emp.subdivision?.id != null) {
        subdivisionIds.add(Number(emp.subdivision.id));
        if (!firstSubdivisionName && emp.subdivision.name) {
          firstSubdivisionName = emp.subdivision.name;
        }
      }
    }

    // Список пуст → данные пользователя
    if (divisionIds.size === 0) {
      if (uDivisionName && uSubdivisionName) {
        return `${uDivisionName} · ${uSubdivisionName}`;
      }
      if (uDivisionName) return uDivisionName;
      return 'Все подразделения';
    }

    // Один дивизион
    if (divisionIds.size === 1) {
      const divName = firstDivisionName ?? uDivisionName ?? 'Подразделение';
      if (subdivisionIds.size === 1) {
        const subName = firstSubdivisionName ?? uSubdivisionName ?? '';
        return subName ? `${divName} · ${subName}` : divName;
      }
      return divName;
    }

    // Несколько дивизионов
    return 'Все подразделения';
  }, [
    divisionIdFromUrl,
    subdivisionIdFromUrl,
    divisionName,
    subdivisionName,
    employees,
    loadingEmployees,
    getCurrentUser,
  ]);

  // Уникальный ключ для хранения свёрнутости в разрезе подразделения/отделения
  const storageKey = useMemo(
    () => `${divisionIdFromUrl || 'all'}_${subdivisionIdFromUrl || 'none'}`,
    [divisionIdFromUrl, subdivisionIdFromUrl],
  );

  return (
    <div className="schedule-container page-fade-in" onClick={closeContextMenu}>
      <ScheduleHeader
        onBack={handleBack}
        subtitle={headerSubtitle}
        showBack={fromDivisionPage}
      />

      <ScheduleControls
        currentYear={currentYear}
        currentMonth={currentMonth}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        canEdit={canEdit}
        selectedDate={selectedReportDate}
        setSelectedDate={setSelectedReportDate}
      />

      <StatusSummary
        employees={employeesFilteredByDivision}
        events={events}
        selectedDate={selectedReportDate}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        eventLabels={EVENT_LABELS}
        eventColors={EVENT_COLORS}
        currentYear={currentYear}
        currentMonth={currentMonth}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {loadingEmployees || loadingEvents ? (
        <ScheduleLoading />
      ) : (
        <ScheduleTable
          employees={filteredEmployees}
          days={days}
          getEventFor={getEventFor}
          isInRange={isInRange}
          canEdit={canEdit}
          onCellClick={handleCellClick}
          onCellMouseEnter={handleCellMouseEnter}
          onCellMouseLeave={handleCellMouseLeave}
          onTableMouseLeave={handleTableMouseLeave}
          onContextMenu={handleContextMenu}
          onDateHeaderClick={(date) => setSelectedReportDate(date)}
          selectedDate={selectedReportDate}
          eventColors={EVENT_COLORS}
          eventLabels={EVENT_LABELS}
          eventShortLabels={EVENT_SHORT_LABELS}
          viewMode={viewMode}
          storageKey={storageKey}
        />
      )}

      <ScheduleContextMenu
        contextMenu={contextMenu}
        closeContextMenu={closeContextMenu}
        getEventFor={getEventFor}
        eventLabels={EVENT_LABELS}
        eventColors={EVENT_COLORS}
        onAction={handleContextMenuAction}
      />

      <ScheduleModal
        modalOpen={modalOpen}
        closeModal={closeModal}
        selectedEmployee={selectedEmployee}
        selectedDate={selectedDate}
        selectedEventType={selectedEventType}
        setSelectedEventType={setSelectedEventType}
        comment={comment}
        setComment={setComment}
        existingEvent={existingEvent}
        bulkRange={bulkRange}
        bulkCount={bulkCount}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        eventLabels={EVENT_LABELS}
        onClearRange={handleClearRange}
        hasEventsInRange={hasEventsInRange}
      />
    </div>
  );
}