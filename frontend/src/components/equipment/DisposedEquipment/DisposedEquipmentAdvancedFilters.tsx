// components/equipment/DisposedEquipment/DisposedEquipmentAdvancedFilters.tsx
import React, { useState, useMemo, useRef } from 'react';
import { SearchField } from '../forms/AdvancedSearchModal/sections/SearchField';
import { DateField } from '../forms/AdvancedSearchModal/sections/DateField';
import { SuggestionInput } from './SuggestionInput';
import { Cpu, User, CalendarDays, FileText } from 'lucide-react';
import './styles/DisposedEquipmentAdvancedFilters.css';

interface InterestOrgan {
  id: string;
  name: string;
}

export interface DisposalAdvancedFilters {
  names: string[];
  serialNumbers: string[];
  inventoryNumbers: string[];
  manufacturingDateFrom: string;
  manufacturingDateTo: string;
  exploitationDateFrom: string;
  exploitationDateTo: string;
  assignedTo: string[];
  interestOrgans: InterestOrgan[];
  actNumber: string;
  actDateFrom: string;
  actDateTo: string;
  certNumber: string;
  certDateFrom: string;
  certDateTo: string;
}

interface DisposedEquipmentAdvancedFiltersProps {
  filters: DisposalAdvancedFilters;
  onFilterChange: <K extends keyof DisposalAdvancedFilters>(
    filterType: K,
    values: DisposalAdvancedFilters[K]
  ) => void;
  equipment: any[];
}

