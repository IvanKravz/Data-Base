// components/ScheduleLoading/ScheduleLoading.tsx
import React from 'react';
import { CircularProgress } from '@mui/material';
import './ScheduleLoading.css';

const ScheduleLoading: React.FC = () => {
    return (
        <div className="schedule-loading">
            <CircularProgress />
        </div>
    );
};

export default ScheduleLoading;