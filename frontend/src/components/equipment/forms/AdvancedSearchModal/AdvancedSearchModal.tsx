import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Filter } from 'lucide-react'; // Добавляем иконку Filter
import { SearchField } from './sections/SearchField';
import { DateField } from './sections/DateField';
import './AdvancedSearchModal.css';

// Интерфейс для объекта interest_organ
interface InterestOrgan {
  id: string;
  name: string;
}

interface AdvancedSearchFilters {
  names: string[];
  serialNumbers: string[];
  inventoryNumbers: string[];
  manufacturingDateFrom: string;
  manufacturingDateTo: string;
  exploitationDateFrom: string;
  exploitationDateTo: string;
  assignedTo: string[];
  interestOrgans: InterestOrgan[]; // Изменено на массив объектов
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  filters: AdvancedSearchFilters;
  onFilterChange: (filterType: keyof AdvancedSearchFilters, values: any) => void;
  onClose: () => void;
  onClearFilters: () => void;
  equipment: any[];
}

export function AdvancedSearchModal({
  isOpen,
  filters,
  onFilterChange,
  onClose,
  onClearFilters,
  equipment
}: AdvancedSearchModalProps) {
  const [currentInputs, setCurrentInputs] = useState({
    names: '',
    serialNumbers: '',
    inventoryNumbers: '',
    assignedTo: '',
    interestOrgans: ''
  });
  
  const [dateFilters, setDateFilters] = useState({
    manufacturingDateFrom: filters.manufacturingDateFrom || '',
    manufacturingDateTo: filters.manufacturingDateTo || '',
    exploitationDateFrom: filters.exploitationDateFrom || '',
    exploitationDateTo: filters.exploitationDateTo || ''
  });

  const inputRefs = {
    names: useRef<HTMLInputElement>(null),
    serialNumbers: useRef<HTMLInputElement>(null),
    inventoryNumbers: useRef<HTMLInputElement>(null),
    assignedTo: useRef<HTMLInputElement>(null),
    interestOrgans: useRef<HTMLInputElement>(null)
  };

  const suggestions = useMemo(() => {
    const names = new Set<string>();
    const serialNumbers = new Set<string>();
    const inventoryNumbers = new Set<string>();
    const assignedTo = new Set<string>();
    const interestOrgans = new Set<string>();

    equipment.forEach(item => {
      if (item.name) names.add(item.name);
      if (item.serial_number) serialNumbers.add(item.serial_number);
      if (item.inventory_number) inventoryNumbers.add(item.inventory_number);
      if (item.assigned_to?.full_name) assignedTo.add(item.assigned_to.full_name);
      if (item.interest_organ?.name) interestOrgans.add(item.interest_organ.name); // Берем name из объекта
    });

    return {
      names: Array.from(names).sort(),
      serialNumbers: Array.from(serialNumbers).sort(),
      inventoryNumbers: Array.from(inventoryNumbers).sort(),
      assignedTo: Array.from(assignedTo).sort(),
      interestOrgans: Array.from(interestOrgans).sort()
    };
  }, [equipment]);

  // Функция для получения объекта interest_organ по имени
  const getInterestOrganByName = (name: string): InterestOrgan | undefined => {
    for (const item of equipment) {
      if (item.interest_organ?.name === name) {
        return item.interest_organ;
      }
    }
    return undefined;
  };

  const handleInputChange = (filterType: string, value: string) => {
    setCurrentInputs(prev => ({ ...prev, [filterType]: value }));
  };

  const handleDateChange = (filterType: string, value: string) => {
    setDateFilters(prev => ({ ...prev, [filterType]: value }));
    onFilterChange(filterType as keyof AdvancedSearchFilters, value);
  };

  const handleFocus = (filterType: string) => {
    // Фокус обрабатывается внутри SearchField
  };

  const handleBlur = () => {
    // Блюр обрабатывается внутри SearchField
  };

  const handleKeyPress = (e: React.KeyboardEvent, filterType: string) => {
    if (e.key === 'Enter' && currentInputs[filterType as keyof typeof currentInputs].trim()) {
      const value = currentInputs[filterType as keyof typeof currentInputs].trim();
      
      if (filterType === 'interestOrgans') {
        // Для interestOrgans ищем объект по имени
        const organ = getInterestOrganByName(value);
        if (organ) {
          const newValues = [...filters.interestOrgans, organ];
          onFilterChange('interestOrgans', newValues);
        }
      } else {
        // Для остальных полей работаем со строками
        const newValues = [...filters[filterType as keyof AdvancedSearchFilters] as string[], value];
        onFilterChange(filterType as keyof AdvancedSearchFilters, newValues);
      }
      
      setCurrentInputs(prev => ({ ...prev, [filterType]: '' }));
    }
  };

  const removeFilter = (filterType: string, index: number) => {
    if (filterType === 'manufacturingDateFrom' || filterType === 'manufacturingDateTo' || 
        filterType === 'exploitationDateFrom' || filterType === 'exploitationDateTo') {
      onFilterChange(filterType as keyof AdvancedSearchFilters, '');
      setDateFilters(prev => ({ ...prev, [filterType]: '' }));
    } else {
      const newValues = [...filters[filterType as keyof AdvancedSearchFilters] as any[]];
      newValues.splice(index, 1);
      onFilterChange(filterType as keyof AdvancedSearchFilters, newValues);
    }
  };

  const handleApply = () => {
    Object.entries(currentInputs).forEach(([key, value]) => {
      if (value.trim()) {
        if (key === 'interestOrgans') {
          const organ = getInterestOrganByName(value.trim());
          if (organ) {
            const newValues = [...filters.interestOrgans, organ];
            onFilterChange('interestOrgans', newValues);
          }
        } else {
          const newValues = [...filters[key as keyof AdvancedSearchFilters] as string[], value.trim()];
          onFilterChange(key as keyof AdvancedSearchFilters, newValues);
        }
      }
    });
    
    setCurrentInputs({
      names: '',
      serialNumbers: '',
      inventoryNumbers: '',
      assignedTo: '',
      interestOrgans: ''
    });
    
    onClose();
  };

  const handleClearFilters = () => {
    onClearFilters();
    setCurrentInputs({
      names: '',
      serialNumbers: '',
      inventoryNumbers: '',
      assignedTo: '',
      interestOrgans: ''
    });
    setDateFilters({
      manufacturingDateFrom: '',
      manufacturingDateTo: '',
      exploitationDateFrom: '',
      exploitationDateTo: ''
    });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.names.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="advanced-search-modal-container">
      <div className="advanced-search-modal">
        {/* Обновленный заголовок с иконкой Filter */}
        <div className="advanced-search-header">
          <div className="advanced-search-title">
            <Filter size={16} />
            <span>Расширенный поиск</span>
          </div>
          <button onClick={onClose} className="close-button">
            <X size={16} />
          </button>
        </div>
        
        <div className="advanced-search-fields">
          <SearchField
            type="names"
            label="Названия"
            placeholder="Введите название"
            currentInputs={currentInputs}
            filters={filters}
            suggestions={suggestions}
            onInputChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            onRemoveFilter={removeFilter}
            onSuggestionSelect={(suggestion) => {
              const newValues = [...filters.names, suggestion];
              onFilterChange('names', newValues);
              setCurrentInputs(prev => ({ ...prev, names: '' }));
            }}
            inputRef={inputRefs.names}
          />
          
          <SearchField
            type="serialNumbers"
            label="Серийные номера"
            placeholder="Введите серийный номер"
            currentInputs={currentInputs}
            filters={filters}
            suggestions={suggestions}
            onInputChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            onRemoveFilter={removeFilter}
            onSuggestionSelect={(suggestion) => {
              const newValues = [...filters.serialNumbers, suggestion];
              onFilterChange('serialNumbers', newValues);
              setCurrentInputs(prev => ({ ...prev, serialNumbers: '' }));
            }}
            inputRef={inputRefs.serialNumbers}
          />
          
          <SearchField
            type="inventoryNumbers"
            label="Инвентарные номера"
            placeholder="Введите инвентарный номер"
            currentInputs={currentInputs}
            filters={filters}
            suggestions={suggestions}
            onInputChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            onRemoveFilter={removeFilter}
            onSuggestionSelect={(suggestion) => {
              const newValues = [...filters.inventoryNumbers, suggestion];
              onFilterChange('inventoryNumbers', newValues);
              setCurrentInputs(prev => ({ ...prev, inventoryNumbers: '' }));
            }}
            inputRef={inputRefs.inventoryNumbers}
          />

          <DateField
            label="Дата производства (от)"
            value={dateFilters.manufacturingDateFrom}
            onChange={(value) => handleDateChange('manufacturingDateFrom', value)}
            onRemove={() => removeFilter('manufacturingDateFrom', 0)}
          />

          <DateField
            label="Дата производства (до)"
            value={dateFilters.manufacturingDateTo}
            onChange={(value) => handleDateChange('manufacturingDateTo', value)}
            onRemove={() => removeFilter('manufacturingDateTo', 0)}
          />

          <DateField
            label="Дата ввода в эксплуатацию (от)"
            value={dateFilters.exploitationDateFrom}
            onChange={(value) => handleDateChange('exploitationDateFrom', value)}
            onRemove={() => removeFilter('exploitationDateFrom', 0)}
          />

          <DateField
            label="Дата ввода в эксплуатацию (до)"
            value={dateFilters.exploitationDateTo}
            onChange={(value) => handleDateChange('exploitationDateTo', value)}
            onRemove={() => removeFilter('exploitationDateTo', 0)}
          />
          
          <SearchField
            type="assignedTo"
            label="Закреплено за"
            placeholder="Введите ФИО сотрудника"
            currentInputs={currentInputs}
            filters={filters}
            suggestions={suggestions}
            onInputChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            onRemoveFilter={removeFilter}
            onSuggestionSelect={(suggestion) => {
              const newValues = [...filters.assignedTo, suggestion];
              onFilterChange('assignedTo', newValues);
              setCurrentInputs(prev => ({ ...prev, assignedTo: '' }));
            }}
            inputRef={inputRefs.assignedTo}
          />

          {/* Поле для фильтрации по interest_organ */}
          <SearchField
            type="interestOrgans"
            label="В чьих интересах"
            placeholder="Введите организацию или отдел"
            currentInputs={currentInputs}
            filters={{ 
              ...filters, 
              interestOrgans: filters.interestOrgans.map(organ => organ.name) // Преобразуем объекты в строки для отображения
            }}
            suggestions={suggestions}
            onInputChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            onRemoveFilter={removeFilter}
            onSuggestionSelect={(suggestion) => {
              const organ = getInterestOrganByName(suggestion);
              if (organ) {
                const newValues = [...filters.interestOrgans, organ];
                onFilterChange('interestOrgans', newValues);
                setCurrentInputs(prev => ({ ...prev, interestOrgans: '' }));
              }
            }}
            inputRef={inputRefs.interestOrgans}
          />
        </div>
        
        <div className="advanced-search-actions">
          <button onClick={handleClearFilters} className="clear-filters-button">
            Очистить все фильтры
          </button>
          <button onClick={handleApply} className="apply-filters-button">
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}