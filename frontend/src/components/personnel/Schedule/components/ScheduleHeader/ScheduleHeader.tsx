// components/ScheduleHeader/ScheduleHeader.tsx
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import './ScheduleHeader.css';

interface ScheduleHeaderProps {
    onBack: () => void;
    /** Подзаголовок: например, название подразделения или «Все подразделения» */
    subtitle?: string;
    /**
     * Показывать ли кнопку «назад».
     * true  — пришли из карточки подразделения (есть куда вернуться);
     * false — переход через сайдбар или прямой заход по URL.
     */
    showBack?: boolean;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
    onBack,
    subtitle,
    showBack = true,
}) => {
    return (
        <div className="schedule-header-wrapper">
            <div className="schedule-header-left">
                {showBack && (
                    <button onClick={onBack} className="schedule-back-button">
                        <ArrowLeft className="schedule-back-icon" />
                    </button>
                )}
                <div className="schedule-title-block">
                    <h2 className="schedule-page-title">График работы сотрудников</h2>
                    {subtitle && (
                        <span className="schedule-page-subtitle">{subtitle}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleHeader;