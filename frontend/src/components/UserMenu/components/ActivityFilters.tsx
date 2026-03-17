// components/ActivityFilters.tsx
import React from 'react';
import { Search, Filter, Calendar, RefreshCw, Download } from 'lucide-react';
import '../styles/ActivityTab.css';

interface ActionChoice {
    value: string;
    label: string;
}

interface ActivityFiltersProps {
    filters: {
        action: string;
        module: string;
        date_from: string;
        date_to: string;
        search: string;
    };
    actionChoices: ActionChoice[];
    moduleChoices: ActionChoice[];
    onFilterChange: (key: keyof typeof filters, value: string) => void;
    onResetFilters: () => void;
    onExportLogs: () => void;
}

export function ActivityFilters({
    filters,
    actionChoices,
    moduleChoices,
    onFilterChange,
    onResetFilters,
    onExportLogs
}: ActivityFiltersProps) {
    return (
        <div className="activity-filters">
            <div className="filters-header">
                <h4 className="filters-title">Фильтры действий</h4>
                <div className="filters-actions">
                    <button
                        onClick={onResetFilters}
                        className="filter-btn secondary"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Сбросить
                    </button>
                    <button
                        onClick={onExportLogs}
                        className="filter-btn primary"
                    >
                        <Download className="w-4 h-4" />
                        Экспорт
                    </button>
                </div>
            </div>

            <div className="filters-grid">
                <div className="filter-field">
                    <label className="filter-label">
                        <Search className="filter-icon" />
                        Поиск
                    </label>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        className="filter-input"
                        placeholder="Поиск по действиям..."
                    />
                </div>

                <div className="filter-field">
                    <label className="filter-label">
                        <Filter className="filter-icon" />
                        Действие
                    </label>
                    {actionChoices.length > 0 ? (
                        <select
                            value={filters.action}
                            onChange={(e) => onFilterChange('action', e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Все действия</option>
                            {actionChoices.map((choice) => (
                                <option key={choice.value} value={choice.value}>
                                    {choice.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <select disabled className="filter-select">
                            <option>Нет доступных действий</option>
                        </select>
                    )}
                </div>

                <div className="filter-field">
                    <label className="filter-label">
                        <Filter className="filter-icon" />
                        Модуль
                    </label>
                    <select
                        value={filters.module}
                        onChange={(e) => onFilterChange('module', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Все модули</option>
                        {moduleChoices.map((choice) => (
                            <option key={choice.value} value={choice.value}>
                                {choice.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label className="filter-label">
                        <Calendar className="filter-icon" />
                        Дата с
                    </label>
                    <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => onFilterChange('date_from', e.target.value)}
                        className="filter-input"
                    />
                </div>

                <div className="filter-field">
                    <label className="filter-label">
                        <Calendar className="filter-icon" />
                        Дата по
                    </label>
                    <input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => onFilterChange('date_to', e.target.value)}
                        className="filter-input"
                    />
                </div>
            </div>
        </div>
    );
}