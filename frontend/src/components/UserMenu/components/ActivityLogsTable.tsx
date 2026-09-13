// components/ActivityLogsTable.tsx
import React, { useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
    Clock, Plus, Edit as EditIcon, Trash2, Upload,
    Download as DownloadIcon, Eye, LogOut, ChevronLeft,
    ChevronRight, Maximize2
} from 'lucide-react';
import '../styles/ActivityLogsTable.css';
import { ActionLog } from '../../../api/logs';
import { DetailsModal } from './DetailsModal';

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

/* ---------- Хелперы вне компонента (не создаются заново на каждый рендер) ---------- */

// Кэш форматирования дат: одни и те же ISO-строки встречаются часто
const dateFormatCache = new Map<string, string>();

function formatDateCached(dateString: string | null): string {
    if (!dateString) return 'Нет данных';
    const cached = dateFormatCache.get(dateString);
    if (cached !== undefined) return cached;
    try {
        const formatted = new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        dateFormatCache.set(dateString, formatted);
        return formatted;
    } catch {
        return 'Неверный формат даты';
    }
}

const ACTION_COLOR_MAP: Record<string, string> = {
    green: 'action-green',
    blue: 'action-blue',
    red: 'action-red',
    gray: 'action-gray',
    teal: 'action-teal',
    orange: 'action-orange',
    yellow: 'action-yellow',
    purple: 'action-purple',
    pink: 'action-pink',
    indigo: 'action-indigo',
    amber: 'action-amber',
    lime: 'action-lime',
};

function getActionBadgeClass(color: string): string {
    return ACTION_COLOR_MAP[color] || 'action-gray';
}

function getActionIcon(action: string): React.ReactNode {
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
}

function truncateText(text: string | null, maxLength: number = 30): string {
    if (!text) return '—';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Короткий превью деталей БЕЗ JSON.stringify.
 * Для объекта показываем первые 3 ключа с обрезанными значениями.
 */
function getDetailsPreview(details: unknown): string {
    if (details == null) return '—';
    if (typeof details === 'string') {
        return details.length > 60 ? details.slice(0, 60) + '…' : details;
    }
    if (typeof details !== 'object') return String(details);

    const entries = Object.entries(details as Record<string, unknown>);
    if (entries.length === 0) return '{}';

    const parts: string[] = [];
    const limit = Math.min(entries.length, 3);
    for (let i = 0; i < limit; i++) {
        const [key, value] = entries[i];
        let strVal: string;
        if (value == null) strVal = 'null';
        else if (Array.isArray(value)) strVal = `[${value.length}]`;
        else if (typeof value === 'object') strVal = '{…}';
        else strVal = String(value);
        if (strVal.length > 25) strVal = strVal.slice(0, 25) + '…';
        parts.push(`${key}: ${strVal}`);
    }
    const suffix = entries.length > 3 ? ', …' : '';
    return `{ ${parts.join(', ')}${suffix} }`;
}

/* ---------- Мемоизированная строка таблицы ---------- */

interface LogRowProps {
    log: ActionLog;
    onOpenDetails: (log: ActionLog) => void;
}

const LogRow = React.memo(function LogRow({ log, onOpenDetails }: LogRowProps) {
    // useMemo тут не обязателен (компонент мемоизирован), но оставим как защиту,
    // если родитель передаст новый объект log с тем же содержимым.
    const formattedDate = useMemo(() => formatDateCached(log.created_at), [log.created_at]);
    const detailsPreview = useMemo(() => getDetailsPreview(log.details), [log.details]);

    const badgeClass = getActionBadgeClass(log.action_color);

    return (
        <tr className="log-row">
            <td className="log-time">
                <div className="time-badge">{formattedDate}</div>
            </td>
            <td>
                <div className={`action-badge ${badgeClass}`}>
                    {getActionIcon(log.action)}
                    <span>{log.action_display}</span>
                </div>
            </td>
            <td>
                <div className="module-badge">{log.module_display}</div>
            </td>
            <td>
                <div className="object-cell">
                    <div className="object-name">{truncateText(log.object_name)}</div>
                    {log.model_name && (
                        <div className="object-type">{log.model_name}</div>
                    )}
                </div>
            </td>
            <td>
                <div className="details-cell">
                    <div className="details-content">
                        <span className="details-text" title={detailsPreview}>
                            {detailsPreview}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="details-expand-btn"
                        onClick={() => onOpenDetails(log)}
                        title="Подробнее"
                    >
                        <Maximize2 size={14} />
                    </button>
                </div>
            </td>
            <td>
                <div className="ip-cell">{log.ip_address || '—'}</div>
            </td>
        </tr>
    );
});

/* ---------- Сам компонент таблицы ---------- */

export function ActivityLogsTable({
    logs,
    isLoadingLogs,
    pagination,
    onPageChange,
}: ActivityLogsTableProps) {
    const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);

    const openDetailsModal = useCallback((log: ActionLog) => setSelectedLog(log), []);
    const closeDetailsModal = useCallback(() => setSelectedLog(null), []);

    // Мемоизируем список номеров страниц
    const pageNumbers = useMemo(() => {
        const total = pagination.total_pages;
        if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
        if (pagination.page <= 3) return [1, 2, 3, 4, 5];
        if (pagination.page >= total - 2) {
            return [total - 4, total - 3, total - 2, total - 1, total];
        }
        return [
            pagination.page - 2,
            pagination.page - 1,
            pagination.page,
            pagination.page + 1,
            pagination.page + 2,
        ];
    }, [pagination.page, pagination.total_pages]);

    const handlePrev = useCallback(
        () => onPageChange(pagination.page - 1),
        [onPageChange, pagination.page],
    );
    const handleNext = useCallback(
        () => onPageChange(pagination.page + 1),
        [onPageChange, pagination.page],
    );

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
                        <div className="loading-spinner-logs"></div>
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
                                <LogRow
                                    key={log.id}
                                    log={log}
                                    onOpenDetails={openDetailsModal}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pagination.total_pages > 1 && (
                <div className="logs-pagination">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={pagination.page === 1}
                        className="pagination-btn"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Назад
                    </button>

                    <div className="pagination-pages">
                        {pageNumbers.map((pageNum) => (
                            <button
                                type="button"
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`page-btn ${pagination.page === pageNum ? 'active' : ''}`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={pagination.page === pagination.total_pages}
                        className="pagination-btn"
                    >
                        Вперед
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {selectedLog && ReactDOM.createPortal(
                <DetailsModal log={selectedLog} onClose={closeDetailsModal} />,
                document.body,
            )}
        </div>
    );
}