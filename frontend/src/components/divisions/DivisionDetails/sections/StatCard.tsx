import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { CircularProgress } from '@mui/material';
import './StatCard.css';

interface StatCardProps {
  title: string;
  count: number | null;
  icon: typeof LucideIcon;
  iconColor: string;
  details: Array<{ label: string; value: number }>;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** Преобразует HEX-цвет в rgba с заданной прозрачностью */
const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function StatCard({
  title,
  count,
  icon: Icon,
  iconColor,
  details = [],
  onClick,
  loading = false,
  disabled = false,
}: StatCardProps) {
  const handleClick = () => {
    if (!disabled) onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`stat-card ${disabled ? 'stat-card--disabled' : ''}`}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="stat-card__header">
        <div
          className="stat-card__icon-box"
          style={{ backgroundColor: hexToRgba(iconColor, 0.12) }}
        >
          <Icon className="stat-card__icon" style={{ color: iconColor }} />
        </div>
        <h3 className="stat-card__title">{title}</h3>
      </div>

      <div className="stat-card__value">
        {loading ? (
          <CircularProgress size={32} thickness={4} />
        ) : (
          <span className="stat-card__count">
            {count !== null ? count.toLocaleString() : '—'}
          </span>
        )}
      </div>

      {details.length > 0 && (
        <div className="stat-card__details">
          {details.map((d, i) => (
            <div key={i} className="stat-card__detail-item">
              <span className="stat-card__detail-label">{d.label}</span>
              <span className="stat-card__detail-value">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}