import React, { useState } from 'react';
import { Building2, Factory, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Facility } from '../../types';
import './style.css';

interface FacilityTypeFilterProps {
  facilities: Facility[];
  selectedType: 'all' | 'station' | 'shd';
  onTypeChange: (type: 'all' | 'station' | 'shd') => void;
  selectedClass: 'all' | '1' | '2';
  onClassChange: (facilityClass: 'all' | '1' | '2') => void;
}

export function FacilityTypeFilter({
  facilities,
  selectedType,
  onTypeChange,
  selectedClass,
  onClassChange
}: FacilityTypeFilterProps) {
  const [showClassFilters, setShowClassFilters] = useState(false);

  // Получаем только объекты типа ШД
  const shdFacilities = facilities.filter(f => f.type === 'shd');

  const getTypeCount = (type: 'all' | 'station' | 'shd') => {
    if (type === 'all') return facilities.length;
    return facilities.filter(f => f.type === type).length;
  };

  // Количество всех ШД объектов (для кнопки "Итого")
  const getTotalShdCount = () => {
    return shdFacilities.length;
  };

  // Количество ШД объектов 1 класса
  const getShdClass1Count = () => {
    return shdFacilities.filter(f => f.facility_class === '1').length;
  };

  // Количество ШД объектов 2 класса
  const getShdClass2Count = () => {
    return shdFacilities.filter(f => f.facility_class === '2').length;
  };

  const handleTypeChange = (type: 'all' | 'station' | 'shd') => {
    onTypeChange(type);
    // Не сбрасываем класс при переключении типа, если выбираем ШД
    if (type !== 'shd') {
      onClassChange('all');
    }
    // Переключаем видимость только при выборе ШД
    if (type === 'shd') {
      setShowClassFilters(!showClassFilters);
    } else {
      setShowClassFilters(false);
    }
  };

  const handleClassChange = (facilityClass: 'all' | '1' | '2') => {
    onClassChange(facilityClass);
    setShowClassFilters(false); // Закрываем меню после выбора класса
  };

  return (
    <div className="facility-filter-container">
      <div className="facility-type-grid">
        <button
          onClick={() => handleTypeChange('all')}
          className={`facility-filter-btn ${selectedType === 'all' ? 'facility-filter-all-active' : 'facility-filter-all'}`}
        >
          <div className="facility-filter-content">
            <Building2 className="facility-filter-icon" />
            <span className="facility-filter-label">Все объекты</span>
          </div>
          <span className="facility-filter-count">
            {getTypeCount('all')}
          </span>
        </button>

        <button
          onClick={() => handleTypeChange('station')}
          className={`facility-filter-btn ${selectedType === 'station' ? 'facility-filter-station-active' : 'facility-filter-station'}`}
        >
          <div className="facility-filter-content">
            <Building2 className="facility-filter-icon" />
            <span className="facility-filter-label">Станция</span>
          </div>
          <span className="facility-filter-count">
            {getTypeCount('station')}
          </span>
        </button>

        <div className="shd-filter-wrapper">
          <button
            onClick={() => handleTypeChange('shd')}
            className={`facility-filter-btn ${selectedType === 'shd' ? 'facility-filter-shd-active' : 'facility-filter-shd'}`}
          >
            <div className="facility-filter-content">
              <Factory className="facility-filter-icon" />
              <span className="facility-filter-label">
                {selectedType === 'shd' && selectedClass !== 'all'
                  ? `ШД (${selectedClass} класс)`
                  : 'ШД'}
              </span>
            </div>
            <div className="shd-filter-actions">
              <span className="facility-filter-count">
                {selectedType === 'shd' && selectedClass !== 'all'
                  ? selectedClass === '1'
                    ? getShdClass1Count()
                    : getShdClass2Count()
                  : getTypeCount('shd')}
              </span>
              {selectedType === 'shd' && (
                showClassFilters ? (
                  <ChevronUp className="chevron-icon" />
                ) : (
                  <ChevronDown className="chevron-icon" />
                )
              )}
            </div>
          </button>

          {selectedType === 'shd' && showClassFilters && (
            <div className="facility-class-grid">
              <button
                onClick={() => handleClassChange('all')}
                className={`facility-filter-btn ${selectedClass === 'all' ? 'facility-class-all-active' : 'facility-class-all'}`}
              >
                <div className="facility-filter-content">
                  <Star className="facility-filter-icon" />
                  <span className="facility-filter-label">Итого</span>
                </div>
                <span className="facility-filter-count">
                  {getTotalShdCount()}
                </span>
              </button>

              <button
                onClick={() => handleClassChange('1')}
                className={`facility-filter-btn ${selectedClass === '1' ? 'facility-class-1-active' : 'facility-class-1'}`}
              >
                <div className="facility-filter-content">
                  <Star className="facility-filter-icon" />
                  <span className="facility-filter-label">1 класс</span>
                </div>
                <span className="facility-filter-count">
                  {getShdClass1Count()}
                </span>
              </button>

              <button
                onClick={() => handleClassChange('2')}
                className={`facility-filter-btn ${selectedClass === '2' ? 'facility-class-2-active' : 'facility-class-2'}`}
              >
                <div className="facility-filter-content">
                  <Star className="facility-filter-icon" />
                  <span className="facility-filter-label">2 класс</span>
                </div>
                <span className="facility-filter-count">
                  {getShdClass2Count()}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}