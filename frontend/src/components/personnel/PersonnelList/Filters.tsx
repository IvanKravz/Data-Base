// Filters.tsx - обновленный компонент
import React from 'react';
import { Filter } from 'lucide-react';
import './style.css';

interface FiltersProps {
  activeFilter: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha';
  showShaFilters: boolean;
  showOfficerFilters: boolean;
  selectedAccessClass: 'all' | '1' | '2';
  selectedOfficerFilter: 'all' | 'with_management' | 'without_management';
  onFilterClick: (filter: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha') => void;
  onShaFilterClick: (accessClass: 'all' | '1' | '2') => void;
  onOfficerFilterClick: (filter: 'all' | 'with_management' | 'without_management') => void;
  getStaffCount: (staffType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha') => { staffCount: number, actualCount: number };
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
  const renderMainFilter = (
    filterType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha',
    label: string
  ) => {
    const staffData = getStaffCount(filterType);
    
    return (
      <button
        className={`filter-button ${activeFilter === filterType ? 'active' : ''}`}
        onClick={() => onFilterClick(filterType)}
      >
        <div>
          {label}
          <div className="filter-stats">
            {filterType === 'mol' || filterType === 'sha' 
              ? staffData.actualCount 
              : `${staffData.staffCount} / ${staffData.actualCount}`
            }
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="filters-wrapper">

      <div className="filters-content">
        <div className="main-filters">
          {renderMainFilter('all', 'Все сотрудники')}
          {renderMainFilter('management', 'Руководство')}
          {renderMainFilter('officers', 'Офицеры')}
          {renderMainFilter('warrantOfficers', 'Прапорщики')}
          {renderMainFilter('civilian', 'Гражданские')}
          {renderMainFilter('mol', 'МОЛ')}
          {renderMainFilter('sha', 'ШАработники')}
        </div>

        {(showShaFilters || showOfficerFilters) && (
          <div className="additional-filters">
            {showOfficerFilters && (
              <div className="filter-group">
                <div className="filter-group-label">Тип отображения офицеров:</div>
                <div className="officer-filters">
                  <button
                    className={`officer-filter-button ${selectedOfficerFilter === 'with_management' ? 'active' : ''}`}
                    onClick={() => onOfficerFilterClick('with_management')}
                  >
                    С руководством
                  </button>
                  <button
                    className={`officer-filter-button ${selectedOfficerFilter === 'without_management' ? 'active' : ''}`}
                    onClick={() => onOfficerFilterClick('without_management')}
                  >
                    Без руководства
                  </button>
                </div>
              </div>
            )}
            {showShaFilters && (
              <div className="filter-group">
                <div className="filter-group-label">Класс доступа ША:</div>
                <div className="sha-filters">
                  <button
                    className={`sha-filter-button ${selectedAccessClass === 'all' ? 'active' : ''}`}
                    onClick={() => onShaFilterClick('all')}
                  >
                    Все ШАработники
                  </button>
                  <button
                    className={`sha-filter-button ${selectedAccessClass === '1' ? 'active' : ''}`}
                    onClick={() => onShaFilterClick('1')}
                  >
                    1 класс доступа
                  </button>
                  <button
                    className={`sha-filter-button ${selectedAccessClass === '2' ? 'active' : ''}`}
                    onClick={() => onShaFilterClick('2')}
                  >
                    2 класс доступа
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};