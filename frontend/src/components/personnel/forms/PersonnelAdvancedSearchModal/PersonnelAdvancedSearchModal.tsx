// PersonnelAdvancedSearchModal.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import './PersonnelAdvancedSearchModal.css';

interface PersonnelAdvancedSearchFilters {
  ranks: string[];
  positions: string[];
  divisions: string[];
  subdivisions: string[]; // ДОБАВЛЕНО: поле для отделений
  networkClasses: string[];
  gtForms: string[];
}

interface PersonnelAdvancedSearchModalProps {
  isOpen: boolean;
  filters: PersonnelAdvancedSearchFilters;
  onFilterChange: (filterType: keyof PersonnelAdvancedSearchFilters, values: any) => void;
  onClose: () => void;
  onClearFilters: () => void;
  personnel: any[];
}

export function PersonnelAdvancedSearchModal({
  isOpen,
  filters,
  onFilterChange,
  onClose,
  onClearFilters,
  personnel
}: PersonnelAdvancedSearchModalProps) {
  const [currentInputs, setCurrentInputs] = useState({
    ranks: '',
    positions: '',
    divisions: '',
    subdivisions: '', // ДОБАВЛЕНО: поле для отделений
    networkClasses: '',
    gtForms: ''
  });

  const inputRefs = {
    ranks: useRef<HTMLInputElement>(null),
    positions: useRef<HTMLInputElement>(null),
    divisions: useRef<HTMLInputElement>(null),
    subdivisions: useRef<HTMLInputElement>(null), // ДОБАВЛЕНО: ref для отделений
    networkClasses: useRef<HTMLInputElement>(null),
    gtForms: useRef<HTMLInputElement>(null)
  };

  const suggestions = useMemo(() => {
    const ranks = new Set<string>();
    const positions = new Set<string>();
    const divisions = new Set<string>();
    const subdivisions = new Set<string>(); // ДОБАВЛЕНО: Set для отделений
    const networkClasses = new Set<string>();
    const gtForms = new Set<string>();

    personnel.forEach(person => {
      if (person.rank) ranks.add(person.rank);
      if (person.position) positions.add(person.position);
      if (person.division?.name) divisions.add(person.division.name);
      
      // ДОБАВЛЕНО: Получаем названия отделений
      if (person.subdivision?.name) {
        subdivisions.add(person.subdivision.name);
      }
      
      // Получаем класс сети из sha_details.access_level
      if (person.sha_details?.access_level) {
        const accessLevel = person.sha_details.access_level;
        if (accessLevel) {
          networkClasses.add(accessLevel.toString());
        }
      }
      
      // Получаем форму ГТ из form_state_secrets
      if (person.form_state_secrets) {
        const form = person.form_state_secrets;
        if (form) {
          gtForms.add(form);
        }
      }
    });

    return {
      ranks: Array.from(ranks).sort(),
      positions: Array.from(positions).sort(),
      divisions: Array.from(divisions).sort(),
      subdivisions: Array.from(subdivisions).sort(), // ДОБАВЛЕНО: массив отделений
      networkClasses: Array.from(networkClasses).sort(),
      gtForms: Array.from(gtForms).sort()
    };
  }, [personnel]);

  const handleInputChange = (filterType: string, value: string) => {
    setCurrentInputs(prev => ({ ...prev, [filterType]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, filterType: string) => {
    if (e.key === 'Enter' && currentInputs[filterType as keyof typeof currentInputs].trim()) {
      const value = currentInputs[filterType as keyof typeof currentInputs].trim();
      
      // Для класса сети убираем слово "класс" если оно есть
      let processedValue = value;
      if (filterType === 'networkClasses') {
        processedValue = value.replace(/\s*класс\s*/gi, '');
      }
      
      const newValues = [...filters[filterType as keyof PersonnelAdvancedSearchFilters] as string[], processedValue];
      onFilterChange(filterType as keyof PersonnelAdvancedSearchFilters, newValues);
      setCurrentInputs(prev => ({ ...prev, [filterType]: '' }));
    }
  };

  const removeFilter = (filterType: string, index: number) => {
    const newValues = [...filters[filterType as keyof PersonnelAdvancedSearchFilters] as any[]];
    newValues.splice(index, 1);
    onFilterChange(filterType as keyof PersonnelAdvancedSearchFilters, newValues);
  };

  const handleApply = () => {
    // Применяем текстовые фильтры для всех полей
    Object.entries(currentInputs).forEach(([key, value]) => {
      if (value.trim()) {
        let processedValue = value.trim();
        
        // Для класса сети убираем слово "класс" если оно есть
        if (key === 'networkClasses') {
          processedValue = processedValue.replace(/\s*класс\s*/gi, '');
        }
        
        const newValues = [...filters[key as keyof PersonnelAdvancedSearchFilters] as string[], processedValue];
        onFilterChange(key as keyof PersonnelAdvancedSearchFilters, newValues);
      }
    });
    
    setCurrentInputs({
      ranks: '',
      positions: '',
      divisions: '',
      subdivisions: '', // ДОБАВЛЕНО: сброс поля отделений
      networkClasses: '',
      gtForms: ''
    });
  };

  const handleClearFilters = () => {
    onClearFilters();
    setCurrentInputs({
      ranks: '',
      positions: '',
      divisions: '',
      subdivisions: '', // ДОБАВЛЕНО: сброс поля отделений
      networkClasses: '',
      gtForms: ''
    });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.ranks.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="personnel-advanced-search-panel">
      <div className="personnel-advanced-search-header">
        <div className="personnel-advanced-search-title">
          <Filter size={16} />
          <span>Расширенный поиск сотрудников</span>
        </div>
        <button onClick={onClose} className="personnel-close-button">
          <X size={16} />
        </button>
      </div>
      
      <div className="personnel-advanced-search-fields">
        {/* Звание */}
        <div className="personnel-search-field">
          <label>Звание</label>
          <div className="personnel-input-with-suggestions">
            <input
              ref={inputRefs.ranks}
              type="text"
              placeholder="Введите звание"
              value={currentInputs.ranks}
              onChange={(e) => handleInputChange('ranks', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'ranks')}
              className="personnel-search-input"
            />
            {currentInputs.ranks && suggestions.ranks.filter(rank => 
              rank.toLowerCase().includes(currentInputs.ranks.toLowerCase())
            ).length > 0 && (
              <div className="personnel-suggestions-dropdown">
                {suggestions.ranks.filter(rank => 
                  rank.toLowerCase().includes(currentInputs.ranks.toLowerCase())
                ).map((suggestion, index) => (
                  <div
                    key={index}
                    className="personnel-suggestion-item"
                    onClick={() => {
                      const newValues = [...filters.ranks, suggestion];
                      onFilterChange('ranks', newValues);
                      setCurrentInputs(prev => ({ ...prev, ranks: '' }));
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          {filters.ranks.length > 0 && (
            <div className="personnel-selected-filters">
              {filters.ranks.map((rank, index) => (
                <span key={index} className="personnel-filter-tag">
                  {rank}
                  <button onClick={() => removeFilter('ranks', index)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Должность */}
        <div className="personnel-search-field">
          <label>Должность</label>
          <div className="personnel-input-with-suggestions">
            <input
              ref={inputRefs.positions}
              type="text"
              placeholder="Введите должность"
              value={currentInputs.positions}
              onChange={(e) => handleInputChange('positions', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'positions')}
              className="personnel-search-input"
            />
            {currentInputs.positions && suggestions.positions.filter(position => 
              position.toLowerCase().includes(currentInputs.positions.toLowerCase())
            ).length > 0 && (
              <div className="personnel-suggestions-dropdown">
                {suggestions.positions.filter(position => 
                  position.toLowerCase().includes(currentInputs.positions.toLowerCase())
                ).map((suggestion, index) => (
                  <div
                    key={index}
                    className="personnel-suggestion-item"
                    onClick={() => {
                      const newValues = [...filters.positions, suggestion];
                      onFilterChange('positions', newValues);
                      setCurrentInputs(prev => ({ ...prev, positions: '' }));
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          {filters.positions.length > 0 && (
            <div className="personnel-selected-filters">
              {filters.positions.map((position, index) => (
                <span key={index} className="personnel-filter-tag">
                  {position}
                  <button onClick={() => removeFilter('positions', index)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Подразделение */}
        <div className="personnel-search-field">
          <label>Подразделение</label>
          <div className="personnel-input-with-suggestions">
            <input
              ref={inputRefs.divisions}
              type="text"
              placeholder="Введите подразделение"
              value={currentInputs.divisions}
              onChange={(e) => handleInputChange('divisions', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'divisions')}
              className="personnel-search-input"
            />
            {currentInputs.divisions && suggestions.divisions.filter(division => 
              division.toLowerCase().includes(currentInputs.divisions.toLowerCase())
            ).length > 0 && (
              <div className="personnel-suggestions-dropdown">
                {suggestions.divisions.filter(division => 
                  division.toLowerCase().includes(currentInputs.divisions.toLowerCase())
                ).map((suggestion, index) => (
                  <div
                    key={index}
                    className="personnel-suggestion-item"
                    onClick={() => {
                      const newValues = [...filters.divisions, suggestion];
                      onFilterChange('divisions', newValues);
                      setCurrentInputs(prev => ({ ...prev, divisions: '' }));
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          {filters.divisions.length > 0 && (
            <div className="personnel-selected-filters">
              {filters.divisions.map((division, index) => (
                <span key={index} className="personnel-filter-tag">
                  {division}
                  <button onClick={() => removeFilter('divisions', index)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ДОБАВЛЕНО: Отделение */}
        <div className="personnel-search-field">
          <label>Отделение</label>
          <div className="personnel-input-with-suggestions">
            <input
              ref={inputRefs.subdivisions}
              type="text"
              placeholder="Введите отделение"
              value={currentInputs.subdivisions}
              onChange={(e) => handleInputChange('subdivisions', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'subdivisions')}
              className="personnel-search-input"
            />
            {currentInputs.subdivisions && suggestions.subdivisions.filter(subdivision => 
              subdivision.toLowerCase().includes(currentInputs.subdivisions.toLowerCase())
            ).length > 0 && (
              <div className="personnel-suggestions-dropdown">
                {suggestions.subdivisions.filter(subdivision => 
                  subdivision.toLowerCase().includes(currentInputs.subdivisions.toLowerCase())
                ).map((suggestion, index) => (
                  <div
                    key={index}
                    className="personnel-suggestion-item"
                    onClick={() => {
                      const newValues = [...filters.subdivisions, suggestion];
                      onFilterChange('subdivisions', newValues);
                      setCurrentInputs(prev => ({ ...prev, subdivisions: '' }));
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          {filters.subdivisions.length > 0 && (
            <div className="personnel-selected-filters">
              {filters.subdivisions.map((subdivision, index) => (
                <span key={index} className="personnel-filter-tag">
                  {subdivision}
                  <button onClick={() => removeFilter('subdivisions', index)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Класс сети */}
        <div className="personnel-search-field">
          <label>Класс сети</label>
          <div className="personnel-input-with-suggestions">
            <input
              ref={inputRefs.networkClasses}
              type="text"
              placeholder="Введите класс сети (1, 2)"
              value={currentInputs.networkClasses}
              onChange={(e) => handleInputChange('networkClasses', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'networkClasses')}
              className="personnel-search-input"
            />
            {currentInputs.networkClasses && suggestions.networkClasses.filter(networkClass => 
              networkClass.toLowerCase().includes(currentInputs.networkClasses.replace(/\s*класс\s*/gi, '').toLowerCase())
            ).length > 0 && (
              <div className="personnel-suggestions-dropdown">
                {suggestions.networkClasses.filter(networkClass => 
                  networkClass.toLowerCase().includes(currentInputs.networkClasses.replace(/\s*класс\s*/gi, '').toLowerCase())
                ).map((suggestion, index) => (
                  <div
                    key={index}
                    className="personnel-suggestion-item"
                    onClick={() => {
                      // В фильтр добавляем только числовое значение, без "класс"
                      const newValues = [...filters.networkClasses, suggestion];
                      onFilterChange('networkClasses', newValues);
                      setCurrentInputs(prev => ({ ...prev, networkClasses: '' }));
                    }}
                  >
                    {suggestion} класс
                  </div>
                ))}
              </div>
            )}
          </div>
          {filters.networkClasses.length > 0 && (
            <div className="personnel-selected-filters">
              {filters.networkClasses.map((networkClass, index) => (
                <span key={index} className="personnel-filter-tag">
                  {networkClass} класс
                  <button onClick={() => removeFilter('networkClasses', index)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Форма ГТ */}
        <div className="personnel-search-field">
          <label>Форма ГТ</label>
          <div className="personnel-input-with-suggestions">
            <input
              ref={inputRefs.gtForms}
              type="text"
              placeholder="Введите форму ГТ"
              value={currentInputs.gtForms}
              onChange={(e) => handleInputChange('gtForms', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'gtForms')}
              className="personnel-search-input"
            />
            {currentInputs.gtForms && suggestions.gtForms.filter(gtForm => 
              gtForm.toLowerCase().includes(currentInputs.gtForms.toLowerCase())
            ).length > 0 && (
              <div className="personnel-suggestions-dropdown">
                {suggestions.gtForms.filter(gtForm => 
                  gtForm.toLowerCase().includes(currentInputs.gtForms.toLowerCase())
                ).map((suggestion, index) => (
                  <div
                    key={index}
                    className="personnel-suggestion-item"
                    onClick={() => {
                      const newValues = [...filters.gtForms, suggestion];
                      onFilterChange('gtForms', newValues);
                      setCurrentInputs(prev => ({ ...prev, gtForms: '' }));
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          {filters.gtForms.length > 0 && (
            <div className="personnel-selected-filters">
              {filters.gtForms.map((gtForm, index) => (
                <span key={index} className="personnel-filter-tag">
                  {gtForm}
                  <button onClick={() => removeFilter('gtForms', index)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="personnel-advanced-search-actions">
        <button onClick={handleClearFilters} className="personnel-clear-filters-button">
          Очистить все фильтры
        </button>
        <button onClick={handleApply} className="personnel-apply-filters-button">
          Применить фильтры
        </button>
      </div>
    </div>
  );
}