// components/ActivityTab.tsx
import React, { useState, useEffect } from 'react';
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

export function ActivityTab() {
    const [logs, setLogs] = useState<ActionLog[]>([]); 
    const [stats, setStats] = useState<LogStats | null>(null);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [actionChoices, setActionChoices] = useState<ActionChoice[]>([]);
    const [moduleChoices, setModuleChoices] = useState<ActionChoice[]>([]);

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
        loadLogStats();
        loadLogs();
    }, [filters, pagination.page]);

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
            const data = await logsApi.getStats();
            const statsData = data?.data || data;
            setStats(statsData);
        } catch (error) {
            console.error('Error loading log stats:', error);
        }
    };

    const loadLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const params = {
                page: pagination.page,
                page_size: pagination.page_size,
                ...filters,
            };
    
            const response = await logsApi.getLogs(params);
    
            if (Array.isArray(response)) {
                setLogs(response);
                setPagination(prev => ({
                    ...prev,
                    total: response.length,
                    total_pages: Math.ceil(response.length / pagination.page_size),
                }));
                return;
            }
    
            const data = response?.data || response;
            
            let results: ActionLog[] = [];
            let count = 0;
            
            if (data?.results && Array.isArray(data.results)) {
                results = data.results;
                count = data.count || data.total || 0;
            } else if (Array.isArray(data)) {
                results = data;
                count = data.length;
            } else if (data?.items && Array.isArray(data.items)) {
                results = data.items;
                count = data.count || data.total || 0;
            } else if (data?.data && Array.isArray(data.data)) {
                results = data.data;
                count = data.count || data.total || data.data.length || 0;
            }
       
            setLogs(results);
            setPagination(prev => ({
                ...prev,
                total: count,
                total_pages: Math.ceil(count / pagination.page_size),
            }));
        } catch (error) {
            console.error('Error loading logs:', error);
            setLogs([]);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleResetFilters = () => {
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
            const blob = await logsApi.exportLogs(filters);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `user_actions_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
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