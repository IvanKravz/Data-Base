// components/divisions/DivisionDetails/sections/CommunicationPosts/PostSelect.tsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import './styles/CommunicationPosts.css';

export interface PostSelectOption {
  value: string;
  /** Основной текст (например, тип объекта). */
  label: string;
  /** Второстепенный текст (например, адрес). */
  description?: string;
}

interface PostSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: PostSelectOption[];
  placeholder?: string;
  emptyOption?: { value: string; label: string };
  disabled?: boolean;
  id?: string;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
}

const DROPDOWN_MAX_HEIGHT = 240;

export function PostSelect({
  value,
  onChange,
  options,
  placeholder = 'Выберите значение',
  emptyOption,
  disabled = false,
  id,
  loading = false,
  loadingText = 'Загрузка...',
  emptyText = 'Нет доступных вариантов',
  searchable = false,
  searchPlaceholder = 'Поиск...',
  noResultsText = 'Ничего не найдено',
}: PostSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
    openUp: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = disabled || loading;

  const allOptions: PostSelectOption[] = emptyOption
    ? [{ value: emptyOption.value, label: emptyOption.label }, ...options]
    : options;

  const selected = allOptions.find(o => o.value === value);
  const hasRealValue = Boolean(
    selected && (!emptyOption || selected.value !== emptyOption.value),
  );

  const displayText = loading
    ? loadingText
    : selected
      ? selected.label
      : placeholder;

  const valueTitle = selected
    ? (selected.description
        ? `${selected.label} — ${selected.description}`
        : selected.label)
    : undefined;

  // ─── Фильтрация по поиску ───
  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => {
      const inLabel = o.label.toLowerCase().includes(q);
      const inDesc = o.description
        ? o.description.toLowerCase().includes(q)
        : false;
      return inLabel || inDesc;
    });
  }, [options, searchable, searchQuery]);

  // ─── Позиционирование ───
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp =
      spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;

    setDropdownPos({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // ─── Автофокус поиска при открытии ───
  useEffect(() => {
    if (!open || !searchable) return;
    const id = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, searchable]);

  // ─── Сброс поиска при закрытии ───
  useEffect(() => {
    if (!open) setSearchQuery('');
  }, [open]);

  // ─── Закрытие по клику вне / Escape / скроллу ───
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const handleToggle = () => {
    if (isDisabled) return;
    setOpen(v => !v);
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
  };

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <>
      <div className="add-post-select-container">
        <button
          type="button"
          ref={triggerRef}
          id={id}
          className={[
            'add-post-select-display',
            open ? 'add-post-select-display--open' : '',
            isDisabled ? 'add-post-select-display--disabled' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={handleToggle}
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span
            className={`add-post-select-display__value${
              !hasRealValue ? ' add-post-select-display__value--placeholder' : ''
            }`}
            title={valueTitle}
          >
            {selected ? (
              <>
                <span className="add-post-select-display__label">
                  {selected.label}
                </span>
                {selected.description && (
                  <>
                    <span className="add-post-select-display__sep"> — </span>
                    <span className="add-post-select-display__desc">
                      {selected.description}
                    </span>
                  </>
                )}
              </>
            ) : (
              displayText
            )}
          </span>
          <ChevronDown
            size={16}
            className="add-post-select-display__icon"
          />
        </button>
      </div>

      {open && !isDisabled && dropdownPos &&
        createPortal(
          <div
            ref={dropdownRef}
            className="add-post-select-options"
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              transform: dropdownPos.openUp
                ? 'translateY(-100%)'
                : undefined,
            }}
          >
            <div className="add-post-select-scroll" role="listbox">
              {/* Sticky header: только поле поиска */}
              {searchable && (
                <div className="add-post-select-sticky-header">
                  <div className="add-post-select-search">
                    <Search
                      size={14}
                      className="add-post-select-search__icon"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="add-post-select-search__input"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={searchPlaceholder}
                      aria-label="Поиск"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="add-post-select-search__clear"
                        onClick={() => {
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        aria-label="Очистить поиск"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Контент: пустая опция + опции — скроллятся вместе */}
              <div className="add-post-select-list-content">
                {emptyOption && (
                  <div
                    role="option"
                    aria-selected={emptyOption.value === value}
                    className={[
                      'add-post-select-option',
                      'add-post-select-option--empty',
                      'add-post-select-option--empty-first',
                      emptyOption.value === value
                        ? 'add-post-select-option--selected'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleSelect(emptyOption.value)}
                  >
                    <span className="add-post-select-option__text">
                      <span className="add-post-select-option__label">
                        {emptyOption.label}
                      </span>
                    </span>
                    {emptyOption.value === value && (
                      <Check
                        size={14}
                        className="add-post-select-option__check"
                      />
                    )}
                  </div>
                )}

                {options.length === 0 && (
                  <div className="add-post-select-options__empty">
                    {emptyText}
                  </div>
                )}

                {options.length > 0 && filteredOptions.length === 0 && (
                  <div className="add-post-select-options__empty">
                    {noResultsText}
                  </div>
                )}

                {filteredOptions.map(opt => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      className={[
                        'add-post-select-option',
                        isSelected ? 'add-post-select-option--selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleSelect(opt.value)}
                    >
                      <div className="add-post-select-option__text">
                        <span className="add-post-select-option__label">
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span className="add-post-select-option__desc">
                            {opt.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check
                          size={14}
                          className="add-post-select-option__check"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}