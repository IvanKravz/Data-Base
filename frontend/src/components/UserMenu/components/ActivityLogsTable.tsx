// components/ActivityLogsTable.tsx
import React from 'react';
import {
    Clock, Plus, Edit as EditIcon, Trash2, Upload,
    Download as DownloadIcon, Eye, LogOut, ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { type ActionLog } from '../../api/logs';
import '../styles/ActivityLogsTable.css';

interface Pagination {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
}

interface ActivityLogsTableProps {
    logs: ActionLog[];
    isLoadingLogs: boolean;
    pagination: Pagination;
    onPageChange: (newPage: number) => void;
}

export function ActivityLogsTable({
    logs,
    isLoadingLogs,
    pagination,
    onPageChange
}: ActivityLogsTableProps) {
    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create': return <Plus className="w-4 h-4" />;
            case 'update': return <EditIcon className="w-4 h-4" />;
            case 'delete': return <Trash2 className="w-4 h-4" />;
            case 'view': return <Eye className="w-4 h-4" />;
            case 'login': return <LogOut className="w-4 h-4" />;
            case 'logout': return <LogOut className="w-4 h-4" />;
            case 'upload': return <Upload className="w-4 h-4" />;
            case 'download': return <DownloadIcon className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getActionBadgeClass = (color: string) => {
        const colorMap: Record<string, string> = {
            'green': 'action-green',
            'blue': 'action-blue',
            'red': 'action-red',
            'gray': 'action-gray',
            'teal': 'action-teal',
            'orange': 'action-orange',
            'yellow': 'action-yellow',
            'purple': 'action-purple',
            'pink': 'action-pink',
            'indigo': 'action-indigo',
            'amber': 'action-amber',
            'lime': 'action-lime',
        };
        return colorMap[color] || 'action-gray';
    };

    const truncateText = (text: string | null, maxLength: number = 30) => {
        if (!text) return '—';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

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
        <div className="activity-logs">
            <div className="logs-header">
                <h4 className="logs-title">Журнал действий</h4>
                <div className="logs-info">
                    Показано {logs.length} из {pagination.total}
                </div>
            </div>

            <div className="logs-table-container">
                {isLoadingLogs ? (
                    <div className="loading-logs">
                        <div className="loading-spinner"></div>
                        <p>Загрузка действий...</p>
                    </div>
                ) : !logs || logs.length === 0 ? (
                    <div className="empty-logs">
                        <Clock className="empty-icon" />
                        <p>Действия не найдены</p>
                        <p className="empty-subtext">
                            Измените параметры фильтрации или выполните действия в системе
                        </p>
                    </div>
                ) : (
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Время</th>
                                <th>Действие</th>
                                <th>Модуль</th>
                                <th>Объект</th>
                                <th>Детали</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="log-row">
                                    <td className="log-time">
                                        <div className="time-badge">
                                            {formatDate(log.created_at)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`action-badge ${getActionBadgeClass(log.action_color)}`}>
                                            {getActionIcon(log.action)}
                                            <span>{log.action_display}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="module-badge">
                                            {log.module_display}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="object-cell">
                                            <div className="object-name">
                                                {truncateText(log.object_name)}
                                            </div>
                                            {log.model_name && (
                                                <div className="object-type">
                                                    {log.model_name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="details-cell">
                                            {log.details && typeof log.details === 'object' ? (
                                                <pre className="details-json">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            ) : (
                                                <span className="details-text">
                                                    {log.details || '—'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="ip-cell">
                                            {log.ip_address || '—'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pagination.total_pages > 1 && (
                <div className="logs-pagination">
                    <button
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="pagination-btn"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Назад
                    </button>

                    <div className="pagination-pages">
                        {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                            let pageNum;
                            if (pagination.total_pages <= 5) {
                                pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                                pageNum = i + 1;
                            } else if (pagination.page >= pagination.total_pages - 2) {
                                pageNum = pagination.total_pages - 4 + i;
                            } else {
                                pageNum = pagination.page - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`page-btn ${pagination.page === pageNum ? 'active' : ''}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.total_pages}
                        className="pagination-btn"
                    >
                        Вперед
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}