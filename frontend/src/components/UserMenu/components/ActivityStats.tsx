// components/ActivityStats.tsx
import React from 'react';
import { BarChart3, Clock } from 'lucide-react';
import '../styles/ActivityTab.css';

interface LogStats {
    total_actions: number;
    actions_by_type: Array<{ action: string; count: number }>;
    actions_by_module: Array<{ module: string; count: number }>;
    last_login: string | null;
}

interface ActivityStatsProps {
    stats: LogStats | null;
}

export function ActivityStats({ stats }: ActivityStatsProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Нет данных';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Неверный формат даты';
        }
    };

    return (
        <div className="activity-stats">
            <div className="stat-card">
                <BarChart3 className="stat-icon" />
                <div className="stat-content">
                    <div className="stat-value">{stats?.total_actions || 0}</div>
                    <div className="stat-label">Всего действий</div>
                </div>
            </div>
            <div className="stat-card">
                <Clock className="stat-icon" />
                <div className="stat-content">
                    <div className="stat-value">
                        {stats?.last_login ? formatDate(stats.last_login) : 'Нет данных'}
                    </div>
                    <div className="stat-label">Последний вход</div>
                </div>
            </div>
        </div>
    );
}