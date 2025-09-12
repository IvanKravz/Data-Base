// StatCard.tsx
import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import './style.css';
import { CircularProgress } from '@mui/material';

interface StatCardProps {
  title: string;
  count: number | null;
  icon: typeof LucideIcon;
  iconColor: string;
  details: Array<{
    label: string;
    value: number;
  }>;
  onClick: () => void;
  loading?: boolean;
}

export function StatCard({
  title,
  count,
  icon: Icon,
  iconColor,
  onClick,
  loading = false
}: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`division-stat-card`}
    >
      <div className="division-stat-card-content">
        <div className="division-stat-card-header">
          <div className="division-icon-container" style={{ backgroundColor: `${iconColor}20` }}>
            <Icon className="division-stat-card-icon" style={{ color: iconColor }} />
          </div>
          <h3 className="division-stat-card-title">{title}</h3>
        </div>
        <div className="division-stat-card-value">
          {loading ? (
            <CircularProgress size={30} thickness={5} />
          ) : (
            <span className="division-count">{count !== null ? count : '—'}</span>
          )}
        </div>
      </div>
    </div>
  );
}