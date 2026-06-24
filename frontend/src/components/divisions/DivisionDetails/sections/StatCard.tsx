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
      className={`sc-root ${disabled ? 'sc-disabled' : ''}`}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="sc-header">
        <div
          className="sc-icon-box"
          style={{ backgroundColor: hexToRgba(iconColor, 0.12) }}
        >
          <Icon className="sc-icon" style={{ color: iconColor }} />
        </div>
        <h3 className="sc-title">{title}</h3>
      </div>

      <div className="sc-value">
        {loading ? (
          <CircularProgress size={32} thickness={4} />
        ) : (
          <span className="sc-count">
            {count !== null ? count.toLocaleString() : '—'}
          </span>
        )}
      </div>

      {details.length > 0 && (
        <div className="sc-details">
          {details.map((d, i) => (
            <div key={i} className="sc-detail-item">
              <span className="sc-detail-label">{d.label}</span>
              <span className="sc-detail-value">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}