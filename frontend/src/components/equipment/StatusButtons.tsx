import React from 'react';
import { Monitor, Package, AlertTriangle, Trash2, Calculator } from 'lucide-react';
import { Equipment } from '../../types';
import './style.css';

interface StatusButtonsProps {
  equipment: Equipment[];
  selectedStatus: Equipment['status'] | 'all';
  onStatusChange: (status: Equipment['status'] | 'all') => void;
}

export function StatusButtons({ 
  equipment, 
  selectedStatus,
  onStatusChange,
}: StatusButtonsProps) {
  // Подсчет количества техники по статусам
  const statusCounts = {
    'in-operation': equipment.filter(item => item.status === 'in-operation').length,
    'in-storage': equipment.filter(item => item.status === 'in-storage').length,
    'defective': equipment.filter(item => item.status === 'defective').length,
    'for-disposal': equipment.filter(item => item.status === 'for-disposal').length
  };

  const totalCount = equipment.length;

  // Конфигурация кнопок
  const buttons = [
    {
      status: 'all' as const,
      label: 'Итого',
      icon: Calculator,
      count: totalCount,
      className: 'status-button-all',
    },
    {
      status: 'in-operation' as const,
      label: 'В эксплуатации',
      icon: Monitor,
      count: statusCounts['in-operation'],
      className: 'status-button-in-operation',
    },
    {
      status: 'in-storage' as const,
      label: 'На складе',
      icon: Package,
      count: statusCounts['in-storage'],
      className: 'status-button-in-storage',
    },
    {
      status: 'defective' as const,
      label: 'Неисправно',
      icon: AlertTriangle,
      count: statusCounts['defective'],
      className: 'status-button-defective',
    },
    {
      status: 'for-disposal' as const,
      label: 'На списание',
      icon: Trash2,
      count: statusCounts['for-disposal'],
      className: 'status-button-for-disposal',
    }
  ];

  return (
    <div className="status-buttons-container">
      {buttons.map(button => (
        <button
          key={button.status}
          onClick={() => onStatusChange(button.status)}
          className={`status-button ${button.className} ${
            selectedStatus === button.status ? 'selected' : ''
          }`}
        >
          <div className="status-button-content">
            <div className="status-button-header">
              <button.icon className="status-button-icon" />
              <span className="status-button-text">
                {button.label}
              </span>
            </div>
            <div className="status-button-count">
              {button.count}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}