export function DisposedEquipmentAdvancedFilters({
  filters,
  onFilterChange,
  equipment
}: DisposedEquipmentAdvancedFiltersProps) {
  const [currentInputs, setCurrentInputs] = useState({
    names: '',
    serialNumbers: '',
    inventoryNumbers: '',
    assignedTo: '',
    interestOrgans: '',
    actNumber: '',
    certNumber: ''
  });

  // Подсказки для всех полей
  const suggestions = useMemo(() => {
    const names = new Set<string>();
    const serialNumbers = new Set<string>();
    const inventoryNumbers = new Set<string>();
    const assignedTo = new Set<string>();
    const interestOrgans = new Set<string>();
    const actNumbers = new Set<string>();
    const certNumbers = new Set<string>();

    equipment.forEach((item: any) => {
      if (item.name) names.add(item.name);
      if (item.serial_number) serialNumbers.add(item.serial_number);
      if (item.inventory_number) inventoryNumbers.add(item.inventory_number);
      if (item.assigned_to?.full_name) assignedTo.add(item.assigned_to.full_name);
      if (item.interest_organ?.name) interestOrgans.add(item.interest_organ.name);
      if (item.disposal_info?.actNumber) actNumbers.add(item.disposal_info.actNumber);
      if (item.disposal_info?.disposalCertNumber) certNumbers.add(item.disposal_info.disposalCertNumber);
    });

    return {
      names: Array.from(names).sort(),
      serialNumbers: Array.from(serialNumbers).sort(),
      inventoryNumbers: Array.from(inventoryNumbers).sort(),
      assignedTo: Array.from(assignedTo).sort(),
      interestOrgans: Array.from(interestOrgans).sort(),
      actNumbers: Array.from(actNumbers).sort(),
      certNumbers: Array.from(certNumbers).sort()
    };
  }, [equipment]);

  const getInterestOrganByName = (name: string): InterestOrgan | undefined => {
    for (const item of equipment) {
      if (item.interest_organ?.name === name) {
        return item.interest_organ;
      }
    }
    return undefined;
  };

  const handleInputChange = (type: string, value: string) => {
    setCurrentInputs(prev => ({ ...prev, [type]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: string) => {
    if (e.key === 'Enter' && currentInputs[type as keyof typeof currentInputs].trim()) {
      const value = currentInputs[type as keyof typeof currentInputs].trim();

      if (type === 'interestOrgans') {
        const organ = getInterestOrganByName(value);
        if (organ) {
          const newValues = [...filters.interestOrgans, organ];
          onFilterChange('interestOrgans', newValues);
        }
      } else if (type === 'names') {
        const newValues = [...filters.names, value];
        onFilterChange('names', newValues);
      } else if (type === 'serialNumbers') {
        const newValues = [...filters.serialNumbers, value];
        onFilterChange('serialNumbers', newValues);
      } else if (type === 'inventoryNumbers') {
        const newValues = [...filters.inventoryNumbers, value];
        onFilterChange('inventoryNumbers', newValues);
      } else if (type === 'assignedTo') {
        const newValues = [...filters.assignedTo, value];
        onFilterChange('assignedTo', newValues);
      } else if (type === 'actNumber') {
        onFilterChange('actNumber', value);
      } else if (type === 'certNumber') {
        onFilterChange('certNumber', value);
      }

      setCurrentInputs(prev => ({ ...prev, [type]: '' }));
    }
  };

  const removeFilter = (filterType: keyof DisposalAdvancedFilters, index?: number) => {
    if (
      filterType === 'manufacturingDateFrom' || filterType === 'manufacturingDateTo' ||
      filterType === 'exploitationDateFrom' || filterType === 'exploitationDateTo' ||
      filterType === 'actDateFrom' || filterType === 'actDateTo' ||
      filterType === 'certDateFrom' || filterType === 'certDateTo'
    ) {
      onFilterChange(filterType, '' as any);
    } else if (filterType === 'actNumber' || filterType === 'certNumber') {
      onFilterChange(filterType, '');
    } else if (index !== undefined) {
      const current = filters[filterType] as any[];
      const newValues = [...current];
      newValues.splice(index, 1);
      onFilterChange(filterType, newValues as any);
    }
  };

  const handleSuggestionSelect = (type: string, suggestion: string) => {
    if (type === 'interestOrgans') {
      const organ = getInterestOrganByName(suggestion);
      if (organ) {
        const newValues = [...filters.interestOrgans, organ];
        onFilterChange('interestOrgans', newValues);
      }
    } else if (type === 'actNumber') {
      onFilterChange('actNumber', suggestion);
    } else if (type === 'certNumber') {
      onFilterChange('certNumber', suggestion);
    } else {
      const key = type as keyof Pick<DisposalAdvancedFilters, 'names' | 'serialNumbers' | 'inventoryNumbers' | 'assignedTo'>;
      const newValues = [...filters[key], suggestion];
      onFilterChange(key, newValues);
    }
    setCurrentInputs(prev => ({ ...prev, [type]: '' }));
  };

  // Рефы для полей
  const inputRefs = {
    names: useRef<HTMLInputElement>(null),
    serialNumbers: useRef<HTMLInputElement>(null),
    inventoryNumbers: useRef<HTMLInputElement>(null),
    assignedTo: useRef<HTMLInputElement>(null),
    interestOrgans: useRef<HTMLInputElement>(null),
    actNumber: useRef<HTMLInputElement>(null),
    certNumber: useRef<HTMLInputElement>(null)
  };

  // Общий объект filters для SearchField
  const sharedFilters = {
    names: filters.names,
    serialNumbers: filters.serialNumbers,
    inventoryNumbers: filters.inventoryNumbers,
    assignedTo: filters.assignedTo,
    interestOrgans: filters.interestOrgans.map(o => o.name)
  };

  return (
    <div className="deaf-container">
      <div className="deaf-groups-row">
        {/* ===== Блок 1: Идентификация ===== */}
        <div className="deaf-group">
          <div className="deaf-group-header">
            <Cpu size={14} className="deaf-group-icon" />
            <span className="deaf-group-title">Идентификация</span>
          </div>
          <div className="deaf-fields-grid">
            <SearchField
              type="names"
              label="Название"
              placeholder="Введите название"
              currentInputs={currentInputs}
              filters={sharedFilters}
              suggestions={suggestions}
              onInputChange={handleInputChange}
              onFocus={() => {}}
              onBlur={() => {}}
              onKeyPress={handleKeyPress}
              onRemoveFilter={(type, index) => removeFilter(type as keyof DisposalAdvancedFilters, index)}
              onSuggestionSelect={(suggestion) => handleSuggestionSelect('names', suggestion)}
              inputRef={inputRefs.names}
            />
            <SearchField
              type="serialNumbers"
              label="Серийный номер"
              placeholder="Введите серийный номер"
              currentInputs={currentInputs}
              filters={sharedFilters}
              suggestions={suggestions}
              onInputChange={handleInputChange}
              onFocus={() => {}}
              onBlur={() => {}}
              onKeyPress={handleKeyPress}
              onRemoveFilter={(type, index) => removeFilter(type as keyof DisposalAdvancedFilters, index)}
              onSuggestionSelect={(suggestion) => handleSuggestionSelect('serialNumbers', suggestion)}
              inputRef={inputRefs.serialNumbers}
            />
            <SearchField
              type="inventoryNumbers"
              label="Инвентарный номер"
              placeholder="Введите инвентарный номер"
              currentInputs={currentInputs}
              filters={sharedFilters}
              suggestions={suggestions}
              onInputChange={handleInputChange}
              onFocus={() => {}}
              onBlur={() => {}}
              onKeyPress={handleKeyPress}
              onRemoveFilter={(type, index) => removeFilter(type as keyof DisposalAdvancedFilters, index)}
              onSuggestionSelect={(suggestion) => handleSuggestionSelect('inventoryNumbers', suggestion)}
              inputRef={inputRefs.inventoryNumbers}
            />
          </div>
        </div>

        {/* ===== Блок 2: Принадлежность ===== */}
        <div className="deaf-group">
          <div className="deaf-group-header">
            <User size={14} className="deaf-group-icon" />
            <span className="deaf-group-title">Принадлежность</span>
          </div>
          <div className="deaf-fields-grid">
            <SearchField
              type="assignedTo"
              label="Закреплено за"
              placeholder="Введите ФИО сотрудника"
              currentInputs={currentInputs}
              filters={sharedFilters}
              suggestions={suggestions}
              onInputChange={handleInputChange}
              onFocus={() => {}}
              onBlur={() => {}}
              onKeyPress={handleKeyPress}
              onRemoveFilter={(type, index) => removeFilter(type as keyof DisposalAdvancedFilters, index)}
              onSuggestionSelect={(suggestion) => handleSuggestionSelect('assignedTo', suggestion)}
              inputRef={inputRefs.assignedTo}
            />
            <SearchField
              type="interestOrgans"
              label="В чьих интересах"
              placeholder="Введите организацию"
              currentInputs={currentInputs}
              filters={sharedFilters}
              suggestions={suggestions}
              onInputChange={handleInputChange}
              onFocus={() => {}}
              onBlur={() => {}}
              onKeyPress={handleKeyPress}
              onRemoveFilter={(type, index) => removeFilter(type as keyof DisposalAdvancedFilters, index)}
              onSuggestionSelect={(suggestion) => handleSuggestionSelect('interestOrgans', suggestion)}
              inputRef={inputRefs.interestOrgans}
            />
          </div>
        </div>

        {/* ===== Блок 3: Даты ===== */}
        <div className="deaf-group">
          <div className="deaf-group-header">
            <CalendarDays size={14} className="deaf-group-icon" />
            <span className="deaf-group-title">Даты</span>
          </div>
          <div className="deaf-fields-grid">
            <DateField
              label="Производство (от)"
              value={filters.manufacturingDateFrom}
              onChange={(value) => onFilterChange('manufacturingDateFrom', value)}
              onRemove={() => removeFilter('manufacturingDateFrom')}
            />
            <DateField
              label="Производство (до)"
              value={filters.manufacturingDateTo}
              onChange={(value) => onFilterChange('manufacturingDateTo', value)}
              onRemove={() => removeFilter('manufacturingDateTo')}
            />
            <DateField
              label="Ввод в экспл. (от)"
              value={filters.exploitationDateFrom}
              onChange={(value) => onFilterChange('exploitationDateFrom', value)}
              onRemove={() => removeFilter('exploitationDateFrom')}
            />
            <DateField
              label="Ввод в экспл. (до)"
              value={filters.exploitationDateTo}
              onChange={(value) => onFilterChange('exploitationDateTo', value)}
              onRemove={() => removeFilter('exploitationDateTo')}
            />
          </div>
        </div>

        {/* ===== Блок 4: Списание ===== */}
        <div className="deaf-group">
          <div className="deaf-group-header">
            <FileText size={14} className="deaf-group-icon" />
            <span className="deaf-group-title">Списание</span>
          </div>
          <div className="deaf-fields-grid">
            <SuggestionInput
              label="№ акта"
              value={filters.actNumber}
              onChange={(val) => onFilterChange('actNumber', val)}
              suggestions={suggestions.actNumbers}
              placeholder="Введите номер акта"
              inputRef={inputRefs.actNumber}
              onRemove={() => removeFilter('actNumber')}
            />
            <DateField
              label="Дата акта (от)"
              value={filters.actDateFrom}
              onChange={(value) => onFilterChange('actDateFrom', value)}
              onRemove={() => removeFilter('actDateFrom')}
            />
            <DateField
              label="Дата акта (до)"
              value={filters.actDateTo}
              onChange={(value) => onFilterChange('actDateTo', value)}
              onRemove={() => removeFilter('actDateTo')}
            />
            <SuggestionInput
              label="№ справки"
              value={filters.certNumber}
              onChange={(val) => onFilterChange('certNumber', val)}
              suggestions={suggestions.certNumbers}
              placeholder="Введите номер справки"
              inputRef={inputRefs.certNumber}
              onRemove={() => removeFilter('certNumber')}
            />
            <DateField
              label="Дата справки (от)"
              value={filters.certDateFrom}
              onChange={(value) => onFilterChange('certDateFrom', value)}
              onRemove={() => removeFilter('certDateFrom')}
            />
            <DateField
              label="Дата справки (до)"
              value={filters.certDateTo}
              onChange={(value) => onFilterChange('certDateTo', value)}
              onRemove={() => removeFilter('certDateTo')}
            />
          </div>
        </div>
      </div>

      <div className="deaf-actions">
        <button
          className="deaf-clear-btn"
          onClick={() => {
            onFilterChange('names', []);
            onFilterChange('serialNumbers', []);
            onFilterChange('inventoryNumbers', []);
            onFilterChange('manufacturingDateFrom', '');
            onFilterChange('manufacturingDateTo', '');
            onFilterChange('exploitationDateFrom', '');
            onFilterChange('exploitationDateTo', '');
            onFilterChange('assignedTo', []);
            onFilterChange('interestOrgans', []);
            onFilterChange('actNumber', '');
            onFilterChange('actDateFrom', '');
            onFilterChange('actDateTo', '');
            onFilterChange('certNumber', '');
            onFilterChange('certDateFrom', '');
            onFilterChange('certDateTo', '');
          }}
        >
          Очистить все фильтры
        </button>
      </div>
    </div>
  );
}