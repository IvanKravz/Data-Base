// PersonnelAdvancedSearchModal.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Filter,
  User,
  Building2,
  ShieldAlert,
  BadgeCheck,
} from 'lucide-react';
import './PersonnelAdvancedSearchModal.css';

// ============================================================
// Типы
// ============================================================

export interface PersonnelAdvancedSearchFilters {
  ranks: string[];
  positions: string[];
  divisions: string[];
  subdivisions: string[];
  networkClasses: string[];
  gtForms: string[];
  categories: string[];
  isMaterialResponsible: boolean;
  isShaWorker: boolean;
}

interface PersonnelAdvancedSearchModalProps {
  isOpen: boolean;
  filters: PersonnelAdvancedSearchFilters;
  onFilterChange: (filterType: keyof PersonnelAdvancedSearchFilters, values: any) => void;
  onClose: () => void;
  onClearFilters: () => void;
  personnel: any[];
}

// Справочники
const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'management', label: 'Руководство' },
  { value: 'officer', label: 'Офицер' },
  { value: 'warrant_officer', label: 'Прапорщик' },
  { value: 'civilian', label: 'Гражданский персонал' },
];

const NETWORK_CLASS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '1', label: '1 класс' },
  { value: '2', label: '2 класс' },
];

// Форма ГТ — соответствует Employee.FORM_STATE_CHOICES на бэкенде
const FORM_STATE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '1', label: '1 форма' },
  { value: '2', label: '2 форма' },
  { value: '3', label: '3 форма' },
];

const EMPTY_INPUTS = {
  ranks: '',
  positions: '',
};

