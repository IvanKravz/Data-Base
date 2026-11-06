// AdvancedSearchModal.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Filter, Cpu, User, CalendarDays, Tag, Flag } from 'lucide-react';
import type {
  AdvancedSearchFilters,
  AdvancedSearchInterestOrgan,
} from '../../../../types';
import { SearchField } from './sections/SearchField';
import { DateField } from './sections/DateField';
import './AdvancedSearchModal.css';

// Реэкспорт для обратной совместимости (если где-то импортируют из модалки)
export type { AdvancedSearchFilters };

// ============================================================
// Справочники
// ============================================================
const DEVICE_TYPE_OPTIONS = [
  { value: 'switch', label: 'Коммутатор' },
  { value: 'router', label: 'Маршрутизатор' },
  { value: 'firewall', label: 'МСЭ / Firewall' },
  { value: 'server', label: 'Сервер' },
  { value: 'workstation', label: 'АРМ / ПК' },
  { value: 'patch-panel', label: 'Патч-панель' },
  { value: 'media-converter', label: 'Медиаконвертер' },
  { value: 'pbx', label: 'УАТС / АТС' },
  { value: 'modem', label: 'Модем' },
  { value: 'szi', label: 'СЗИ' },
  { value: 'other', label: 'Другое' },
];

const STATUS_OPTIONS = [
  { value: 'in-operation', label: 'Эксплуатируется' },
  { value: 'in-storage', label: 'На складе' },
  { value: 'defective', label: 'Неисправно' },
  { value: 'for-disposal', label: 'На списание' },
  { value: 'disposed', label: 'Списано' },
];

const SECRET_LEVEL_OPTIONS = [
  { value: 'OV', label: 'ОВ' },
  { value: 'SS', label: 'СС' },
  { value: 'SECRET', label: 'Секретно' },
  { value: 'DSP', label: 'ДСП' },
];

// ============================================================
// Props
// ============================================================
interface AdvancedSearchModalProps {
  isOpen: boolean;
  filters: AdvancedSearchFilters;
  onFilterChange: (filterType: keyof AdvancedSearchFilters, values: any) => void;
  onClose: () => void;
  onClearFilters: () => void;
  equipment: any[];
}

