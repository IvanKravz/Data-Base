// FacilitySidebar.tsx
import React from 'react';
import { Facility } from '../../../types';
import {
  MapPin,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

interface FacilitySidebarProps {
  facility: Facility;
  onBack: () => void;
}

export function FacilitySidebar({ facility, onBack }: FacilitySidebarProps) {
  const getDivisionDisplay = () => {
    const divisionName = facility.division?.name || '—';
    if (facility.subdivision?.name) {
      return `${divisionName} / ${facility.subdivision.name}`;
    }
    return divisionName;
  };

  return (
    <div className="facility-details-sidebar-card">
      {/* Заголовок: кнопка назад + имя */}
      <div className="facility-details-sidebar-header">
        <div className="facility-details-sidebar-header-top">
          <button onClick={onBack} className="facility-details-btn--icon facility-details-sidebar-back">
            <ArrowLeft size={20} />
          </button>
          <div className="facility-details-sidebar-name">{facility.name}</div>
        </div>
      </div>

      {/* Группа: Расположение */}
      <div className="facility-details-sidebar-group">
        <div className="facility-details-sidebar-item">
          <KeyRound size={18} className="facility-details-sidebar-icon" />
          <div className="facility-details-sidebar-item-content">
            <span className="facility-details-sidebar-label">Подразделение</span>
            <span className="facility-details-sidebar-value">{getDivisionDisplay()}</span>
          </div>
        </div>
        <div className="facility-details-sidebar-item">
          <MapPin size={18} className="facility-details-sidebar-icon" />
          <div className="facility-details-sidebar-item-content">
            <span className="facility-details-sidebar-label">Адрес</span>
            <span className="facility-details-sidebar-value">{facility.address || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}