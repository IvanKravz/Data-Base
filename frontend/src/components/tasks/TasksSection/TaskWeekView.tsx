// TaskWeekView.tsx
import React, { useMemo, useState } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    addDays,
    addWeeks,
    subWeeks,
    isSameDay,
    startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Check,
    ChevronDown,
    ChevronUp,
    Pencil,
    Trash2,
    User,
    Users,
    Lock,
} from 'lucide-react';
import { Task, Step } from '../../../types/tasks';
import { useAppPermissions } from '../../../api/utils/AppPermissionsContext';
import './styles/TaskWeekView.css';

interface HighlightedRange {
    start: Date;
    end: Date;
    category: Task['category'];
    taskId: string;
    stepId?: string;
}

interface TaskWeekViewProps {
    tasks: Task[];
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    onTaskEdit?: (task: Task) => void;
    onTaskDelete?: (taskId: string) => void;
    onToggleStep?: (taskId: string, stepId: string, currentCompleted: boolean) => void;
    highlightedRange?: HighlightedRange | null;
    onHighlightRange?: (range: HighlightedRange | null) => void;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function TaskWeekView({
    tasks,
    selectedDate,
    onDateChange,
    onTaskEdit,
    onTaskDelete,
    onToggleStep,
    highlightedRange,
    onHighlightRange,
}: TaskWeekViewProps) {
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const { canEditTask, canDeleteTask, getCurrentUser } = useAppPermissions();
    const currentUser = getCurrentUser();

    const weekStart = useMemo(
        () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
        [selectedDate]
    );
    const weekEnd = useMemo(
        () => endOfWeek(selectedDate, { weekStartsOn: 1 }),
        [selectedDate]
    );

    // Опорный месяц — месяц выбранной даты.
    // Все дни недели, у которых месяц/год отличаются, помечаются как «соседние».
    const referenceMonth = selectedDate.getMonth();
    const referenceYear = selectedDate.getFullYear();

    const days = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );

    const weekTasks = useMemo(
        () =>
            tasks.filter((task) =>
                task.steps.some(
                    (step) =>
                        new Date(step.start_date) <= weekEnd &&
                        new Date(step.end_date) >= weekStart
                )
            ),
        [tasks, weekStart, weekEnd]
    );

    const isToday = (d: Date) => isSameDay(d, new Date());

    const isOutsideReferenceMonth = (d: Date) =>
        d.getMonth() !== referenceMonth || d.getFullYear() !== referenceYear;

    const getBarGeometry = (step: Step) => {
        const s = startOfDay(new Date(step.start_date));
        const e = startOfDay(new Date(step.end_date));
        const vStart = s < weekStart ? weekStart : s;
        const vEnd = e > weekEnd ? weekEnd : e;
        const startIdx = Math.round((vStart.getTime() - weekStart.getTime()) / MS_PER_DAY);
        const endIdx = Math.round((vEnd.getTime() - weekStart.getTime()) / MS_PER_DAY);
        const left = (startIdx / 7) * 100;
        const width = ((endIdx - startIdx + 1) / 7) * 100;
        const clippedStart = s < weekStart;
        const clippedEnd = e > weekEnd;
        return { left, width, clippedStart, clippedEnd };
    };

    const toggleTaskExpanded = (taskId: string) => {
        setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
    };

    const handleBarClick = (step: Step, task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        if (target.closest('.task-week-bar-check')) return;

        if (onHighlightRange) {
            const already =
                highlightedRange?.taskId === task.id &&
                highlightedRange?.stepId === step.id;
            onHighlightRange(
                already
                    ? null
                    : {
                        start: new Date(step.start_date),
                        end: new Date(step.end_date),
                        category: task.category,
                        taskId: task.id,
                        stepId: step.id,
                    }
            );
        }
    };

    const handleCheckboxClick = (
        step: Step,
        task: Task,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        onToggleStep?.(task.id, step.id, step.is_completed);
    };

    const formatShortDate = (dateStr: string) =>
        format(new Date(dateStr), 'dd.MM.yyyy');

    const getTaskDateRange = (task: Task): string => {
        if (!task.steps.length) return 'Нет этапов';
        const startDates = task.steps.map((s) => new Date(s.start_date).getTime());
        const endDates = task.steps.map((s) => new Date(s.end_date).getTime());
        const minStart = new Date(Math.min(...startDates));
        const maxEnd = new Date(Math.max(...endDates));
        return `${format(minStart, 'dd.MM.yyyy')} – ${format(maxEnd, 'dd.MM.yyyy')}`;
    };

