import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, Check, ChevronDown, Download, Loader2, Search, UserPlus,
} from 'lucide-react';
import { candidatesApi, CandidateListItem, CandidateStatus } from '../../api/candidatesApi';
import { divisionsApi } from '../../api';
import { useAppPermissions } from '../../api/utils/AppPermissionsContext';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { useClickOutside } from '../../api/utils/useClickOutside';
import './styles/candidates.css';
import './styles/CandidatesPage.css';

// 'number' больше не сортируется через UI — показываем порядковый номер строки.
type SortKey = 'full_name' | 'division__name' | 'created_at';

const SEARCH_DEBOUNCE_MS = 300;

/** Статус по умолчанию — «В работе». */
const DEFAULT_STATUS: CandidateStatus = 'active';

const STATUS_OPTIONS: { value: CandidateStatus | 'all'; label: string }[] = [
  { value: 'active', label: 'В работе' },
  { value: 'hired', label: 'Принят' },
  { value: 'rejected', label: 'Отказ' },
  { value: 'archived', label: 'Архив' },
  { value: 'all', label: 'Все статусы' },
];

/** Статусы, для которых имеет смысл фильтр по году архива/отказа. */
const YEAR_FILTER_STATUSES = new Set<CandidateStatus | 'all'>(['rejected', 'archived']);

interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  popoverLabel: string;
}

