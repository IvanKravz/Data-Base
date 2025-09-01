import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface AdvancedSearchFilters {
  names: string[];
  serialNumbers: string[];
  inventoryNumbers: string[];
  manufacturingDateFrom: string;
  manufacturingDateTo: string;
  exploitationDateFrom: string;
  exploitationDateTo: string;
  assignedTo: string[];
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
    assignedTo: ''
  });
  

  const [dateFilters, setDateFilters] = useState({
    manufacturingDateFrom: filters.manufacturingDateFrom || '',
    manufacturingDateTo: filters.manufacturingDateTo || '',
    exploitationDateFrom: filters.exploitationDateFrom || '',
    exploitationDateTo: filters.exploitationDateTo || ''
  });

  const [focusedField, setFocusedField] = useState<keyof typeof currentInputs | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRefs = {
    names: useRef<HTMLInputElement>(null),
    serialNumbers: useRef<HTMLInputElement>(null),
    inventoryNumbers: useRef<HTMLInputElement>(null),
    assignedTo: useRef<HTMLInputElement>(null)
  };

  // Получаем уникальные значения из оборудования для подсказок
  const suggestions = useMemo(() => {
    const names = new Set<string>();
    const serialNumbers = new Set<string>();
    const inventoryNumbers = new Set<string>();
    const assignedTo = new Set<string>();

    equipment.forEach(item => {
      if (item.name) names.add(item.name);
      if (item.serial_number) serialNumbers.add(item.serial_number);
      if (item.inventory_number) inventoryNumbers.add(item.inventory_number);
      if (item.assigned_to?.full_name) assignedTo.add(item.assigned_to.full_name);
    });

    return {
      names: Array.from(names).sort(),
      serialNumbers: Array.from(serialNumbers).sort(),
      inventoryNumbers: Array.from(inventoryNumbers).sort(),
      assignedTo: Array.from(assignedTo).sort()
    };
  }, [equipment]);

  // Фильтруем подсказки based on input
  const filteredSuggestions = useMemo(() => {
    if (!focusedField || !currentInputs[focusedField]) return [];
    
    return suggestions[focusedField].filter(suggestion =>
      suggestion.toLowerCase().includes(currentInputs[focusedField].toLowerCase())
    ).slice(0, 10);
  }, [focusedField, currentInputs, suggestions]);

  // Обработчик изменения значения в поле ввода
  const handleInputChange = (filterType: keyof typeof currentInputs, value: string) => {
    setCurrentInputs(prev => ({ ...prev, [filterType]: value }));
    setShowSuggestions(value.length > 0);
  };

  // Обработчик изменения дат
  const handleDateChange = (filterType: keyof typeof dateFilters, value: string) => {
    setDateFilters(prev => ({ ...prev, [filterType]: value }));
    onFilterChange(filterType as keyof AdvancedSearchFilters, value);
  };

  // Обработчик фокуса на поле ввода
  const handleFocus = (filterType: keyof typeof currentInputs) => {
    setFocusedField(filterType);
    setShowSuggestions(currentInputs[filterType].length > 0);
  };

  // Обработчик потери фокуса
  const handleBlur = () => {
    setTimeout(() => {
      setFocusedField(null);
      setShowSuggestions(false);
    }, 200);
  };

  // Обработчик выбора подсказки
  const handleSuggestionSelect = (suggestion: string) => {
    if (!focusedField) return;
    
    // Добавляем выбранное значение к фильтрам
    const newValues = [...filters[focusedField], suggestion];
    onFilterChange(focusedField, newValues);
    
    // Очищаем поле ввода
    setCurrentInputs(prev => ({ ...prev, [focusedField]: '' }));
    setShowSuggestions(false);
  };

  // Обработчик добавления значения через Enter
  const handleKeyPress = (e: React.KeyboardEvent, filterType: keyof typeof currentInputs) => {
    if (e.key === 'Enter' && currentInputs[filterType].trim()) {
      // Добавляем текущее значение к фильтрам
      const newValues = [...filters[filterType], currentInputs[filterType].trim()];
      onFilterChange(filterType, newValues);
      
      // Очищаем поле ввода
      setCurrentInputs(prev => ({ ...prev, [filterType]: '' }));
      setShowSuggestions(false);
    }
  };

  // Обработчик удаления отдельного фильтра
  const removeFilter = (filterType: keyof AdvancedSearchFilters, index: number) => {
    if (filterType === 'manufacturingDateFrom' || filterType === 'manufacturingDateTo' || 
        filterType === 'exploitationDateFrom' || filterType === 'exploitationDateTo') {
      onFilterChange(filterType, '');
      setDateFilters(prev => ({ ...prev, [filterType]: '' }));
    } else {
      const newValues = [...filters[filterType]];
      newValues.splice(index, 1);
      onFilterChange(filterType, newValues);
    }
  };

  // Обработчик применения фильтров (кнопка "Применить")
  const handleApply = () => {
    // Добавляем все текущие значения к фильтрам
    Object.entries(currentInputs).forEach(([key, value]) => {
      const filterType = key as keyof typeof currentInputs;
      if (value.trim()) {
        const newValues = [...filters[filterType], value.trim()];
        onFilterChange(filterType, newValues);
      }
    });
    
    // Очищаем все поля ввода
    setCurrentInputs({
      names: '',
      serialNumbers: '',
      inventoryNumbers: '',
      assignedTo: ''
    });
    
    setShowSuggestions(false);
    onClose();
  };

  // Обработчик очистки всех фильтров
  const handleClearFilters = () => {
    onClearFilters();
    setCurrentInputs({
      names: '',
      serialNumbers: '',
      inventoryNumbers: '',
      assignedTo: ''
    });
    setDateFilters({
      manufacturingDateFrom: '',
      manufacturingDateTo: '',
      exploitationDateFrom: '',
      exploitationDateTo: ''
    });
    setShowSuggestions(false);
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
        <div className="advanced-search-header">
          <h3>Расширенный поиск</h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        
        <div className="advanced-search-fields">
          <div className="search-field">
            <label>Названия</label>
            <input
              ref={inputRefs.names}
              type="text"
              placeholder="Введите название"
              value={currentInputs.names}
              onChange={(e) => handleInputChange('names', e.target.value)}
              onFocus={() => handleFocus('names')}
              onBlur={handleBlur}
              onKeyPress={(e) => handleKeyPress(e, 'names')}
            />
            
            {focusedField === 'names' && showSuggestions && filteredSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {filteredSuggestions.map(suggestion => (
                  <div
                    key={suggestion}
                    className="suggestion-item"
                    onMouseDown={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            <div className="selected-filters">
              {filters.names.map((value, index) => (
                <span key={index} className="filter-tag">
                  {value}
                  <button onClick={() => removeFilter('names', index)}>×</button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="search-field">
            <label>Серийные номера</label>
            <input
              ref={inputRefs.serialNumbers}
              type="text"
              placeholder="Введите серийный номер"
              value={currentInputs.serialNumbers}
              onChange={(e) => handleInputChange('serialNumbers', e.target.value)}
              onFocus={() => handleFocus('serialNumbers')}
              onBlur={handleBlur}
              onKeyPress={(e) => handleKeyPress(e, 'serialNumbers')}
            />
            
            {focusedField === 'serialNumbers' && showSuggestions && filteredSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {filteredSuggestions.map(suggestion => (
                  <div
                    key={suggestion}
                    className="suggestion-item"
                    onMouseDown={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            <div className="selected-filters">
              {filters.serialNumbers.map((value, index) => (
                <span key={index} className="filter-tag">
                  {value}
                  <button onClick={() => removeFilter('serialNumbers', index)}>×</button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="search-field">
            <label>Инвентарные номера</label>
            <input
              ref={inputRefs.inventoryNumbers}
              type="text"
              placeholder="Введите инвентарный номер"
              value={currentInputs.inventoryNumbers}
              onChange={(e) => handleInputChange('inventoryNumbers', e.target.value)}
              onFocus={() => handleFocus('inventoryNumbers')}
              onBlur={handleBlur}
              onKeyPress={(e) => handleKeyPress(e, 'inventoryNumbers')}
            />
            
            {focusedField === 'inventoryNumbers' && showSuggestions && filteredSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {filteredSuggestions.map(suggestion => (
                  <div
                    key={suggestion}
                    className="suggestion-item"
                    onMouseDown={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            <div className="selected-filters">
              {filters.inventoryNumbers.map((value, index) => (
                <span key={index} className="filter-tag">
                  {value}
                  <button onClick={() => removeFilter('inventoryNumbers', index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="search-field">
            <label>Дата производства (от)</label>
            <input
              type="date"
              value={dateFilters.manufacturingDateFrom}
              onChange={(e) => handleDateChange('manufacturingDateFrom', e.target.value)}
            />
            {dateFilters.manufacturingDateFrom && (
              <div className="selected-filters">
                <span className="filter-tag">
                  {dateFilters.manufacturingDateFrom}
                  <button onClick={() => removeFilter('manufacturingDateFrom', 0)}>×</button>
                </span>
              </div>
            )}
          </div>

          <div className="search-field">
            <label>Дата производства (до)</label>
            <input
              type="date"
              value={dateFilters.manufacturingDateTo}
              onChange={(e) => handleDateChange('manufacturingDateTo', e.target.value)}
            />
            {dateFilters.manufacturingDateTo && (
              <div className="selected-filters">
                <span className="filter-tag">
                  {dateFilters.manufacturingDateTo}
                  <button onClick={() => removeFilter('manufacturingDateTo', 0)}>×</button>
                </span>
              </div>
            )}
          </div>

          <div className="search-field">
            <label>Дата ввода в эксплуатацию (от)</label>
            <input
              type="date"
              value={dateFilters.exploitationDateFrom}
              onChange={(e) => handleDateChange('exploitationDateFrom', e.target.value)}
            />
            {dateFilters.exploitationDateFrom && (
              <div className="selected-filters">
                <span className="filter-tag">
                  {dateFilters.exploitationDateFrom}
                  <button onClick={() => removeFilter('exploitationDateFrom', 0)}>×</button>
                </span>
              </div>
            )}
          </div>

          <div className="search-field">
            <label>Дата ввода в эксплуатацию (до)</label>
            <input
              type="date"
              value={dateFilters.exploitationDateTo}
              onChange={(e) => handleDateChange('exploitationDateTo', e.target.value)}
            />
            {dateFilters.exploitationDateTo && (
              <div className="selected-filters">
                <span className="filter-tag">
                  {dateFilters.exploitationDateTo}
                  <button onClick={() => removeFilter('exploitationDateTo', 0)}>×</button>
                </span>
              </div>
            )}
          </div>
          
          <div className="search-field">
            <label>Закреплено за</label>
            <input
              ref={inputRefs.assignedTo}
              type="text"
              placeholder="Введите ФИО сотрудника"
              value={currentInputs.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              onFocus={() => handleFocus('assignedTo')}
              onBlur={handleBlur}
              onKeyPress={(e) => handleKeyPress(e, 'assignedTo')}
            />
            
            {focusedField === 'assignedTo' && showSuggestions && filteredSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {filteredSuggestions.map(suggestion => (
                  <div
                    key={suggestion}
                    className="suggestion-item"
                    onMouseDown={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            <div className="selected-filters">
              {filters.assignedTo.map((value, index) => (
                <span key={index} className="filter-tag">
                  {value}
                  <button onClick={() => removeFilter('assignedTo', index)}>×</button>
                </span>
              ))}
            </div>
          </div>
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