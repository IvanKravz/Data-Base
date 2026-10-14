import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  Info,
  Loader2,
  Phone,
  Save,
  Search,
  User,
  UserCircle2,
  UserPlus,
  X,
} from 'lucide-react';
import { List, type RowComponentProps } from 'react-window';
import { candidatesApi, CandidateWriteData } from '../../api/candidatesApi';
import { divisionsApi } from '../../api';
import { employeesApi } from '../../api/employees';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import './styles/candidates.css';
import './styles/CandidateForm.css';

// ---------------------------------------------------------------- #
// Типы                                                             #
// ---------------------------------------------------------------- #

interface CuratorOption {
  id: number;
  full_name: string;
  position?: string;
  division?: { id: number; name: string } | null;
}

interface EmployeeRowData {
  employees: CuratorOption[];
  onSelect: (emp: CuratorOption) => void;
}

// ---------------------------------------------------------------- #
// Строка виртуального списка сотрудников                           #
// ---------------------------------------------------------------- #

function EmployeeRow({
  index,
  style,
  employees,
  onSelect,
}: RowComponentProps<EmployeeRowData>) {
  const emp = employees[index];
  if (!emp) return null;

  return (
    <button
      type="button"
      style={style}
      className="candidates-curator-option"
      onClick={() => onSelect(emp)}
    >
      <span className="candidates-curator-option__avatar">
        <UserCircle2 size={18} />
      </span>
      <span className="candidates-curator-option__info">
        <span className="candidates-curator-option__name">{emp.full_name}</span>
        {emp.position && (
          <span className="candidates-curator-option__position">{emp.position}</span>
        )}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------- #
// Константы                                                        #
// ---------------------------------------------------------------- #

/**
 * Статус «Принят» здесь ОТСУТСТВУЕТ намеренно:
 * он выставляется только действием «Принять на службу».
 */
const STATUS_OPTIONS = [
  { value: 'active',   label: 'В работе' },
  { value: 'rejected', label: 'Отказ' },
  { value: 'archived', label: 'Архив' },
];

const ROW_HEIGHT = 48;
const MAX_DROPDOWN_HEIGHT = 288;

// ---------------------------------------------------------------- #
// Компонент                                                        #
// ---------------------------------------------------------------- #

export function CandidateForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  // -------------------------------------------------------------- #
  // State                                                          #
  // -------------------------------------------------------------- #
  const [form, setForm] = useState<CandidateWriteData>({
    full_name: '',
    planned_position: '',
    phone: '',
    curator: null,
    division: null,
    custom_division_name: null,
    custom_curator_name: null,
    note: '',
    status: 'active',
  });

  const [divisions, setDivisions] = useState<{ id: number; name: string }[]>([]);
  const [divisionEmployees, setDivisionEmployees] = useState<CuratorOption[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [curatorSearch, setCuratorSearch] = useState('');
  const [curatorDropdownOpen, setCuratorDropdownOpen] = useState(false);
  const [selectedCuratorInfo, setSelectedCuratorInfo] = useState<CuratorOption | null>(null);

  const [isOtherDivision, setIsOtherDivision] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Признак того, что редактируемый кандидат уже принят.
   * В этом режиме селект статуса заменяется read-only бейджем,
   * а поле `status` не отправляется на бэкенд.
   */
  const [isHiredCandidate, setIsHiredCandidate] = useState(false);
  const [hiredStatusDisplay, setHiredStatusDisplay] = useState<string>('Принят');

  const curatorPickerRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem('accessToken') ?? '';

  // -------------------------------------------------------------- #
  // Справочник подразделений                                       #
  // -------------------------------------------------------------- #
  useEffect(() => {
    (async () => {
      try {
        const data = await divisionsApi.getDivisions(token);
        const list = Array.isArray(data) ? data : (data as any)?.results ?? [];
        setDivisions(list.map((d: any) => ({ id: d.id, name: d.name })));
      } catch {
        /* справочник останется пустым */
      }
    })();
  }, [token]);

  // -------------------------------------------------------------- #
  // Загрузка кандидата при редактировании                          #
  // -------------------------------------------------------------- #
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await candidatesApi.get(id!);
        if (cancelled) return;

        const hasCustom = !!(data.custom_division_name || data.custom_curator_name);
        const hired = data.status === 'hired';

        setIsHiredCandidate(hired);
        setHiredStatusDisplay(data.status_display || 'Принят');

        setForm({
          full_name: data.full_name,
          planned_position: data.planned_position,
          phone: data.phone ?? '',
          curator: data.curator?.id ?? null,
          division: data.division?.id ?? null,
          custom_division_name: data.custom_division_name ?? null,
          custom_curator_name: data.custom_curator_name ?? null,
          note: data.note ?? '',
          // Для принятого кандидата статус в форме не меняется
          status: hired ? 'hired' : data.status,
        });
        setIsOtherDivision(hasCustom);

        if (data.curator) {
          setSelectedCuratorInfo({
            id: data.curator.id,
            full_name: data.curator.full_name,
            position: data.curator.position,
          });
        }
      } catch {
        if (!cancelled) setError('Не удалось загрузить данные кандидата');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  // -------------------------------------------------------------- #
  // Сотрудники выбранного подразделения                            #
  // -------------------------------------------------------------- #
  useEffect(() => {
    if (isOtherDivision) return;
    const divisionId = form.division;
    if (!divisionId) {
      setDivisionEmployees([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setEmployeesLoading(true);
        const data = await employeesApi.getPersonnel(token, {
          division: divisionId,
          ordering: 'full_name',
        });
        const list: CuratorOption[] = (Array.isArray(data) ? data : []).map((e: any) => ({
          id: e.id,
          full_name: e.full_name,
          position: e.position,
          division: e.division,
        }));
        if (!cancelled) setDivisionEmployees(list);
      } catch {
        if (!cancelled) setDivisionEmployees([]);
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [form.division, isOtherDivision, token]);

  // -------------------------------------------------------------- #
  // Фильтрация сотрудников по поисковой строке                     #
  // -------------------------------------------------------------- #
  const filteredEmployees = useMemo(() => {
    const q = curatorSearch.trim().toLowerCase();
    if (!q) return divisionEmployees;
    return divisionEmployees.filter((e) =>
      (e.full_name || '').toLowerCase().includes(q) ||
      (e.position || '').toLowerCase().includes(q),
    );
  }, [divisionEmployees, curatorSearch]);

  // -------------------------------------------------------------- #
  // Закрытие дропдауна по клику вне                                #
  // -------------------------------------------------------------- #
  useEffect(() => {
    if (!curatorDropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (curatorPickerRef.current && !curatorPickerRef.current.contains(e.target as Node)) {
        setCuratorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [curatorDropdownOpen]);

  // -------------------------------------------------------------- #
  // Утилиты                                                        #
  // -------------------------------------------------------------- #
  const setField = <K extends keyof CandidateWriteData>(
    key: K,
    value: CandidateWriteData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDivisionChange = (value: string) => {
    const newDivisionId = value ? Number(value) : null;
    setForm((prev) => ({
      ...prev,
      division: newDivisionId,
      curator: null,
    }));
    setSelectedCuratorInfo(null);
    setCuratorSearch('');
  };

  const handleCuratorSelect = (employee: CuratorOption) => {
    setForm((prev) => ({ ...prev, curator: employee.id }));
    setSelectedCuratorInfo(employee);
    setCuratorDropdownOpen(false);
    setCuratorSearch('');
  };

  const handleCuratorClear = () => {
    setForm((prev) => ({ ...prev, curator: null }));
    setSelectedCuratorInfo(null);
  };

  const handleToggleOtherDivision = (next: boolean) => {
    setIsOtherDivision(next);
    if (next) {
      setForm((prev) => ({ ...prev, curator: null, division: null }));
      setSelectedCuratorInfo(null);
      setDivisionEmployees([]);
    } else {
      setForm((prev) => ({
        ...prev,
        custom_division_name: null,
        custom_curator_name: null,
      }));
    }
  };

  // -------------------------------------------------------------- #
  // Submit                                                          #
  // -------------------------------------------------------------- #
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.full_name.trim()) { setError('Укажите ФИО'); return; }
    if (!form.planned_position.trim()) { setError('Укажите планируемую должность'); return; }

    if (isOtherDivision) {
      const cd = (form.custom_division_name || '').trim();
      const cc = (form.custom_curator_name || '').trim();
      if (!cd || !cc) {
        setError('Заполните оба поля: «Подразделение (вручную)» и «Куратор (вручную)».');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: CandidateWriteData = {
        full_name: form.full_name.trim(),
        planned_position: form.planned_position.trim(),
        phone: (form.phone || '').toString().trim() || null,
        note: (form.note || '').toString().trim() || null,
        status: form.status,
        curator: isOtherDivision ? null : (form.curator || null),
        division: isOtherDivision ? null : (form.division || null),
        custom_division_name: isOtherDivision
          ? (form.custom_division_name || '').trim() || null
          : null,
        custom_curator_name: isOtherDivision
          ? (form.custom_curator_name || '').trim() || null
          : null,
      };

      // Принятому кандидату статус не отправляем — он управляется
      // исключительно действием hire.
      if (isHiredCandidate) {
        delete (payload as any).status;
      }

      const saved = isEdit
        ? await candidatesApi.update(id!, payload)
        : await candidatesApi.create(payload);

      navigate(`/candidates/${saved.number}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------- #
  // Рендер                                                          #
  // -------------------------------------------------------------- #
  if (loading) return <div className="candidates-loading">Загрузка…</div>;

  const dropdownHeight = Math.min(
    MAX_DROPDOWN_HEIGHT,
    filteredEmployees.length * ROW_HEIGHT,
  );

  return (
    <div className="candidate-form page-fade-in">
      {/* ============ Заголовок ============ */}
      <header className="candidate-form__header">
        <button
          type="button"
          className="candidates-btn candidates-btn--ghost"
          onClick={() => navigate(isEdit ? `/candidates/${id}` : '/candidates')}
        >
          <ArrowLeft size={16} /> Назад
        </button>
        <h1 className="candidate-form__title">
          <UserPlus size={22} />
          {isEdit ? `Редактирование кандидата №${id}` : 'Новый кандидат'}
        </h1>
      </header>

      {error && (
        <div className="candidates-error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form className="candidate-form__body" onSubmit={handleSubmit}>
        {/* ============ Секция: Основные данные ============ */}
        <section className="candidates-form-section">
          <header className="candidates-form-section__header">
            <span className="candidates-form-section__icon">
              <User size={16} />
            </span>
            <h2 className="candidates-form-section__title">Основные данные</h2>
          </header>

          <div className="candidates-form-section__grid">
            <div className="candidates-form-row">
              <label className="candidates-form-label">
                <User size={16} />
                ФИО *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setField('full_name', e.target.value)}
                maxLength={150}
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>

            <div className="candidates-form-row">
              <label className="candidates-form-label">
                <Briefcase size={16} />
                Планируемая должность *
              </label>
              <input
                type="text"
                value={form.planned_position}
                onChange={(e) => setField('planned_position', e.target.value)}
                maxLength={256}
                placeholder="Инженер"
                required
              />
            </div>

            <div className="candidates-form-row">
              <label className="candidates-form-label">
                <Phone size={16} />
                Телефон
              </label>
              <input
                type="text"
                value={form.phone ?? ''}
                onChange={(e) => setField('phone', e.target.value)}
                maxLength={50}
                placeholder="+7-900-000-00-00"
              />
            </div>

            <div className="candidates-form-row">
              <label className="candidates-form-label">
                <Activity size={16} />
                Статус
              </label>
              {isHiredCandidate ? (
                <div className="candidates-form-status-readonly">
                  <CandidateStatusBadge
                    status="hired"
                    display={hiredStatusDisplay}
                  />
                  <span className="candidates-form-status-readonly__hint">
                    <Info size={13} />
                    Изменяется только действием «Принять на службу».
                  </span>
                </div>
              ) : (
                <div className="candidates-form-select">
                  <select
                    value={form.status}
                    onChange={(e) => setField('status', e.target.value as CandidateWriteData['status'])}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="candidates-form-select__chevron" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============ Секция: Закрепление ============ */}
        <section className="candidates-form-section">
          <header className="candidates-form-section__header">
            <span className="candidates-form-section__icon">
              <Building2 size={16} />
            </span>
            <h2 className="candidates-form-section__title">Закрепление</h2>
          </header>

          <div className="candidates-form-row candidates-form-row--full">
            <label className="candidates-form-checkbox">
              <input
                type="checkbox"
                checked={isOtherDivision}
                onChange={(e) => handleToggleOtherDivision(e.target.checked)}
              />
              <span className="candidates-form-checkbox__box" />
              <span className="candidates-form-checkbox__label">
                Сотрудник другого подразделения
              </span>
            </label>
          </div>

          {!isOtherDivision ? (
            <div className="candidates-form-section__grid">
              <div className="candidates-form-row">
                <label className="candidates-form-label">
                  <Building2 size={16} />
                  Подразделение *
                </label>
                <div className="candidates-form-select">
                  <select
                    value={form.division ?? ''}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                  >
                    <option value="">— выберите —</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="candidates-form-select__chevron" />
                </div>
              </div>

              <div className="candidates-form-row" ref={curatorPickerRef}>
                <label className="candidates-form-label">
                  <UserCircle2 size={16} />
                  Закреплённый сотрудник (куратор)
                </label>

                {selectedCuratorInfo && form.curator ? (
                  <div className="candidates-curator-selected">
                    <span className="candidates-curator-selected__avatar">
                      <UserCircle2 size={20} />
                    </span>
                    <span className="candidates-curator-selected__info">
                      <span className="candidates-curator-selected__name">
                        {selectedCuratorInfo.full_name}
                      </span>
                      {selectedCuratorInfo.position && (
                        <span className="candidates-curator-selected__position">
                          {selectedCuratorInfo.position}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="candidates-curator-selected__clear"
                      onClick={handleCuratorClear}
                      aria-label="Сбросить куратора"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="candidates-curator-picker">
                    <div className="candidates-curator-picker__input">
                      <Search size={16} className="candidates-curator-picker__icon" />
                      <input
                        type="text"
                        placeholder={
                          !form.division
                            ? 'Сначала выберите подразделение'
                            : employeesLoading
                              ? 'Загрузка сотрудников…'
                              : 'Поиск по ФИО или должности…'
                        }
                        value={curatorSearch}
                        disabled={!form.division || employeesLoading}
                        onFocus={() => setCuratorDropdownOpen(true)}
                        onChange={(e) => {
                          setCuratorSearch(e.target.value);
                          setCuratorDropdownOpen(true);
                        }}
                      />
                      {employeesLoading ? (
                        <Loader2 size={16} className="candidates-curator-picker__spinner" />
                      ) : (
                        <ChevronDown
                          size={16}
                          className={`candidates-curator-picker__chevron ${curatorDropdownOpen ? 'is-open' : ''}`}
                        />
                      )}
                    </div>

                    {curatorDropdownOpen && form.division && (
                      <div className="candidates-curator-picker__dropdown">
                        {filteredEmployees.length === 0 ? (
                          <div className="candidates-curator-picker__empty">
                            {employeesLoading ? 'Загрузка…' : 'Ничего не найдено'}
                          </div>
                        ) : (
                          <List
                            rowComponent={EmployeeRow}
                            rowCount={filteredEmployees.length}
                            rowHeight={ROW_HEIGHT}
                            rowProps={{
                              employees: filteredEmployees,
                              onSelect: handleCuratorSelect,
                            }}
                            style={{
                              height: dropdownHeight,
                              width: '100%',
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="candidates-form-section__grid">
              <div className="candidates-form-row">
                <label className="candidates-form-label">
                  <Building2 size={16} />
                  Подразделение (вручную) *
                </label>
                <input
                  type="text"
                  value={form.custom_division_name ?? ''}
                  onChange={(e) => setField('custom_division_name', e.target.value)}
                  maxLength={255}
                  placeholder="Например: Войсковая часть 12345"
                />
              </div>

              <div className="candidates-form-row">
                <label className="candidates-form-label">
                  <UserCircle2 size={16} />
                  Куратор (вручную) *
                </label>
                <input
                  type="text"
                  value={form.custom_curator_name ?? ''}
                  onChange={(e) => setField('custom_curator_name', e.target.value)}
                  maxLength={255}
                  placeholder="ФИО куратора"
                />
              </div>

              <div className="candidates-form-row candidates-form-row--full">
                <div className="candidates-form-hint">
                  <Info size={14} className="candidates-form-hint__icon" />
                  Оба поля обязательны. Используйте этот режим, если куратор
                  не числится в справочнике сотрудников.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============ Секция: Примечания ============ */}
        <section className="candidates-form-section">
          <header className="candidates-form-section__header">
            <span className="candidates-form-section__icon">
              <CalendarDays size={16} />
            </span>
            <h2 className="candidates-form-section__title">Примечания</h2>
          </header>

          <div className="candidates-form-row candidates-form-row--full">
            <textarea
              rows={4}
              value={form.note ?? ''}
              onChange={(e) => setField('note', e.target.value)}
              placeholder="Дополнительная информация о кандидате…"
            />
          </div>
        </section>

        <div className="candidate-form__actions">
          <button
            type="button"
            className="candidates-btn candidates-btn--secondary"
            onClick={() => navigate(isEdit ? `/candidates/${id}` : '/candidates')}
            disabled={saving}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="candidates-btn candidates-btn--primary"
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="candidates-page__spinner" /> : <Save size={16} />}
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}