// ============================================================
// Хелпер: уникальные значения из массива
// ============================================================
function uniqueSorted(values: (string | undefined | null)[]): string[] {
  const set = new Set<string>();
  values.forEach((v) => {
    if (v && v.trim()) set.add(v.trim());
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// ============================================================
// Главный компонент
// ============================================================

export function PersonnelAdvancedSearchModal({
  isOpen,
  filters,
  onFilterChange,
  onClose,
  onClearFilters,
  personnel,
}: PersonnelAdvancedSearchModalProps) {
  const [currentInputs, setCurrentInputs] = useState(EMPTY_INPUTS);

  const inputRefs = {
    ranks: useRef<HTMLInputElement>(null),
    positions: useRef<HTMLInputElement>(null),
  };

  // ---- Подсказки для свободных полей ----
  const suggestions = useMemo(() => {
    const ranks = new Set<string>();
    const positions = new Set<string>();

    personnel.forEach((person) => {
      if (person.rank) ranks.add(person.rank);
      if (person.position) positions.add(person.position);
    });

    return {
      ranks: Array.from(ranks).sort(),
      positions: Array.from(positions).sort(),
    };
  }, [personnel]);

  // ---- Опции для выпадающих списков ----
  const divisionOptions = useMemo(
    () => uniqueSorted(personnel.map((p) => p.division?.name)),
    [personnel],
  );

  const subdivisionOptions = useMemo(() => {
    const selectedDivision = filters.divisions[0];
    if (!selectedDivision) return [] as string[];
    const inDivision = personnel.filter((p) => p.division?.name === selectedDivision);
    return uniqueSorted(inDivision.map((p) => p.subdivision?.name));
  }, [personnel, filters.divisions]);

  // ============================================================
  // Обработчики
  // ============================================================
  const handleInputChange = (filterType: string, value: string) => {
    setCurrentInputs((prev) => ({ ...prev, [filterType]: value }));
  };

  const addValueToFilter = (filterKey: keyof PersonnelAdvancedSearchFilters, value: string) => {
    const existing = (filters[filterKey] as string[]) || [];
    if (existing.includes(value)) return;
    onFilterChange(filterKey, [...existing, value]);
  };

  const handleKeyDown = (e: React.KeyboardEvent, filterType: string) => {
    if (e.key !== 'Enter') return;
    const value = currentInputs[filterType as keyof typeof currentInputs].trim();
    if (!value) return;

    addValueToFilter(filterType as keyof PersonnelAdvancedSearchFilters, value);
    setCurrentInputs((prev) => ({ ...prev, [filterType]: '' }));
  };

  const removeFilter = (filterType: string, index: number) => {
    const existing = (filters[filterType as keyof PersonnelAdvancedSearchFilters] as string[]) || [];
    const newValues = [...existing];
    newValues.splice(index, 1);
    onFilterChange(filterType as keyof PersonnelAdvancedSearchFilters, newValues);
  };

  // Одиночный select — устанавливаем массив из 0 или 1 значения
  const handleSingleSelectChange = (
    filterKey: 'divisions' | 'subdivisions' | 'networkClasses' | 'categories' | 'gtForms',
    value: string,
  ) => {
    onFilterChange(filterKey, value ? [value] : []);
  };

  // Смена подразделения → сбрасываем отделение
  const handleDivisionChange = (value: string) => {
    onFilterChange('divisions', value ? [value] : []);
    onFilterChange('subdivisions', []);
  };

  // Чекбоксы
  const handleCheckboxChange = (
    filterKey: 'isMaterialResponsible' | 'isShaWorker',
    checked: boolean,
  ) => {
    onFilterChange(filterKey, checked);
  };

  const handleApply = () => {
    (Object.entries(currentInputs) as Array<[keyof typeof currentInputs, string]>).forEach(
      ([key, value]) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        addValueToFilter(key as keyof PersonnelAdvancedSearchFilters, trimmed);
      },
    );
    setCurrentInputs(EMPTY_INPUTS);
    onClose();
  };

  const handleClearFilters = () => {
    onClearFilters();
    setCurrentInputs(EMPTY_INPUTS);
  };

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRefs.ranks.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ---- Рендер поля с подсказками (множественный ввод) ----
  const renderMultiInputField = (
    filterType: keyof typeof EMPTY_INPUTS,
    label: string,
    placeholder: string,
    inputRef: React.RefObject<HTMLInputElement>,
  ) => {
    const value = currentInputs[filterType];
    const matches = value
      ? suggestions[filterType]
          .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 10)
      : [];
    const selected = filters[filterType] as string[];

    return (
      <div className="pasm-field">
        <label>{label}</label>
        <div className="pasm-input-with-suggestions">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleInputChange(filterType, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, filterType)}
            className="pasm-input"
          />
          {matches.length > 0 && (
            <div className="pasm-suggestions-dropdown">
              {matches.map((suggestion) => (
                <div
                  key={suggestion}
                  className="pasm-suggestion-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addValueToFilter(
                      filterType as keyof PersonnelAdvancedSearchFilters,
                      suggestion,
                    );
                    setCurrentInputs((prev) => ({ ...prev, [filterType]: '' }));
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <div className="pasm-selected-filters">
            {selected.map((val, index) => (
              <span key={`${val}-${index}`} className="pasm-filter-tag">
                {val}
                <button
                  type="button"
                  onClick={() => removeFilter(filterType, index)}
                  title="Убрать"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---- Рендер одиночного select ----
  const renderSingleSelectField = (
    filterKey: 'networkClasses' | 'categories' | 'gtForms',
    label: string,
    options: Array<{ value: string; label: string }>,
  ) => {
    const currentValue = (filters[filterKey] as string[])?.[0] || '';
    return (
      <div className="pasm-field">
        <label>{label}</label>
        <select
          className="pasm-select"
          value={currentValue}
          onChange={(e) => handleSingleSelectChange(filterKey, e.target.value)}
        >
          <option value="">Все</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // ---- Одиночные select для подразделения/отделения ----
  const renderDivisionSelect = () => {
    const currentValue = (filters.divisions as string[])?.[0] || '';
    if (divisionOptions.length === 0) return null;

    return (
      <div className="pasm-field">
        <label>Подразделение</label>
        <select
          className="pasm-select"
          value={currentValue}
          onChange={(e) => handleDivisionChange(e.target.value)}
        >
          <option value="">Все подразделения</option>
          {divisionOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderSubdivisionSelect = () => {
    const currentValue = (filters.subdivisions as string[])?.[0] || '';
    if (!filters.divisions[0]) return null;
    if (subdivisionOptions.length === 0) return null;

    return (
      <div className="pasm-field">
        <label>Отделение</label>
        <select
          className="pasm-select"
          value={currentValue}
          onChange={(e) => handleSingleSelectChange('subdivisions', e.target.value)}
        >
          <option value="">Все отделения</option>
          {subdivisionOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // ---- Чекбокс ----
  const renderCheckbox = (
    filterKey: 'isMaterialResponsible' | 'isShaWorker',
    label: string,
  ) => (
    <label className="pasm-checkbox-row">
      <input
        type="checkbox"
        className="pasm-checkbox"
        checked={!!filters[filterKey]}
        onChange={(e) => handleCheckboxChange(filterKey, e.target.checked)}
      />
      <span className="pasm-checkbox-label">{label}</span>
    </label>
  );

  return (
    <div className="pasm-container">
      <div className="pasm-panel">
        {/* Заголовок */}
        <div className="pasm-header">
          <div className="pasm-title">
            <Filter size={16} />
            <span>Расширенный поиск сотрудников</span>
          </div>
          <button type="button" onClick={onClose} className="pasm-close-button">
            <X size={16} />
          </button>
        </div>

        {/* Группы фильтров */}
        <div className="pasm-groups-row">
          {/* Личность */}
          <div className="pasm-group">
            <div className="pasm-group-header">
              <User size={15} className="pasm-group-icon" />
              <span className="pasm-group-title">Личность</span>
            </div>
            <div className="pasm-fields-grid">
              {renderMultiInputField('ranks', 'Звание', 'Введите звание', inputRefs.ranks)}
              {renderMultiInputField('positions', 'Должность', 'Введите должность', inputRefs.positions)}
            </div>
          </div>

          {/* Принадлежность */}
          <div className="pasm-group">
            <div className="pasm-group-header">
              <Building2 size={15} className="pasm-group-icon" />
              <span className="pasm-group-title">Принадлежность</span>
            </div>
            <div className="pasm-fields-grid">
              {renderDivisionSelect()}
              {renderSubdivisionSelect()}
            </div>
          </div>

          {/* Допуск */}
          <div className="pasm-group">
            <div className="pasm-group-header">
              <ShieldAlert size={15} className="pasm-group-icon" />
              <span className="pasm-group-title">Допуск</span>
            </div>
            <div className="pasm-fields-grid">
              {renderSingleSelectField('networkClasses', 'Класс сети', NETWORK_CLASS_OPTIONS)}
              {renderSingleSelectField('gtForms', 'Форма ГТ', FORM_STATE_OPTIONS)}
            </div>
          </div>

          {/* Статус */}
          <div className="pasm-group">
            <div className="pasm-group-header">
              <BadgeCheck size={15} className="pasm-group-icon" />
              <span className="pasm-group-title">Статус</span>
            </div>
            <div className="pasm-fields-grid">
              {renderSingleSelectField('categories', 'Категория', CATEGORY_OPTIONS)}
              {renderCheckbox('isMaterialResponsible', 'Только МОЛ')}
              {renderCheckbox('isShaWorker', 'Только ШаРаботники')}
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="pasm-actions">
          <button type="button" onClick={handleClearFilters} className="pasm-btn-clear">
            Очистить все фильтры
          </button>
          <button type="button" onClick={handleApply} className="pasm-btn-apply">
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}