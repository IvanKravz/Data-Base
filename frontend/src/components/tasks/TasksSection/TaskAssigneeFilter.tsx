import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, User as UserIcon, X } from 'lucide-react';
import { Task, TaskAssignee } from '../../../types/tasks';
import './style.css';

interface TaskAssigneeFilterProps {
    tasks: Task[];
    selectedAssigneeId: number | null;
    onAssigneeChange: (assigneeId: number | null) => void;
}

interface AssigneeOption {
    id: number;
    full_name: string;
    position?: string;
    rank?: string;
    tasksCount: number;
}

export function TaskAssigneeFilter({
    tasks,
    selectedAssigneeId,
    onAssigneeChange,
}: TaskAssigneeFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Уникальные ответственные из задач + количество их задач
    const assignees: AssigneeOption[] = useMemo(() => {
        const map = new Map<number, AssigneeOption>();
        for (const task of tasks) {
            const a = task.assignee;
            if (!a) continue;
            const existing = map.get(a.id);
            if (existing) {
                existing.tasksCount += 1;
            } else {
                map.set(a.id, {
                    id: a.id,
                    full_name: a.full_name,
                    position: a.position,
                    rank: a.rank,
                    tasksCount: 1,
                });
            }
        }
        return Array.from(map.values()).sort((a, b) =>
            a.full_name.localeCompare(b.full_name, 'ru')
        );
    }, [tasks]);

    // Отфильтрованные по поисковому запросу
    const filteredAssignees = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return assignees;
        return assignees.filter((a) => {
            const haystack = `${a.full_name} ${a.position ?? ''} ${a.rank ?? ''}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [assignees, searchQuery]);

    // Выбранный объект (для отображения в кнопке)
    const selectedAssignee = useMemo(
        () => assignees.find((a) => a.id === selectedAssigneeId) ?? null,
        [assignees, selectedAssigneeId]
    );

    // Если выбранный исполнитель пропал из списка (например, задачи перезагрузились) — сбрасываем
    useEffect(() => {
        if (selectedAssigneeId !== null && !assignees.some((a) => a.id === selectedAssigneeId)) {
            // Опционально: можно не сбрасывать, чтобы не терять выбор при перезагрузке.
            // Раскомментируйте, если нужно автоматически сбрасывать.
            // onAssigneeChange(null);
        }
    }, [assignees, selectedAssigneeId, onAssigneeChange]);

    // Клик вне — закрыть
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (ev: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(ev.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleKey = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isOpen]);

    // Автофокус на input при открытии
    useEffect(() => {
        if (isOpen) {
            // Небольшая задержка, чтобы dropdown успел отрисоваться
            const t = setTimeout(() => inputRef.current?.focus(), 0);
            return () => clearTimeout(t);
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    const handleSelect = (id: number | null) => {
        onAssigneeChange(id);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAssigneeChange(null);
        setSearchQuery('');
    };

    const displayLabel = selectedAssignee
        ? selectedAssignee.full_name
        : 'Все исполнители';

    return (
        <div className="tasks-assignee-filter" ref={containerRef}>
            <label className="tasks-filter-label">Ответственный исполнитель</label>

            <button
                type="button"
                className={`tasks-assignee-trigger ${isOpen ? 'tasks-assignee-trigger-open' : ''} ${selectedAssignee ? 'tasks-assignee-trigger-selected' : ''
                    }`}
                onClick={() => setIsOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="tasks-assignee-trigger-icon">
                    <UserIcon size={16} />
                </span>
                <span className="tasks-assignee-trigger-label" title={displayLabel}>
                    {displayLabel}
                </span>
                {selectedAssignee ? (
                    <span
                        className="tasks-assignee-trigger-clear"
                        role="button"
                        tabIndex={0}
                        onClick={handleClear}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleClear(e as unknown as React.MouseEvent);
                            }
                        }}
                        aria-label="Сбросить исполнителя"
                        title="Сбросить"
                    >
                        <X size={14} />
                    </span>
                ) : (
                    <ChevronDown
                        size={16}
                        className={`tasks-assignee-trigger-chevron ${isOpen ? 'tasks-assignee-trigger-chevron-open' : ''
                            }`}
                    />
                )}
            </button>

            {isOpen && (
                <div className="tasks-assignee-dropdown" role="listbox">
                    <div className="tasks-assignee-search">
                        <Search size={14} className="tasks-assignee-search-icon" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="tasks-assignee-search-input"
                            placeholder="Поиск по ФИО или должности"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="tasks-assignee-search-clear"
                                onClick={() => {
                                    setSearchQuery('');
                                    inputRef.current?.focus();
                                }}
                                aria-label="Очистить поиск"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="tasks-assignee-options">
                        {/* Опция "Все исполнители" */}
                        <button
                            type="button"
                            className={`tasks-assignee-option ${selectedAssigneeId === null ? 'tasks-assignee-option-active' : ''
                                }`}
                            onClick={() => handleSelect(null)}
                        >
                            <span className="tasks-assignee-option-name">Все исполнители</span>
                            <span className="tasks-assignee-option-count">{tasks.length}</span>
                        </button>

                        {filteredAssignees.length === 0 && (
                            <div className="tasks-assignee-empty">
                                {assignees.length === 0
                                    ? 'Нет назначенных исполнителей'
                                    : 'Ничего не найдено'}
                            </div>
                        )}

                        {filteredAssignees.map((a) => {
                            const isActive = a.id === selectedAssigneeId;
                            return (
                                <button
                                    key={a.id}
                                    type="button"
                                    className={`tasks-assignee-option ${isActive ? 'tasks-assignee-option-active' : ''
                                        }`}
                                    onClick={() => handleSelect(a.id)}
                                >
                                    <span className="tasks-assignee-option-text">
                                        <span className="tasks-assignee-option-name">{a.full_name}</span>
                                        {(a.position || a.rank) && (
                                            <span className="tasks-assignee-option-sub">
                                                {[a.position, a.rank].filter(Boolean).join(' · ')}
                                            </span>
                                        )}
                                    </span>
                                    <span className="tasks-assignee-option-count">{a.tasksCount}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}