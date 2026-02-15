// components/DetailsModal.tsx
import React, { useEffect, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { ActionLog } from '../../../api/logs';
import '../styles/DetailsModal.css'; 

interface DetailsModalProps {
    log: ActionLog;
    onClose: () => void;
}

export function DetailsModal({ log, onClose }: DetailsModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = React.useState(false);

    // Закрытие по Escape и клику вне модалки
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const copyDetails = () => {
        const text = typeof log.details === 'object'
            ? JSON.stringify(log.details, null, 2)
            : log.details || '';
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" ref={modalRef}>
                <div className="modal-header">
                    <h3 className="modal-title">Детали действия</h3>
                    <button className="modal-close" onClick={onClose} title="Закрыть">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="modal-info-grid">
                        <div className="info-item">
                            <span className="info-label">Время:</span>
                            <span className="info-value">{formatDate(log.created_at)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Действие:</span>
                            <span className="info-value">{log.action_display}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Модуль:</span>
                            <span className="info-value">{log.module_display}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Объект:</span>
                            <span className="info-value">{log.object_name || '—'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Тип объекта:</span>
                            <span className="info-value">{log.model_name || '—'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">IP адрес:</span>
                            <span className="info-value">{log.ip_address || '—'}</span>
                        </div>
                    </div>

                    <div className="details-section">
                        <div className="details-section-header">
                            <span className="details-section-title">Подробные данные</span>
                            <button
                                className={`copy-button ${copied ? 'copied' : ''}`}
                                onClick={copyDetails}
                                title="Копировать в буфер"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                            </button>
                        </div>
                        <div className="details-content-full">
                            {log.details && typeof log.details === 'object' ? (
                                <pre className="details-json-full">
                                    {JSON.stringify(log.details, null, 2)}
                                </pre>
                            ) : (
                                <div className="details-text-full">
                                    {log.details || 'Нет дополнительных данных'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}