function FilterSelect({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  popoverLabel,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(wrapRef, () => setOpen(false), open);

  const current = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const triggerLabel = current?.label ?? placeholder ?? 'Выберите';

  const handlePick = (val: string) => {
    setOpen(false);
    if (val !== value) onChange(val);
  };

  return (
    <div className="candidates-filter-select" ref={wrapRef}>
      <button
        type="button"
        className={`candidates-filter-select__trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="candidates-filter-select__trigger-label">{triggerLabel}</span>
        <ChevronDown
          size={14}
          className={`candidates-filter-select__chevron ${open ? 'is-open' : ''}`}
        />
      </button>

      {open && (
        <div className="candidates-filter-select__popover" role="listbox" aria-label={ariaLabel}>
          <span className="candidates-filter-select__popover-label">{popoverLabel}</span>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value || '__empty__'}
                type="button"
                role="option"
                aria-selected={active}
                className={`candidates-filter-select__option ${active ? 'is-active' : ''}`}
                onClick={() => handlePick(o.value)}
              >
                <span className="candidates-filter-select__option-dot" />
                <span>{o.label}</span>
                {active && <Check size={14} className="candidates-filter-select__option-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CandidatesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { canAccessPage } = useAppPermissions();

  const divisionFromQuery = searchParams.get('division');
  const stateFrom = (location.state as { from?: string } | null)?.from;

  const showBack = Boolean(stateFrom || divisionFromQuery);

  const [items, setItems] = useState<CandidateListItem[]>([]);
  const [divisions, setDivisions] = useState<{ id: number; name: string }[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<CandidateStatus | 'all'>(DEFAULT_STATUS);
  const [year, setYear] = useState<string>('');
  const [division, setDivision] = useState(divisionFromQuery ?? '');
  // Сортировка по умолчанию — по внутреннему number (стабильный порядок с бэка),
  // но пользователь её не переключает: в шапке колонки «№ п/п» сортировки нет.
  const [ordering, setOrdering] = useState<SortKey | 'number'>('number');
  const [orderDesc, setOrderDesc] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(exportRef, () => setExportOpen(false), exportOpen);

  // Debounce поиска
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Справочник подразделений
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const data = await divisionsApi.getDivisions(token);
        const list = Array.isArray(data) ? data : (data as any)?.results ?? [];
        setDivisions(list.map((d: any) => ({ id: d.id, name: d.name })));
      } catch {
        /* фильтр просто не покажет подразделения */
      }
    })();
  }, []);

  // Загрузка списка.
  // Год НЕ отправляем на бэкенд — фильтруем на клиенте.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (initialLoading) setInitialLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const params: Record<string, any> = {
          ordering: orderDesc ? `-${ordering}` : ordering,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (status) params.status = status;
        if (division) params.division = division;

        const data = await candidatesApi.list(params);
        const list = Array.isArray(data) ? data : (data as any)?.results ?? [];
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) setError('Не удалось загрузить список кандидатов');
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, division, ordering, orderDesc]);

  // Сброс года при смене статуса на «не годовой»
  useEffect(() => {
    if (!YEAR_FILTER_STATUSES.has(status) && year) {
      setYear('');
    }
  }, [status, year]);

  const handleSort = (field: SortKey) => {
    if (field === ordering) {
      setOrderDesc((v) => !v);
    } else {
      setOrdering(field);
      setOrderDesc(false);
    }
  };

  const sortIndicator = (field: SortKey) => {
    if (field !== ordering) return '';
    return orderDesc ? ' ↓' : ' ↑';
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExportOpen(false);
    const params: Record<string, any> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (status && status !== 'all') params.status = status;
    if (status === 'all') params.status = 'all';
    if (division) params.division = division;
    try {
      await candidatesApi.exportFile(format, params);
    } catch {
      /* apiError обработается глобально */
    }
  };

  const handleBack = () => {
    if (stateFrom) {
      navigate(stateFrom);
      return;
    }
    if (divisionFromQuery) {
      navigate(`/divisions/${divisionFromQuery}`);
      return;
    }
    navigate('/personnel');
  };

  const canCreate = canAccessPage('Candidate', 'add');

  const divisionOptions: FilterSelectOption[] = useMemo(
    () => [
      { value: '', label: 'Все подразделения' },
      ...divisions.map((d) => ({ value: String(d.id), label: d.name })),
    ],
    [divisions],
  );

  const yearOptions: FilterSelectOption[] = useMemo(() => {
    const years = new Set<number>();
    for (const c of items) {
      if (typeof c.status_year === 'number') years.add(c.status_year);
    }
    const sorted = Array.from(years).sort((a, b) => b - a);
    return [
      { value: '', label: 'Все годы' },
      ...sorted.map((y) => ({ value: String(y), label: String(y) })),
    ];
  }, [items]);

  const showYearFilter = YEAR_FILTER_STATUSES.has(status);

  // Локальная фильтрация: только просроченные + год (для rejected/archived)
  const visibleItems = useMemo(() => {
    let list = items;
    if (onlyOverdue) list = list.filter((c) => c.overdue_count > 0);
    if (year) list = list.filter((c) => String(c.status_year ?? '') === year);
    return list;
  }, [items, onlyOverdue, year]);

  const showSkeleton = initialLoading;

  return (
    <div className="candidates-page page-fade-in">
      <header className="candidates-page__header">
        <div className="candidates-page__title-block">
          {showBack && (
            <button
              type="button"
              className="candidates-btn candidates-btn--ghost"
              onClick={handleBack}
              title="Назад"
              aria-label="Назад"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <h1 className="candidates-page__title">
            <UserPlus size={24} />
            Кандидаты
            {refreshing && (
              <Loader2
                size={18}
                className="candidates-page__spinner"
                aria-label="Обновление списка"
              />
            )}
          </h1>
          <span className="candidates-page__count">Всего: {items.length}</span>
        </div>

        <div className="candidates-page__actions">
          <div className="candidates-export-dropdown" ref={exportRef}>
            <button
              type="button"
              className="candidates-btn candidates-btn--secondary"
              onClick={() => setExportOpen((v) => !v)}
            >
              <Download size={16} />
              Экспорт
            </button>
            {exportOpen && (
              <div className="candidates-export-dropdown__menu">
                <button type="button" onClick={() => handleExport('csv')}>CSV</button>
                <button type="button" onClick={() => handleExport('xlsx')}>XLSX</button>
              </div>
            )}
          </div>

          {canCreate && (
            <button
              type="button"
              className="candidates-btn candidates-btn--primary"
              onClick={() => navigate('/candidates/create')}
            >
              Добавить кандидата
            </button>
          )}
        </div>
      </header>

      <div className="candidates-filters">
        <div className="candidates-filters__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Поиск по ФИО, должности, телефону…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <FilterSelect
          value={status}
          options={STATUS_OPTIONS as FilterSelectOption[]}
          onChange={(v) => setStatus(v as CandidateStatus | 'all')}
          ariaLabel="Фильтр по статусу"
          popoverLabel="Статус кандидата"
          placeholder="В работе"
        />

        {showYearFilter && (
          <FilterSelect
            value={year}
            options={yearOptions}
            onChange={setYear}
            ariaLabel="Фильтр по году"
            popoverLabel="Год архива / отказа"
            placeholder="Все годы"
          />
        )}

        <FilterSelect
          value={division}
          options={divisionOptions}
          onChange={setDivision}
          ariaLabel="Фильтр по подразделению"
          popoverLabel="Подразделение"
          placeholder="Все подразделения"
        />

        <label className="candidates-filters__checkbox">
          <input
            type="checkbox"
            checked={onlyOverdue}
            onChange={(e) => setOnlyOverdue(e.target.checked)}
          />
          Только просроченные
        </label>
      </div>

      {error && (
        <div className="candidates-error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {showSkeleton ? (
        <div className="candidates-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="candidates-skeleton__row" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="candidates-empty">
          <UserPlus size={40} style={{ opacity: 0.35 }} />
          <p>
            {onlyOverdue
              ? 'Нет кандидатов с просроченными этапами'
              : year
                ? 'Нет кандидатов за выбранный год'
                : status === 'active'
                  ? 'Кандидатов в работе нет'
                  : status === 'hired'
                    ? 'Принятых кандидатов нет'
                    : 'Кандидатов пока нет'}
          </p>
          {canCreate && !onlyOverdue && status === 'active' && (
            <button
              type="button"
              className="candidates-btn candidates-btn--primary"
              onClick={() => navigate('/candidates/create')}
            >
              Добавить первого кандидата
            </button>
          )}
        </div>
      ) : (
        <div className="candidates-table-wrapper">
          {refreshing && <div className="candidates-table-progress" />}
          <table className="candidates-table">
            <thead>
              <tr>
                {/* PK из БД больше не показываем — только порядковый номер строки. */}
                <th className="candidates-table__index-col">№ п/п</th>
                <th className="sortable" onClick={() => handleSort('full_name')}>
                  ФИО{sortIndicator('full_name')}
                </th>
                <th>Планируемая должность</th>
                <th>Телефон</th>
                <th>Куратор</th>
                <th className="sortable" onClick={() => handleSort('division__name')}>
                  Подразделение{sortIndicator('division__name')}
                </th>
                <th>Статус</th>
                <th>Прогресс</th>
                <th>Просрочки</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((c, index) => (
                <tr
                  // key и navigate используют внутренний PK (number) — он остаётся в API.
                  key={c.number}
                  className="candidates-table__row"
                  onClick={() => navigate(`/candidates/${c.number}`)}
                >
                  <td className="candidates-table__num candidates-table__index-col">
                    {index + 1}
                  </td>
                  <td className="candidates-table__name">{c.full_name}</td>
                  <td>{c.planned_position}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.curator_display || '—'}</td>
                  <td>{c.division_display || '—'}</td>
                  <td>
                    <div className="candidates-status-cell">
                      <CandidateStatusBadge status={c.status} display={c.status_display} />
                      {c.status_year != null && (
                        <span
                          className="candidates-status-cell__period"
                          title={`Дата смены статуса: ${c.status_changed_at ?? ''}`}
                        >
                          {c.status_year}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="candidates-progress-cell">
                      <div className="candidates-progress-bar">
                        <div
                          className="candidates-progress-bar__fill"
                          style={{ width: `${(c.progress.done / (c.progress.total || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="candidates-progress-cell__label">
                        {c.progress.done}/{c.progress.total}
                      </span>
                    </div>
                  </td>
                  <td>
                    {c.overdue_count > 0 ? (
                      <span className="candidates-overdue-pill">
                        <AlertCircle size={14} /> {c.overdue_count}
                      </span>
                    ) : (
                      <span className="candidates-overdue-pill candidates-overdue-pill--empty">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}