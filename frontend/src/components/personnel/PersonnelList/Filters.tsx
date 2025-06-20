import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import './style.css'

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
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const toggleFiltersVisibility = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  const renderMainFilter = (
    filterType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha',
    label: string
  ) => {
    return (
      <button
        className={`filter-button ${activeFilter === filterType ? 'active' : ''}`}
        onClick={() => onFilterClick(filterType)}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="filters-wrapper">
      <button
        className="filter-toggle-button"
        onClick={toggleFiltersVisibility}
      >
        <Filter size={18} />
        <span>Фильтр</span>
        {isFiltersVisible ? (
          <ChevronUp size={18} className="ml-auto" />
        ) : (
          <ChevronDown size={18} className="ml-auto" />
        )}
      </button>

      {isFiltersVisible && (
        <div className="filters-content">
          <div className="main-filters">
            {renderMainFilter('all', 'Все')}
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
              )}
              {showShaFilters && (
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
                    1 класс
                  </button>
                  <button
                    className={`sha-filter-button ${selectedAccessClass === '2' ? 'active' : ''}`}
                    onClick={() => onShaFilterClick('2')}
                  >
                    2 класс
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};