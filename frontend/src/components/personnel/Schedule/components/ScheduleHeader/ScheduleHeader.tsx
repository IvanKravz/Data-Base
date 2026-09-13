// components/ScheduleHeader/ScheduleHeader.tsx
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import './ScheduleHeader.css';

interface ScheduleHeaderProps {
    onBack: () => void;
    /** Подзаголовок: например, название подразделения или «Все подразделения» */
    subtitle?: string;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({ onBack, subtitle }) => {
    return (
        <div className="schedule-header-wrapper">
            <div className="schedule-header-left">
                <button onClick={onBack} className="schedule-back-button">
                    <ArrowLeft className="schedule-back-icon" />
                </button>
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