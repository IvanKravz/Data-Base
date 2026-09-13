// components/ActivityTab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ActivityStats } from './ActivityStats';
import { ActivityFilters } from './ActivityFilters';
import { ActivityLogsTable } from './ActivityLogsTable';
import { logsApi, type ActionLog } from '../../../api/logs';
import '../styles/ActivityTab.css';

interface LogStats {
    total_actions: number;
    actions_by_type: Array<{ action: string; count: number }>;
    actions_by_module: Array<{ module: string; count: number }>;
    last_login: string | null;
}

interface ActionChoice {
    value: string;
    label: string;
}

interface ActivityTabProps {
    userId?: number;
}

export function ActivityTab({ userId }: ActivityTabProps) {
    const [logs, setLogs] = useState<ActionLog[]>([]);
    const [stats, setStats] = useState<LogStats | null>(null);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [actionChoices, setActionChoices] = useState<ActionChoice[]>([]);
    const [moduleChoices, setModuleChoices] = useState<ActionChoice[]>([]);

    // Кэш ВСЕХ логов, если бэкенд возвращает непагинированный массив.
    // null = серверная пагинация (или кэш ещё не получен).
    const allLogsRef = useRef<ActionLog[] | null>(null);

    const [filters, setFilters] = useState({
        action: '',
        module: '',
        date_from: '',
        date_to: '',
        search: '',
    });

    const [pagination, setPagination] = useState({
        page: 1,
        page_size: 20,
        total: 0,
        total_pages: 0,
    });

    useEffect(() => {
        loadActionChoices();
    }, []);

    useEffect(() => {
        allLogsRef.current = null; // при смене пользователя кэш невалиден
        loadLogStats();
    }, [userId]);

    useEffect(() => {
        loadLogs();
    }, [filters, pagination.page, userId]);

    const loadActionChoices = async () => {
        try {
            const data = await logsApi.getChoices();
            setActionChoices(data.actions || []);
            setModuleChoices(data.modules || []);
        } catch (error) {
            console.error('Error loading action choices:', error);
        }
    };

    const loadLogStats = async () => {
        try {
            const params = userId ? { user_id: userId } : {};
            const data = await logsApi.getStats(params);
            const statsData = data?.data || data;
            setStats(statsData);
        } catch (error) {
            console.error('Error loading log stats:', error);
        }
    };

    const applyClientPagination = (allLogs: ActionLog[], page: number, pageSize: number) => {
        const start = (page - 1) * pageSize;
        setLogs(allLogs.slice(start, start + pageSize));
        setPagination(prev => ({
            ...prev,
            total: allLogs.length,
            total_pages: Math.max(1, Math.ceil(allLogs.length / pageSize)),
        }));
    };

    const loadLogs = async () => {
        // Fast-path: если есть кэш всего массива — просто режем локально
        if (allLogsRef.current) {
            applyClientPagination(allLogsRef.current, pagination.page, pagination.page_size);
            return;
        }

        setIsLoadingLogs(true);
        try {
            const params = {
                page: pagination.page,
                page_size: pagination.page_size,
                ...filters,
                user_id: userId,
            };

            const response = await logsApi.getLogs(params);

            // API вернул просто массив — все логи сразу
            if (Array.isArray(response)) {
                allLogsRef.current = response;
                applyClientPagination(response, pagination.page, pagination.page_size);
                return;
            }

            const data = response?.data || response;

            let results: ActionLog[] = [];
            let count = 0;
            let isNonPaginatedArray = false;

            if (data?.results && Array.isArray(data.results)) {
                results = data.results;
                count = data.count || data.total || 0;
            } else if (Array.isArray(data)) {
                results = data;
                count = data.length;
                isNonPaginatedArray = true;
            } else if (data?.items && Array.isArray(data.items)) {
                results = data.items;
                count = data.count || data.total || 0;
            } else if (data?.data && Array.isArray(data.data)) {
                results = data.data;
                count = data.count || data.total || data.data.length || 0;
                isNonPaginatedArray = true;
            }

            if (isNonPaginatedArray) {
                allLogsRef.current = results;
                applyClientPagination(results, pagination.page, pagination.page_size);
                return;
            }

            setLogs(results);
            setPagination(prev => ({
                ...prev,
                total: count,
                total_pages: Math.max(1, Math.ceil(count / prev.page_size)),
            }));
        } catch (error) {
            console.error('Error loading logs:', error);
            setLogs([]);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        // любые изменения фильтров инвалидируют кэш «всех логов»
        allLogsRef.current = null;
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleResetFilters = () => {
        allLogsRef.current = null;
        setFilters({
            action: '',
            module: '',
            date_from: '',
            date_to: '',
            search: '',
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const exportLogs = async () => {
        try {
            const params = userId ? { ...filters, user_id: userId } : filters;
            const blob = await logsApi.exportLogs(params);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `user_actions_${new Date().toISOString().split('T')[0]}.csv`,
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting logs:', error);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="activity-section">
            <ActivityStats stats={stats} />
            <ActivityFilters
                filters={filters}
                actionChoices={actionChoices}
                moduleChoices={moduleChoices}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                onExportLogs={exportLogs}
            />
            <ActivityLogsTable
                logs={logs}
                isLoadingLogs={isLoadingLogs}
                pagination={pagination}
                onPageChange={handlePageChange}
            />
        </div>
    );
}