    return (
        <div className="task-week-view">
            <div className="task-week-nav">
                <button
                    className="task-week-nav-btn"
                    onClick={() => onDateChange(subWeeks(selectedDate, 1))}
                    aria-label="Предыдущая неделя"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="task-week-label">
                    {format(weekStart, 'd MMM', { locale: ru })} —{' '}
                    {format(weekEnd, 'd MMM yyyy', { locale: ru })}
                </span>
                <button
                    className="task-week-nav-btn"
                    onClick={() => onDateChange(addWeeks(selectedDate, 1))}
                    aria-label="Следующая неделя"
                >
                    <ChevronRight size={18} />
                </button>
                <button
                    className="task-week-today-btn"
                    onClick={() => onDateChange(new Date())}
                >
                    <CalendarIcon size={14} />
                    <span>Сегодня</span>
                </button>
            </div>

            <div className="task-week-grid">
                <div className="task-week-header">
                    <div className="task-week-header-spacer">
                        <span>Задача / этап</span>
                    </div>
                    {days.map((day) => {
                        const outsideMonth = isOutsideReferenceMonth(day);
                        return (
                            <div
                                key={day.toISOString()}
                                className={
                                    'task-week-day-header' +
                                    (isToday(day) ? ' task-week-day-today' : '') +
                                    (outsideMonth ? ' task-week-day-outside-month' : '')
                                }
                            >
                                <span className="task-week-day-name">
                                    {format(day, 'EEEE', { locale: ru })}
                                </span>
                                <span className="task-week-day-num">
                                    {format(day, 'd')}
                                    {outsideMonth && (
                                        <span className="task-week-day-month">
                                            {format(day, 'LLL', { locale: ru })}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="task-week-body">
                    {weekTasks.length === 0 ? (
                        <div className="task-week-empty">Нет задач на эту неделю</div>
                    ) : (
                        weekTasks.map((task) => {
                            const stepsInWeek = task.steps.filter(
                                (step) =>
                                    new Date(step.start_date) <= weekEnd &&
                                    new Date(step.end_date) >= weekStart
                            );

                            const taskIsCompleted =
                                task.steps.length > 0 &&
                                task.steps.every((s) => s.is_completed);
                            const isExpanded = expandedTaskId === task.id;

                            const canEdit = canEditTask(task, currentUser);
                            const canDelete = canDeleteTask(task, currentUser);

                            const completedStepsCount = task.steps.filter(
                                (s) => s.is_completed
                            ).length;
                            const totalSteps = task.steps.length;
                            const progressPercent =
                                totalSteps > 0
                                    ? Math.round((completedStepsCount / totalSteps) * 100)
                                    : 0;

                            const divisionName = task.division?.name || '—';
                            const subdivisionName = task.subdivision?.name || '';
                            const creatorName =
                                task.created_by?.name ||
                                task.created_by?.username ||
                                task.created_by?.email ||
                                'Неизвестно';

                            return (
                                <div
                                    key={task.id}
                                    className={`task-week-task ${isExpanded ? 'task-week-task-expanded' : ''
                                        }`}
                                >
                                    <div
                                        className={`task-week-task-title ${taskIsCompleted
                                                ? 'task-week-task-title-completed'
                                                : ''
                                            }`}
                                        onClick={() => toggleTaskExpanded(task.id)}
                                        title={task.title}
                                    >
                                        <span className="task-week-task-title-text">
                                            {task.title}
                                        </span>
                                        <span className="task-week-task-toggle">
                                            {isExpanded ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            )}
                                        </span>
                                    </div>

                                    <div className="task-week-task-lanes">
                                        {stepsInWeek.map((step) => {
                                            const {
                                                left,
                                                width,
                                                clippedStart,
                                                clippedEnd,
                                            } = getBarGeometry(step);
                                            const isHighlighted =
                                                highlightedRange?.taskId === task.id &&
                                                highlightedRange?.stepId === step.id;

                                            const categoryClass = taskIsCompleted
                                                ? 'task-week-bar-task-completed'
                                                : `task-week-bar-${task.category}`;

                                            return (
                                                <div
                                                    key={step.id}
                                                    className="task-week-lane"
                                                >
                                                    {days.map((d, i) => (
                                                        <div
                                                            key={i}
                                                            className={`task-week-cell ${isToday(d)
                                                                    ? 'task-week-cell-today'
                                                                    : ''
                                                                }`}
                                                            style={{
                                                                left: `${(i / 7) * 100}%`,
                                                                width: `${100 / 7}%`,
                                                            }}
                                                        />
                                                    ))}
                                                    <div
                                                        className={
                                                            `task-week-bar ${categoryClass}` +
                                                            (step.is_completed
                                                                ? ' task-week-bar-completed'
                                                                : '') +
                                                            (isHighlighted
                                                                ? ' task-week-bar-highlighted'
                                                                : '') +
                                                            (clippedStart
                                                                ? ' task-week-bar-clip-start'
                                                                : '') +
                                                            (clippedEnd
                                                                ? ' task-week-bar-clip-end'
                                                                : '')
                                                        }
                                                        style={{
                                                            left: `${left}%`,
                                                            width: `calc(${width}% - 4px)`,
                                                        }}
                                                        title={`${step.name} (${format(
                                                            new Date(step.start_date),
                                                            'dd.MM.yyyy'
                                                        )} — ${format(
                                                            new Date(step.end_date),
                                                            'dd.MM.yyyy'
                                                        )})`}
                                                        onClick={(e) =>
                                                            handleBarClick(step, task, e)
                                                        }
                                                    >
                                                        <button
                                                            className={`task-week-bar-check ${step.is_completed
                                                                    ? 'task-week-bar-check-done'
                                                                    : ''
                                                                }`}
                                                            onClick={(e) =>
                                                                handleCheckboxClick(step, task, e)
                                                            }
                                                            aria-label="Отметить этап"
                                                        >
                                                            {step.is_completed && (
                                                                <Check size={10} />
                                                            )}
                                                        </button>
                                                        <span className="task-week-bar-label">
                                                            {step.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {isExpanded && (
                                        <div className="task-week-details">
                                            <div className="task-week-details-meta">
                                                <div className="task-week-details-meta-item">
                                                    <User size={12} />
                                                    <span>
                                                        Создал: <strong>{creatorName}</strong>
                                                    </span>
                                                </div>
                                                <div className="task-week-details-meta-item">
                                                    <Users size={12} />
                                                    <span>
                                                        {divisionName}
                                                        {subdivisionName && ` / ${subdivisionName}`}
                                                    </span>
                                                </div>
                                                <div className="task-week-details-meta-item">
                                                    <CalendarIcon size={12} />
                                                    <span>Сроки: {getTaskDateRange(task)}</span>
                                                </div>
                                                {task.is_private && (
                                                    <div className="task-week-details-meta-item task-week-details-meta-private">
                                                        <Lock size={12} />
                                                        <span>Приватная</span>
                                                    </div>
                                                )}

                                                {(canEdit || canDelete) && (
                                                    <div className="task-week-details-meta-actions">
                                                        {canEdit && onTaskEdit && (
                                                            <button
                                                                className="task-week-details-icon-btn task-week-details-icon-btn-edit"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onTaskEdit(task);
                                                                }}
                                                                aria-label="Редактировать"
                                                                title="Редактировать"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                        )}
                                                        {canDelete && onTaskDelete && (
                                                            <button
                                                                className="task-week-details-icon-btn task-week-details-icon-btn-delete"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onTaskDelete(task.id);
                                                                }}
                                                                aria-label="Удалить"
                                                                title="Удалить"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="task-week-details-progress">
                                                <div className="task-week-details-progress-header">
                                                    <span>
                                                        Прогресс: {completedStepsCount} / {totalSteps} этапов
                                                    </span>
                                                    <span className="task-week-details-progress-percent">
                                                        {progressPercent}%
                                                    </span>
                                                </div>
                                                <div className="task-week-details-progress-bar">
                                                    <div
                                                        className="task-week-details-progress-fill"
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="task-week-details-steps">
                                                <div className="task-week-details-steps-header">
                                                    Этапы выполнения
                                                </div>
                                                {task.steps.map((step, idx) => (
                                                    <div
                                                        key={step.id || `step-${idx}`}
                                                        className="task-week-details-step"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={step.is_completed}
                                                            onChange={() =>
                                                                onToggleStep?.(task.id, step.id, step.is_completed)
                                                            }
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className="task-week-details-step-name">
                                                            Этап {idx + 1}: {step.name}
                                                        </span>
                                                        <span className="task-week-details-step-date">
                                                            {formatShortDate(step.start_date)} –{' '}
                                                            {formatShortDate(step.end_date)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}