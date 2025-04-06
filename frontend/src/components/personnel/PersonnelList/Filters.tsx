import React from 'react';
import { ProgressCircle } from './ProgressCircle';
import { Trash2, Shield, ClipboardList, CircleUserRound } from 'lucide-react';

interface FiltersProps {
  activeFilter: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha' | 'shaOneClass' | 'shaTwoClass';
  showShaFilters: boolean;
  showOfficerFilters: boolean;
  selectedAccessClass: 'all' | '1' | '2';
  selectedOfficerFilter: 'all' | 'with_management' | 'without_management';
  onFilterClick: (filter: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha'| 'shaOneClass' | 'shaTwoClass') => void;
  onShaFilterClick: (accessClass: 'all' | '1' | '2') => void;
  onOfficerFilterClick: (filter: 'all' | 'with_management' | 'without_management') => void;
  getStaffCount: (staffType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha'| 'shaOneClass' | 'shaTwoClass') => { staffCount: number, actualCount: number };
}

export const Filters = ({
  activeFilter,
  showShaFilters,
  showOfficerFilters,
  selectedAccessClass,
  selectedOfficerFilter,
  onFilterClick,
  onShaFilterClick,
  onOfficerFilterClick,
  getStaffCount,
}: FiltersProps) => {
  const officersData = getStaffCount('officers');

  const officersWithoutManagement = {
    staffCount: officersData.staffCount,
    actualCount: officersData.actualCount - getStaffCount('management').actualCount
  };

  return (
    <div className="personnel-list-filters">
      {/* Основные кнопки фильтров */}
      <button
        className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
        onClick={() => onFilterClick('all')}
      >
        Итого
        <ProgressCircle {...getStaffCount('all')} />
      </button>
      <button
        className={`filter-button ${activeFilter === 'management' ? 'active' : ''}`}
        onClick={() => onFilterClick('management')}
      >
        Руководство
        <ProgressCircle {...getStaffCount('management')} />
      </button>
      <button
        className={`filter-button ${activeFilter === 'officers' ? 'active' : ''}`}
        onClick={() => onFilterClick('officers')}
      >
        Офицеры
        <ProgressCircle {...getStaffCount('officers')} />
      </button>
      <button
        className={`filter-button ${activeFilter === 'warrantOfficers' ? 'active' : ''}`}
        onClick={() => onFilterClick('warrantOfficers')}
      >
        Прапорщики
        <ProgressCircle {...getStaffCount('warrantOfficers')} />
      </button>
      <button
        className={`filter-button ${activeFilter === 'civilian' ? 'active' : ''}`}
        onClick={() => onFilterClick('civilian')}
      >
        Гражданский персонал
        <ProgressCircle {...getStaffCount('civilian')} />
      </button>
      <button
        className={`filter-button ${activeFilter === 'mol' ? 'active' : ''}`}
        onClick={() => onFilterClick('mol')}
      >
        МОЛ 
        <ProgressCircle {...getStaffCount('mol')} showOnlyActual noActiveColor />
      </button>
      <button
        className={`filter-button ${activeFilter === 'sha' ? 'active' : ''}`}
        onClick={() => onFilterClick('sha')}
      >
        Шаработники
        <ProgressCircle {...getStaffCount('sha')} showOnlyActual noActiveColor />
      </button>

      {/* Дополнительные фильтры */}
      {(showShaFilters || showOfficerFilters) && (
        <div className="additional-filters-container">
          <div className="additional-filters">
            {showOfficerFilters && (
              <div className="officer-filters">
                <button
                  className={`officer-filter-button ${selectedOfficerFilter === 'with_management' ? 'active' : ''}`}
                  onClick={() => onOfficerFilterClick('with_management')}
                >
                  С руководством
                  <ProgressCircle {...getStaffCount('officers')} showOnlyActual />
                </button>
                <button
                  className={`officer-filter-button ${selectedOfficerFilter === 'without_management' ? 'active' : ''}`}
                  onClick={() => onOfficerFilterClick('without_management')}
                >
                  Без руководства
                  <ProgressCircle {...officersWithoutManagement} showOnlyActual />
                </button>
              </div>
            )}
            {showShaFilters && (
              <div className="sha-filters">
                <button
                  className={`sha-filter-button ${selectedAccessClass === 'all' ? 'active' : ''}`}
                  onClick={() => onShaFilterClick('all')}
                >
                  Итого
                </button>
                <button
                  className={`sha-filter-button ${selectedAccessClass === '1' ? 'active' : ''}`}
                  onClick={() => onShaFilterClick('1')}
                >
                  1 класс
                  <ProgressCircle {...getStaffCount('shaOneClass')} showOnlyActual noActiveColor />
                </button>
                <button
                  className={`sha-filter-button ${selectedAccessClass === '2' ? 'active' : ''}`}
                  onClick={() => onShaFilterClick('2')}
                >
                  2 класс
                  <ProgressCircle {...getStaffCount('shaTwoClass')} showOnlyActual noActiveColor />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};