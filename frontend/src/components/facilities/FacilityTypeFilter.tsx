import React, { useState } from 'react';
import { Building2, Factory, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Facility } from '../../types';
import './style.css';

interface FacilityTypeFilterProps {
  facilities: Facility[];
  selectedType: 'all' | number;
  onTypeChange: (type: 'all' | number) => void;
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

  const uniqueTypeIds = Array.from(new Set(facilities.map(f => f.type.id)));
  const facilityTypes = uniqueTypeIds.map(id => {
    const type = facilities.find(f => f.type.id === id)?.type;
    return type!;
  }).filter(Boolean) as {id: number, name: string, description: string}[];

  const isShdSelected = selectedType !== 'all' && 
    facilities.find(f => f.type.id === selectedType)?.type.name.toLowerCase().includes('шд');

  const getTypeCount = (typeId: 'all' | number) => {
    if (typeId === 'all') return facilities.length;
    return facilities.filter(f => f.type.id === typeId).length;
  };

  const getClassCount = (cls: '1' | '2') => {
    return facilities
      .filter(f => selectedType === 'all' || f.type.id === selectedType)
      .filter(f => f.facility_class === cls).length;
  };

  const handleTypeChange = (typeId: 'all' | number) => {
    if (typeId === selectedType && isShdSelected) {
      // Убрали переключение showClassFilters здесь
    } else {
      onTypeChange(typeId);
      const newTypeIsShd = typeId !== 'all' && 
        facilities.find(f => f.type.id === typeId)?.type.name.toLowerCase().includes('шд');
      if (!newTypeIsShd) {
        onClassChange('all');
      }
      setShowClassFilters(false); // Сбрасываем состояние при смене типа
    }
  };

  const handleClassChange = (facilityClass: 'all' | '1' | '2') => {
    onClassChange(facilityClass);
    setShowClassFilters(false);
  };

  const toggleClassFilters = () => {
    setShowClassFilters(!showClassFilters);
  };

  const shdType = facilityTypes.find(t => t.name.toLowerCase().includes('шд'));

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

        {facilityTypes.filter(t => !t.name.toLowerCase().includes('шд')).map(type => (
          <button
            key={type.id}
            onClick={() => handleTypeChange(type.id)}
            className={`facility-filter-btn ${selectedType === type.id ? 'facility-filter-station-active' : 'facility-filter-station'}`}
          >
            <div className="facility-filter-content">
              <Building2 className="facility-filter-icon" />
              <span className="facility-filter-label">{type.name}</span>
            </div>
            <span className="facility-filter-count">
              {getTypeCount(type.id)}
            </span>
          </button>
        ))}

        {shdType && (
          <div className="shd-filter-wrapper">
            <button
              onClick={() => handleTypeChange(shdType.id)}
              className={`facility-filter-btn ${selectedType === shdType.id ? 'facility-filter-shd-active' : 'facility-filter-shd'}`}
            >
              <div className="facility-filter-content">
                <Factory className="facility-filter-icon" />
                <span className="facility-filter-label">
                  {selectedType === shdType.id && selectedClass !== 'all'
                    ? `ШД (${selectedClass} класс)`
                    : 'ШД'}
                </span>
              </div>
              <div className="shd-filter-actions">
                <span className="facility-filter-count">
                  {selectedType === shdType.id && selectedClass !== 'all'
                    ? selectedClass === '1'
                      ? getClassCount('1')
                      : getClassCount('2')
                    : getTypeCount(shdType.id)}
                </span>
                {selectedType === shdType.id && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleClassFilters();
                    }}
                    className="chevron-button"
                  >
                    {showClassFilters ? (
                      <ChevronUp className="chevron-icon" />
                    ) : (
                      <ChevronDown className="chevron-icon" />
                    )}
                  </button>
                )}
              </div>
            </button>

            {selectedType === shdType.id && showClassFilters && (
              <div className="facility-class-dropdown">
                <button
                  onClick={() => handleClassChange('all')}
                  className={`facility-class-option ${selectedClass === 'all' ? 'active' : ''}`}
                >
                  <span>Итого</span>
                  <span>{getTypeCount(shdType.id)}</span>
                </button>
                <button
                  onClick={() => handleClassChange('1')}
                  className={`facility-class-option ${selectedClass === '1' ? 'active' : ''}`}
                >
                  <span>1 класс</span>
                  <span>{getClassCount('1')}</span>
                </button>
                <button
                  onClick={() => handleClassChange('2')}
                  className={`facility-class-option ${selectedClass === '2' ? 'active' : ''}`}
                >
                  <span>2 класс</span>
                  <span>{getClassCount('2')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}