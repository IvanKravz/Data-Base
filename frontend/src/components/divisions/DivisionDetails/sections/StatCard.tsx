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
  gradientClass: string;
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
  gradientClass,
  details,
  onClick,
  loading = false
}: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`stat-card ${gradientClass} transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="stat-card-header">
        <Icon className={`stat-card-icon ${iconColor} transition-colors duration-300`} />
        <h2 className="stat-card-title">{title}</h2>
        {loading ? (
          <CircularProgress size="30px"/>
        ) : (
          <p className="stat-card-count animate-fadeIn">
            {count !== null ? count : '—'}
          </p>
        )}
      </div>
    </div>
  );
}