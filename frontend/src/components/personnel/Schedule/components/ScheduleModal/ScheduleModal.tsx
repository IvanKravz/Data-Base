// components/ScheduleModal/ScheduleModal.tsx
import React from 'react';
import { Employee, ScheduleEvent } from '../../../types';
import './ScheduleModal.css';

interface BulkRange {
    type: 'dates' | 'employees';
    employeeId?: number;
    employeeIds?: number[];
    startDate?: Date;
    endDate?: Date;
    date?: Date;
}

interface ScheduleModalProps {
    modalOpen: boolean;
    closeModal: () => void;
    selectedEmployee: Employee | null;
    selectedDate: Date | null;
    selectedEventType: string;
    setSelectedEventType: (value: string) => void;
    comment: string;
    setComment: (value: string) => void;
    existingEvent: ScheduleEvent | null;
    bulkRange: BulkRange | null;
    bulkCount: number | null;
    onSave: () => void;
    onDelete: () => void;
    onClearRange?: () => void;
    hasEventsInRange?: boolean; // новый проп
    eventLabels: Record<string, string>;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
    modalOpen,
    closeModal,
    selectedEmployee,
    selectedDate,
    selectedEventType,
    setSelectedEventType,
    comment,
    setComment,
    existingEvent,
    bulkRange,
    bulkCount,
    onSave,
    onDelete,
    onClearRange,
    hasEventsInRange = false,
    eventLabels,
}) => {
    if (!modalOpen) return null;

    // Форматирование дат для заголовка
    const formatDate = (date: Date) =>
        date.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });

    let startDateStr = '';
    let endDateStr = '';
    let employeeName = selectedEmployee?.full_name || '';
    let employeesDateStr = '';
    let employeesCount = 0;

    if (bulkRange?.type === 'dates' && bulkRange.startDate && bulkRange.endDate && selectedEmployee) {
        startDateStr = formatDate(bulkRange.startDate);
        endDateStr = formatDate(bulkRange.endDate);
    }

    if (bulkRange?.type === 'employees' && bulkRange.date) {
        employeesDateStr = formatDate(bulkRange.date);
        employeesCount = bulkCount ?? bulkRange.employeeIds?.length ?? 0;
    }

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    {bulkRange ? (
                        bulkRange.type === 'dates' && startDateStr && endDateStr && selectedEmployee ? (
                            <>
                                <span className="title-line">
                                    Диапазон дат для <span className="employee-name">{employeeName}</span>
                                </span>
                                <span className="title-line">
                                    с {startDateStr} по {endDateStr}
                                </span>
                            </>
                        ) : bulkRange.type === 'employees' && employeesDateStr ? (
                            <>
                                <span className="title-line">
                                    Диапазон сотрудников на {employeesDateStr}
                                </span>
                                <span className="title-line">
                                    ({employeesCount} сотрудников)
                                </span>
                            </>
                        ) : (
                            <span className="title-line">Массовое редактирование</span>
                        )
                    ) : (
                        <>
                            <span className="employee-name">{employeeName}</span>
                            <span className="title-line">
                                — {selectedDate ? formatDate(selectedDate) : ''}
                            </span>
                        </>
                    )}
                </div>

                <div className="modal-body">
                    <label>Событие:</label>
                    <select value={selectedEventType} onChange={(e) => setSelectedEventType(e.target.value)}>
                        <option value="">— Выберите —</option>
                        {Object.entries(eventLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <label>Комментарий:</label>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
                </div>

                <div className="modal-actions">
                    {/* Кнопка "Очистить" показывается только если в диапазоне есть события */}
                    {bulkRange && onClearRange && hasEventsInRange && (
                        <button onClick={onClearRange} className="clear-btn">
                            Очистить
                        </button>
                    )}
                    <button onClick={onSave} disabled={!selectedEventType} className="primary-btn">
                        {bulkRange ? 'Применить ко всем' : 'Сохранить'}
                    </button>
                    {!bulkRange && existingEvent && (
                        <button onClick={onDelete} className="delete-btn">Удалить</button>
                    )}
                    <button onClick={closeModal} className="cancel-btn">Отмена</button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;