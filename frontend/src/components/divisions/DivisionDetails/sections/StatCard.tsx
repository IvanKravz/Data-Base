import React, { useState, useEffect, useId, useRef, useCallback } from 'react';
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

/** Длительность анимации закрытия — должна совпадать с CSS (.sc-menu-content.closing) */
const MENU_CLOSE_MS = 200;

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

  // Стабильный id для связи кнопки и меню (aria-controls)
  const menuId = useId();

  const [menuOpen, setMenuOpen] = useState<boolean>(() => {
    if (!storageKey) return false;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  // Меню рендерится, пока идёт анимация закрытия — потом удаляется из DOM.
  // Так DOM остаётся чистым в закрытом состоянии (как в исходной версии).
  const [menuMounted, setMenuMounted] = useState<boolean>(menuOpen);
  const [closing, setClosing] = useState<boolean>(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(menuOpen));
    }
  }, [menuOpen, storageKey]);

  // Синхронизация рендеринга меню с menuOpen (с учётом анимации закрытия)
  useEffect(() => {
    if (menuOpen) {
      // Открываем: если шла анимация закрытия — отменяем её
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setClosing(false);
      setMenuMounted(true);
    } else if (menuMounted) {
      // Закрываем: сначала проигрываем анимацию, потом размонтируем
      setClosing(true);
      closeTimer.current = window.setTimeout(() => {
        setMenuMounted(false);
        setClosing(false);
        closeTimer.current = null;
      }, MENU_CLOSE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  // Чистим таймер при размонтировании
  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (!disabled) onClick();
  };

  const toggleMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen((v) => !v);
    },
    [],
  );

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
            aria-controls={menuId}
            aria-label={menuOpen ? 'Скрыть меню' : 'Показать меню'}
          >
            <ChevronDown size={16} className="sc-menu-toggle-icon" />
          </button>
        )}
      </div>

      {hasMenu && menuMounted && (
        <div
          id={menuId}
          role="region"
          aria-hidden={!menuOpen}
          className={`sc-menu-content ${closing ? 'closing' : ''}`}
        >
          {validChildren}
        </div>
      )}
    </div>
  );
}