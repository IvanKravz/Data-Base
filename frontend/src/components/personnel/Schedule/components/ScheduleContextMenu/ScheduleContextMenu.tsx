// components/ScheduleContextMenu/ScheduleContextMenu.tsx
import React from 'react';
import { ScheduleEvent } from '../../../types';
import { X } from 'lucide-react'; // или CircleX, на ваш вкус
import './ScheduleContextMenu.css';

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    employeeId: number;
    date: Date;
}

interface ScheduleContextMenuProps {
    contextMenu: ContextMenuState | null;
    closeContextMenu: () => void;
    getEventFor: (employeeId: number, date: Date) => ScheduleEvent | undefined;
    eventLabels: Record<string, string>;
    eventColors: Record<string, string>;
    onAction: (action: 'clear' | string) => void;
}

const ScheduleContextMenu: React.FC<ScheduleContextMenuProps> = ({
    contextMenu,
    closeContextMenu,
    getEventFor,
    eventLabels,
    eventColors,
    onAction,
}) => {
    if (!contextMenu || !contextMenu.visible) return null;

    const handleCancel = () => {
        closeContextMenu();
    };

    return (
        <div
            className="context-menu"
            style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 2000,
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Если есть событие – показываем «Очистить» */}
            {getEventFor(contextMenu.employeeId, contextMenu.date) && (
                <>
                    <div className="context-menu-item" onClick={() => onAction('clear')}>
                        ✕ Очистить
                    </div>
                    <div className="context-menu-divider" />
                </>
            )}

            {/* Список доступных статусов */}
            {Object.entries(eventLabels).map(([value, label]) => (
                <div
                    key={value}
                    className="context-menu-item"
                    onClick={() => onAction(value)}
                    style={{ color: eventColors[value] ? '#000' : 'inherit' }}
                >
                    <span className="context-menu-color" style={{ backgroundColor: eventColors[value] || '#ccc' }} />
                    {label}
                </div>
            ))}

            {/* Разделитель и пункт «Отмена» с иконкой */}
            <div className="context-menu-divider" />
            <div className="context-menu-item" onClick={handleCancel}>
                <X size={16} />
                Отмена
            </div>
        </div>
    );
};

export default ScheduleContextMenu;