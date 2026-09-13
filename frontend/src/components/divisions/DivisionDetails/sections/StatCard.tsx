import React, { useState, useEffect } from 'react';
import { DivideIcon as LucideIcon, ChevronDown } from 'lucide-react';
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
  /** Пункты раскрывающегося меню (schedule-link-card и т.п.) */
  children?: React.ReactNode;
  /** Ключ для сохранения состояния меню в localStorage */
  storageKey?: string;
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
  children,
  storageKey,
}: StatCardProps) {
  const validChildren = React.Children.toArray(children);
  const hasMenu = validChildren.length > 0;

  const [menuOpen, setMenuOpen] = useState<boolean>(() => {
    if (!storageKey) return false;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(menuOpen));
    }
  }, [menuOpen, storageKey]);

  const handleClick = () => {
    if (!disabled) onClick();
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  return (
    <div className="sc-wrapper">
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

        {hasMenu && (
          <button
            type="button"
            className={`sc-menu-toggle ${menuOpen ? 'expanded' : ''}`}
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Скрыть меню' : 'Показать меню'}
          >
            <ChevronDown
              size={16}
              className={`sc-menu-toggle-icon ${menuOpen ? 'expanded' : ''}`}
            />
          </button>
        )}
      </div>

      {hasMenu && menuOpen && (
        <div className="sc-menu-content">{validChildren}</div>
      )}
    </div>
  );
}