// ============================================================
// Хелперы
// ============================================================
function uniqueSorted(values: (string | undefined | null)[]): string[] {
  const set = new Set<string>();
  values.forEach((v) => {
    if (v && v.trim()) set.add(v.trim());
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

const EMPTY_INPUTS = {
  names: '',
  serialNumbers: '',
  inventoryNumbers: '',
  assignedTo: '',
  interestOrgans: '',
};

const first = (arr: string[] | undefined | null): string =>
  Array.isArray(arr) && arr.length > 0 ? arr[0] : '';

// ============================================================
// Главный компонент
// ============================================================
export function AdvancedSearchModal({
  isOpen,
  filters,
  onFilterChange,
  onClose,
  onClearFilters,
  equipment,
}: AdvancedSearchModalProps) {
  const safeFilters = useMemo<AdvancedSearchFilters>(() => ({
    names: filters?.names ?? [],
    serialNumbers: filters?.serialNumbers ?? [],
    inventoryNumbers: filters?.inventoryNumbers ?? [],
    categories: filters?.categories ?? [],
    deviceTypes: filters?.deviceTypes ?? [],
    statuses: filters?.statuses ?? [],
    secretLevels: filters?.secretLevels ?? [],
    divisions: filters?.divisions ?? [],
    subdivisions: filters?.subdivisions ?? [],
    facilities: filters?.facilities ?? [],
    assignedTo: filters?.assignedTo ?? [],
    interestOrgans: filters?.interestOrgans ?? [],
    isNetwork: filters?.isNetwork ?? false,
    isClosed: filters?.isClosed ?? false,
    isFreeUse: filters?.isFreeUse ?? false,
    manufacturingDateFrom: filters?.manufacturingDateFrom ?? '',
    manufacturingDateTo: filters?.manufacturingDateTo ?? '',
    exploitationDateFrom: filters?.exploitationDateFrom ?? '',
    exploitationDateTo: filters?.exploitationDateTo ?? '',
  }), [filters]);

  const [currentInputs, setCurrentInputs] = useState(EMPTY_INPUTS);

  const [dateFilters, setDateFilters] = useState({
    manufacturingDateFrom: safeFilters.manufacturingDateFrom,
    manufacturingDateTo: safeFilters.manufacturingDateTo,
    exploitationDateFrom: safeFilters.exploitationDateFrom,
    exploitationDateTo: safeFilters.exploitationDateTo,
  });

  useEffect(() => {
    setDateFilters({
      manufacturingDateFrom: safeFilters.manufacturingDateFrom,
      manufacturingDateTo: safeFilters.manufacturingDateTo,
      exploitationDateFrom: safeFilters.exploitationDateFrom,
      exploitationDateTo: safeFilters.exploitationDateTo,
    });
  }, [
    safeFilters.manufacturingDateFrom,
    safeFilters.manufacturingDateTo,
    safeFilters.exploitationDateFrom,
    safeFilters.exploitationDateTo,
  ]);

  const inputRefs = {
    names: useRef<HTMLInputElement>(null),
    serialNumbers: useRef<HTMLInputElement>(null),
    inventoryNumbers: useRef<HTMLInputElement>(null),
    assignedTo: useRef<HTMLInputElement>(null),
    interestOrgans: useRef<HTMLInputElement>(null),
  };

  // ---- Подсказки ----
  const suggestions = useMemo(() => {
    const names = new Set<string>();
    const serialNumbers = new Set<string>();
    const inventoryNumbers = new Set<string>();
    const assignedTo = new Set<string>();
    const interestOrgans = new Set<string>();

    (equipment || []).forEach((item) => {
      if (item.name) names.add(item.name);
      if (item.serial_number) serialNumbers.add(item.serial_number);
      if (item.inventory_number) inventoryNumbers.add(item.inventory_number);
      if (item.assigned_to?.full_name) assignedTo.add(item.assigned_to.full_name);
      if (item.interest_organ?.name) interestOrgans.add(item.interest_organ.name);
    });

    return {
      names: Array.from(names).sort(),
      serialNumbers: Array.from(serialNumbers).sort(),
      inventoryNumbers: Array.from(inventoryNumbers).sort(),
      assignedTo: Array.from(assignedTo).sort(),
      interestOrgans: Array.from(interestOrgans).sort(),
    };
  }, [equipment]);

  // ---- Опции: КАТЕГОРИЯ (value ↔ name) ----
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    (equipment || []).forEach((e) => {
      const v: string | undefined = e.category?.value;
      if (!v) return;
      if (!map.has(v)) {
        const label: string = e.category?.name || e.category_display || v;
        map.set(v, label);
      }
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [equipment]);

  // ---- Опции: подразделение / отделение / объект ----
  const divisionOptions = useMemo(
    () => uniqueSorted((equipment || []).map((e) => e.division?.name)),
    [equipment],
  );

  const subdivisionOptions = useMemo(() => {
    const selectedDivision = first(safeFilters.divisions);
    if (!selectedDivision) return [] as string[];
    return uniqueSorted(
      (equipment || [])
        .filter((e) => e.division?.name === selectedDivision)
        .map((e) => e.subdivision?.name),
    );
  }, [equipment, safeFilters.divisions]);

  const facilityOptions = useMemo(() => {
    const selectedDivision = first(safeFilters.divisions);
    const filtered = selectedDivision
      ? (equipment || []).filter((e) => e.division?.name === selectedDivision)
      : equipment || [];
    return uniqueSorted(filtered.map((e) => e.facility?.name));
  }, [equipment, safeFilters.divisions]);

  // ============================================================
  // Обработчики
  // ============================================================
  const getInterestOrganByName = (name: string): AdvancedSearchInterestOrgan | undefined => {
    for (const item of equipment || []) {
      if (item.interest_organ?.name === name) return item.interest_organ;
    }
    return undefined;
  };

  const handleInputChange = (filterType: string, value: string) => {
    setCurrentInputs((prev) => ({ ...prev, [filterType]: value }));
  };

  const handleDateChange = (filterType: string, value: string) => {
    setDateFilters((prev) => ({ ...prev, [filterType]: value }));
    onFilterChange(filterType as keyof AdvancedSearchFilters, value);
  };

  const handleFocus = (_filterType: string) => { /* no-op */ };
  const handleBlur = () => { /* no-op */ };

  const handleKeyPress = (e: React.KeyboardEvent, filterType: string) => {
    if (e.key !== 'Enter') return;
    const value = currentInputs[filterType as keyof typeof currentInputs].trim();
    if (!value) return;

    if (filterType === 'interestOrgans') {
      const organ = getInterestOrganByName(value);
      if (organ) {
        onFilterChange('interestOrgans', [...safeFilters.interestOrgans, organ]);
      }
    } else {
      const existing = (safeFilters[filterType as keyof AdvancedSearchFilters] as string[]) || [];
      onFilterChange(filterType as keyof AdvancedSearchFilters, [...existing, value]);
    }

    setCurrentInputs((prev) => ({ ...prev, [filterType]: '' }));
  };

  const removeFilter = (filterType: string, index: number) => {
    if (
      filterType === 'manufacturingDateFrom' ||
      filterType === 'manufacturingDateTo' ||
      filterType === 'exploitationDateFrom' ||
      filterType === 'exploitationDateTo'
    ) {
      onFilterChange(filterType as keyof AdvancedSearchFilters, '');
      setDateFilters((prev) => ({ ...prev, [filterType]: '' }));
    } else {
      const existing =
        (safeFilters[filterType as keyof AdvancedSearchFilters] as any[]) || [];
      const newValues = [...existing];
      newValues.splice(index, 1);
      onFilterChange(filterType as keyof AdvancedSearchFilters, newValues);
    }
  };

  const handleSingleSelectChange = (
    filterKey:
      | 'categories'
      | 'deviceTypes'
      | 'statuses'
      | 'secretLevels'
      | 'subdivisions'
      | 'facilities',
    value: string,
  ) => {
    onFilterChange(filterKey, value ? [value] : []);
  };

  const handleDivisionChange = (value: string) => {
    onFilterChange('divisions', value ? [value] : []);
    onFilterChange('subdivisions', []);
    onFilterChange('facilities', []);
  };

  const handleCheckboxChange = (
    filterKey: 'isNetwork' | 'isClosed' | 'isFreeUse',
    checked: boolean,
  ) => {
    onFilterChange(filterKey, checked);
  };

  const handleApply = () => {
    Object.entries(currentInputs).forEach(([key, value]) => {
      if (value.trim()) {
        if (key === 'interestOrgans') {
          const organ = getInterestOrganByName(value.trim());
          if (organ) {
            onFilterChange('interestOrgans', [...safeFilters.interestOrgans, organ]);
          }
        } else {
          const existing =
            (safeFilters[key as keyof AdvancedSearchFilters] as string[]) || [];
          onFilterChange(key as keyof AdvancedSearchFilters, [...existing, value.trim()]);
        }
      }
    });

    setCurrentInputs(EMPTY_INPUTS);
    onClose();
  };

  const handleClearFilters = () => {
    onClearFilters();
    setCurrentInputs(EMPTY_INPUTS);
    setDateFilters({
      manufacturingDateFrom: '',
      manufacturingDateTo: '',
      exploitationDateFrom: '',
      exploitationDateTo: '',
    });
  };

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRefs.names.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ---- Хелпер: одиночный select ----
  const renderSingleSelect = (
    filterKey:
      | 'categories'
      | 'deviceTypes'
      | 'statuses'
      | 'secretLevels'
      | 'subdivisions'
      | 'facilities',
    label: string,
    options: Array<{ value: string; label?: string }> | string[],
    placeholder = 'Все',
  ) => {
    const currentValue = first(safeFilters[filterKey] as string[] | undefined);
    return (
      <div className="search-field">
        <label>{label}</label>
        <select
          className="as-select"
          value={currentValue}
          onChange={(e) => handleSingleSelectChange(filterKey, e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.value;
            const text = typeof opt === 'string' ? opt : (opt.label || opt.value);
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  // ---- Хелпер: чекбокс ----
  const renderCheckbox = (
    filterKey: 'isNetwork' | 'isClosed' | 'isFreeUse',
    label: string,
  ) => (
    <label className="as-checkbox-row">
      <input
        type="checkbox"
        className="as-checkbox"
        checked={!!safeFilters[filterKey]}
        onChange={(e) => handleCheckboxChange(filterKey, e.target.checked)}
      />
      <span className="as-checkbox-label">{label}</span>
    </label>
  );

  return (
    <div className="advanced-search-modal-container">
      <div className="advanced-search-modal">
        {/* Заголовок */}
        <div className="advanced-search-header">
          <div className="advanced-search-title">
            <Filter size={16} />
            <span>Расширенный поиск</span>
          </div>
          <button type="button" onClick={onClose} className="close-button">
            <X size={16} />
          </button>
        </div>

        <div className="advanced-search-groups-row">
          {/* 1. Идентификация */}
          <div className="as-group">
            <div className="as-group-header">
              <Cpu size={14} className="as-group-icon" />
              <span className="as-group-title">Идентификация</span>
            </div>
            <div className="as-fields-grid">
              <SearchField
                type="names"
                label="Название"
                placeholder="Введите название"
                currentInputs={currentInputs}
                filters={safeFilters}
                suggestions={suggestions}
                onInputChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyPress={handleKeyPress}
                onRemoveFilter={removeFilter}
                onSuggestionSelect={(suggestion) => {
                  onFilterChange('names', [...safeFilters.names, suggestion]);
                  setCurrentInputs((prev) => ({ ...prev, names: '' }));
                }}
                inputRef={inputRefs.names}
              />
              <SearchField
                type="serialNumbers"
                label="Серийный номер"
                placeholder="Введите серийный номер"
                currentInputs={currentInputs}
                filters={safeFilters}
                suggestions={suggestions}
                onInputChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyPress={handleKeyPress}
                onRemoveFilter={removeFilter}
                onSuggestionSelect={(suggestion) => {
                  onFilterChange('serialNumbers', [...safeFilters.serialNumbers, suggestion]);
                  setCurrentInputs((prev) => ({ ...prev, serialNumbers: '' }));
                }}
                inputRef={inputRefs.serialNumbers}
              />
              <SearchField
                type="inventoryNumbers"
                label="Инвентарный номер"
                placeholder="Введите инвентарный номер"
                currentInputs={currentInputs}
                filters={safeFilters}
                suggestions={suggestions}
                onInputChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyPress={handleKeyPress}
                onRemoveFilter={removeFilter}
                onSuggestionSelect={(suggestion) => {
                  onFilterChange('inventoryNumbers', [...safeFilters.inventoryNumbers, suggestion]);
                  setCurrentInputs((prev) => ({ ...prev, inventoryNumbers: '' }));
                }}
                inputRef={inputRefs.inventoryNumbers}
              />
            </div>
          </div>

          {/* 2. Классификация */}
          <div className="as-group">
            <div className="as-group-header">
              <Tag size={14} className="as-group-icon" />
              <span className="as-group-title">Классификация</span>
            </div>
            <div className="as-fields-grid">
              {renderSingleSelect('categories', 'Категория', categoryOptions)}
              {renderSingleSelect('deviceTypes', 'Тип устройства', DEVICE_TYPE_OPTIONS)}
              {renderSingleSelect('statuses', 'Статус', STATUS_OPTIONS)}
              {renderSingleSelect('secretLevels', 'Секретность', SECRET_LEVEL_OPTIONS)}
            </div>
          </div>

          {/* 3. Принадлежность */}
          <div className="as-group">
            <div className="as-group-header">
              <User size={14} className="as-group-icon" />
              <span className="as-group-title">Принадлежность</span>
            </div>
            <div className="as-fields-grid">
              <div className="search-field">
                <label>Подразделение</label>
                <select
                  className="as-select"
                  value={first(safeFilters.divisions)}
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

              {first(safeFilters.divisions) && subdivisionOptions.length > 0 && (
                renderSingleSelect('subdivisions', 'Отделение', subdivisionOptions, 'Все отделения')
              )}

              {facilityOptions.length > 0 && (
                renderSingleSelect('facilities', 'Объект', facilityOptions, 'Все объекты')
              )}

              <SearchField
                type="assignedTo"
                label="Закреплено за"
                placeholder="Введите ФИО сотрудника"
                currentInputs={currentInputs}
                filters={safeFilters}
                suggestions={suggestions}
                onInputChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyPress={handleKeyPress}
                onRemoveFilter={removeFilter}
                onSuggestionSelect={(suggestion) => {
                  onFilterChange('assignedTo', [...safeFilters.assignedTo, suggestion]);
                  setCurrentInputs((prev) => ({ ...prev, assignedTo: '' }));
                }}
                inputRef={inputRefs.assignedTo}
              />

              <SearchField
                type="interestOrgans"
                label="В чьих интересах"
                placeholder="Введите организацию или отдел"
                currentInputs={currentInputs}
                filters={{
                  ...safeFilters,
                  interestOrgans: safeFilters.interestOrgans.map((organ) => organ.name),
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
                    onFilterChange('interestOrgans', [...safeFilters.interestOrgans, organ]);
                    setCurrentInputs((prev) => ({ ...prev, interestOrgans: '' }));
                  }
                }}
                inputRef={inputRefs.interestOrgans}
              />
            </div>
          </div>

          {/* 4. Даты */}
          <div className="as-group">
            <div className="as-group-header">
              <CalendarDays size={14} className="as-group-icon" />
              <span className="as-group-title">Даты</span>
            </div>
            <div className="as-fields-grid">
              <DateField
                label="Производство (от)"
                value={dateFilters.manufacturingDateFrom}
                onChange={(value) => handleDateChange('manufacturingDateFrom', value)}
                onRemove={() => removeFilter('manufacturingDateFrom', 0)}
              />
              <DateField
                label="Производство (до)"
                value={dateFilters.manufacturingDateTo}
                onChange={(value) => handleDateChange('manufacturingDateTo', value)}
                onRemove={() => removeFilter('manufacturingDateTo', 0)}
              />
              <DateField
                label="Ввод в экспл. (от)"
                value={dateFilters.exploitationDateFrom}
                onChange={(value) => handleDateChange('exploitationDateFrom', value)}
                onRemove={() => removeFilter('exploitationDateFrom', 0)}
              />
              <DateField
                label="Ввод в экспл. (до)"
                value={dateFilters.exploitationDateTo}
                onChange={(value) => handleDateChange('exploitationDateTo', value)}
                onRemove={() => removeFilter('exploitationDateTo', 0)}
              />
            </div>
          </div>

          {/* 5. Флаги */}
          <div className="as-group">
            <div className="as-group-header">
              <Flag size={14} className="as-group-icon" />
              <span className="as-group-title">Флаги</span>
            </div>
            <div className="as-fields-grid">
              {renderCheckbox('isNetwork', 'Только сетевое оборудование')}
              {renderCheckbox('isClosed', 'Только закрытая техника')}
              {renderCheckbox('isFreeUse', 'Только в безвозмездном пользовании')}
            </div>
          </div>
        </div>

        <div className="advanced-search-actions">
          <button type="button" onClick={handleClearFilters} className="clear-filters-button">
            Очистить все фильтры
          </button>
          <button type="button" onClick={handleApply} className="apply-filters-button">
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}