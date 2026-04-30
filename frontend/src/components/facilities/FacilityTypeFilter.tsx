// FacilityTypeFilter.tsx
import React, { useState } from 'react';
import { 
  Building2,
  ShieldX, 
  KeyRound, 
  ChevronDown, 
  ChevronUp,
  Satellite,
  Phone,
  Radio,
  Antenna,
  RadioTower,
  Home,
  Droplets
} from 'lucide-react';
import { Facility } from '../../types';
import './style.css';

interface FacilityTypeFilterProps {
  facilities: Facility[];
  selectedType: 'all' | number;
  onTypeChange: (type: 'all' | number) => void;
  selectedClass: 'all' | '1' | '2';
  onClassChange: (facilityClass: 'all' | '1' | '2') => void;
  activeTab?: 'all' | 'open' | 'closed';
}

export function FacilityTypeFilter({
  facilities,
  selectedType,
  onTypeChange,
  selectedClass,
  onClassChange,
  activeTab = 'all'
}: FacilityTypeFilterProps) {
  const [showClassFilters, setShowClassFilters] = useState(false);

  // Фильтруем facilities по активной вкладке
  const filteredFacilities = facilities.filter(facility => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return !facility.is_closed;
    if (activeTab === 'closed') return facility.is_closed;
    return true;
  });

  // Для вкладки "Открытые объекты" скрываем фильтр по классам
  const showClassFilter = activeTab !== 'open';

  const uniqueTypeIds = Array.from(new Set(filteredFacilities.map(f => f.type.id)));
  const facilityTypes = uniqueTypeIds.map(id => {
    const type = filteredFacilities.find(f => f.type.id === id)?.type;
    return type!;
  }).filter(Boolean) as {id: number, name: string, description: string}[];

  const isShdSelected = selectedType !== 'all' && 
    filteredFacilities.find(f => f.type.id === selectedType)?.type.name.toLowerCase().includes('шд');

  const getTypeCount = (typeId: 'all' | number) => {
    if (typeId === 'all') return filteredFacilities.length;
    return filteredFacilities.filter(f => f.type.id === typeId).length;
  };

  const getClassCount = (cls: '1' | '2') => {
    return filteredFacilities
      .filter(f => selectedType === 'all' || f.type.id === selectedType)
      .filter(f => f.facility_class === cls).length;
  };

  const handleTypeChange = (typeId: 'all' | number) => {
    if (typeId === selectedType && isShdSelected) {
      // Убрали переключение showClassFilters здесь
    } else {
      onTypeChange(typeId);
      const newTypeIsShd = typeId !== 'all' && 
        filteredFacilities.find(f => f.type.id === typeId)?.type.name.toLowerCase().includes('шд');
      if (!newTypeIsShd) {
        onClassChange('all');
      }
      setShowClassFilters(false);
    }
  };

  const handleClassChange = (facilityClass: 'all' | '1' | '2') => {
    onClassChange(facilityClass);
    setShowClassFilters(false);
  };

  const toggleClassFilters = () => {
    setShowClassFilters(!showClassFilters);
  };

  // Функция для получения иконки по типу объекта
  const getFacilityIcon = (typeName: string) => {
    const lowerName = typeName.toLowerCase();
    console.log('lowerName', lowerName)
    if (lowerName.includes('лаз')) return Phone;
    if (lowerName.includes('пдрц')) return RadioTower;
    if (lowerName.includes('прц')) return Antenna;
    if (lowerName.includes('спутниковая')) return Satellite;
    if (lowerName.includes('радиорелейная')) return Radio;
    if (lowerName.includes('станция')) return ShieldX;
    if (lowerName.includes('дизельная')) return Droplets;
    
    
    return Home; // Станция и другие по умолчанию
  };

  const shdType = facilityTypes.find(t => t.name.toLowerCase().includes('шд'));
  const specType = facilityTypes.find(t => t.name.toLowerCase().includes('спец.'));

  return (
    <div className="facility-filter-container">
      <div className="facility-type-grid">
        {/* Все объекты */}
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

        {/* Остальные типы объектов (кроме ШД и спец.) */}
        {facilityTypes.filter(t => 
          !t.name.toLowerCase().includes('шд') && !t.name.toLowerCase().includes('спец.')
        ).map(type => {
          const IconComponent = getFacilityIcon(type.name);
          return (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              className={`facility-filter-btn ${selectedType === type.id ? 'facility-filter-station-active' : 'facility-filter-station'}`}
            >
              <div className="facility-filter-content">
                <IconComponent className="facility-filter-icon" />
                <span className="facility-filter-label">{type.name}</span>
              </div>
              <span className="facility-filter-count">
                {getTypeCount(type.id)}
              </span>
            </button>
          );
        })}

        {/* Станция спец. связи */}
        {specType && (
          <button
            onClick={() => handleTypeChange(specType.id)}
            className={`facility-filter-btn ${selectedType === specType.id ? 'facility-filter-shd-active' : 'facility-filter-shd'}`}
          >
            <div className="facility-filter-content">
              <ShieldX className="facility-filter-icon" />
              <span className="facility-filter-label">{specType.name}</span>
            </div>
            <span className="facility-filter-count">
              {getTypeCount(specType.id)}
            </span>
          </button>
        )}

        {/* ШД с фильтром по классам */}
        {shdType && showClassFilter && (
          <div className="shd-filter-wrapper">
            <button
              onClick={() => handleTypeChange(shdType.id)}
              className={`facility-filter-btn ${selectedType === shdType.id ? 'facility-filter-shd-active' : 'facility-filter-shd'}`}
            >
              <div className="facility-filter-content">
                <KeyRound className="facility-filter-icon" />
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
                {selectedType === shdType.id && showClassFilter && (
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

            {selectedType === shdType.id && showClassFilters && showClassFilter && (
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