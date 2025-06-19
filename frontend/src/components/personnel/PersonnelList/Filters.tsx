import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import './style.css'

interface FiltersProps {
  activeFilter: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha' | 'shaOneClass' | 'shaTwoClass';
  showShaFilters: boolean;
  showOfficerFilters: boolean;
  selectedAccessClass: 'all' | '1' | '2';
  selectedOfficerFilter: 'all' | 'with_management' | 'without_management';
  onFilterClick: (filter: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha' | 'shaOneClass' | 'shaTwoClass') => void;
  onShaFilterClick: (accessClass: 'all' | '1' | '2') => void;
  onOfficerFilterClick: (filter: 'all' | 'with_management' | 'without_management') => void;
  getStaffCount: (staffType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha' | 'shaOneClass' | 'shaTwoClass') => { staffCount: number, actualCount: number };
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
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const officersData = getStaffCount('officers');
  const managementData = getStaffCount('management');

  const officersWithoutManagement = {
    staffCount: Math.max(0, officersData.staffCount - managementData.staffCount),
    actualCount: Math.max(0, officersData.actualCount - managementData.actualCount)
  };

  const handleExpandClick = (filterType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFilter(expandedFilter === filterType ? null : filterType);
  };

  const handleFilterClick = (filterType: string) => {
    onFilterClick(filterType as any);
    setExpandedFilter(null); // Скрываем детали при переключении фильтра
  };

  const toggleFiltersVisibility = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  const renderMainFilter = (
    filterType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha',
    label: string,
    hasDetails: boolean = false
  ) => {
    const staffData = getStaffCount(filterType);
    return (
      <div className="filter-button-wrapper-personnel">
        <button
          className={`filter-button-personnel ${activeFilter === filterType ? 'active' : ''}`}
          onClick={() => handleFilterClick(filterType)}
        >
          <span className="filter-button-label-personnel">{label}</span>
        </button>

        {hasDetails && (
          <>
            <button
              className="expand-button"
              onClick={(e) => handleExpandClick(filterType, e)}
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedFilter === filterType ? 'rotate-180' : ''}`}
              />
            </button>

            <div className={`filter-details ${expandedFilter === filterType ? 'active' : ''}`}>
              <div className="details-content">
                <div className="details-row">
                  <span className="details-label">По штату:</span>
                  <span className="details-value">{Math.max(0, staffData.staffCount)}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">По списку:</span>
                  <span className="details-value">{Math.max(0, staffData.actualCount)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="filters-wrapper">
      <div className="filter-toggle-container">
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
      </div>

      {isFiltersVisible && (
        <div className="filters-content">
          <div className="main-filters">
            {renderMainFilter('all', 'Итого')}
            {renderMainFilter('management', 'Руководство', true)}
            {renderMainFilter('officers', 'Офицеры', true)}
            {renderMainFilter('warrantOfficers', 'Прапорщики', true)}
            {renderMainFilter('civilian', 'Гражд. персонал', true)}
            {renderMainFilter('mol', 'Матер. отв. лица')}
            {renderMainFilter('sha', 'Шаработники')}
          </div>

          {(showShaFilters || showOfficerFilters) && (
            <div className="additional-filters-container">
              <div className="additional-filters">
                {showOfficerFilters && (
                  <div className="officer-filters">
                    {['with_management', 'without_management'].map((filter) => {
                      const data = filter === 'with_management'
                        ? getStaffCount('officers')
                        : officersWithoutManagement;
                      return (
                        <div key={filter} className="filter-button-wrapper">
                          <button
                            className={`sha-filter-button ${selectedOfficerFilter === filter ? 'active' : ''}`}
                            onClick={() => {
                              onOfficerFilterClick(filter as any);
                              setExpandedFilter(null);
                            }}
                          >
                            {filter === 'with_management' ? 'С руководством' : 'Без руководства'}
                            <span className="count-badge">{data.actualCount}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {showShaFilters && (
                  <div className="sha-filters">
                    {['all', '1', '2'].map((accessClass) => {
                      const data = accessClass === 'all'
                        ? getStaffCount('sha')
                        : getStaffCount(accessClass === '1' ? 'shaOneClass' : 'shaTwoClass');
                      return (
                        <div key={accessClass} className="filter-button-wrapper-personnel">
                          <button
                            className={`sha-filter-button ${selectedAccessClass === accessClass ? 'active' : ''}`}
                            onClick={() => {
                              onShaFilterClick(accessClass as any);
                              setExpandedFilter(null);
                            }}
                          >
                            {accessClass === 'all' ? 'Итого' : `${accessClass} класс`}
                            <span className="count-badge">{data.actualCount}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};