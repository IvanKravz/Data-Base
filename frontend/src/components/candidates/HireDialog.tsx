import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  Phone,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { candidatesApi, CandidateDetail } from '../../api/candidatesApi';
import { divisionsApi } from '../../api';
import { useEscapeKey } from '../../api/utils/useEscapeKey';
import './styles/candidates.css';
import './styles/CandidateModals.css';

interface Props {
  candidate: Pick<
    CandidateDetail,
    'number' | 'full_name' | 'planned_position' | 'phone' | 'division'
  >;
  onClose: () => void;
  onSuccess: (employeeId: number) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'management',      label: 'Руководство' },
  { value: 'officer',         label: 'Офицер' },
  { value: 'warrant_officer', label: 'Прапорщик' },
  { value: 'civilian',        label: 'Гражданский персонал' },
] as const;

interface DivisionOption {
  id: number;
  name: string;
}

export function HireDialog({ candidate, onClose, onSuccess }: Props) {
  const [divisionId, setDivisionId] = useState<number | null>(
    candidate.division?.id ?? null,
  );
  const [category, setCategory] = useState<string>('civilian');

  const [divisions, setDivisions] = useState<DivisionOption[]>([]);
  const [divisionsLoading, setDivisionsLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => {
    if (!submitting) onClose();
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDivisionsLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken') ?? '';
        const data = await divisionsApi.getDivisions(token);
        const list = Array.isArray(data) ? data : (data as any)?.results ?? [];
        if (!cancelled) {
          setDivisions(list.map((d: any) => ({ id: d.id, name: d.name })));
        }
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить список подразделений');
        }
      } finally {
        if (!cancelled) setDivisionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (divisionId != null) return;
    if (divisions.length === 0) return;
    setDivisionId(divisions[0].id);
  }, [divisions, divisionId]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !submitting) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (divisionId == null) {
      setError('Укажите подразделение');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const employee = await candidatesApi.hire(candidate.number, {
        division: divisionId,
        category,
      });
      onSuccess(employee.id);
    } catch (e: any) {
      setError(e?.message || 'Не удалось выполнить приём');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !submitting && !divisionsLoading && divisionId != null;

  return createPortal(
    <div
      ref={backdropRef}
      className="candidates-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hire-dialog-title"
    >
      <div className="candidates-modal" onClick={(e) => e.stopPropagation()}>
        {/* ============ Header ============ */}
        <header className="candidates-modal__header">
          <h3 id="hire-dialog-title">
            <UserPlus size={18} />
            Приём на службу
          </h3>
          <button
            type="button"
            className="candidates-modal__close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </header>

        {/* ============ Body ============ */}
        <div className="candidates-modal__body">
          <p className="candidates-modal__hint">
            <Info size={16} />
            Из кандидата будет создана учётная запись сотрудника. Переносятся:
            ФИО, планируемая должность, телефон. Остальные поля (звание,
            подкатегория и т.п.) дозаполняются в карточке сотрудника.
          </p>

          {/* Сводка по кандидату */}
          <div className="hire-dialog__summary">
            <div className="hire-dialog__summary-header">
              <User size={14} />
              Данные кандидата
            </div>
            <div className="hire-dialog__summary-row">
              <span className="hire-dialog__summary-label">
                <User size={13} />
                Кандидат
              </span>
              <span className="hire-dialog__summary-value">
                №{candidate.number} — {candidate.full_name}
              </span>
            </div>
            <div className="hire-dialog__summary-row">
              <span className="hire-dialog__summary-label">
                <Briefcase size={13} />
                Должность
              </span>
              <span className="hire-dialog__summary-value">
                {candidate.planned_position}
              </span>
            </div>
            <div className="hire-dialog__summary-row">
              <span className="hire-dialog__summary-label">
                <Phone size={13} />
                Телефон
              </span>
              <span className="hire-dialog__summary-value">
                {candidate.phone || '—'}
              </span>
            </div>
          </div>

          {error && (
            <div className="candidates-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Поля */}
          <div className="candidates-form-row">
            <label className="candidates-form-label" htmlFor="hire-division">
              <Building2 size={13} />
              Подразделение *
            </label>
            <div className="candidates-form-select">
              <select
                id="hire-division"
                autoFocus
                value={divisionId ?? ''}
                disabled={divisionsLoading || submitting}
                onChange={(e) =>
                  setDivisionId(e.target.value ? Number(e.target.value) : null)
                }
              >
                {divisionsLoading && <option value="">Загрузка…</option>}
                {!divisionsLoading && divisions.length === 0 && (
                  <option value="">Нет доступных подразделений</option>
                )}
                {!divisionsLoading && divisions.length > 0 && (
                  <>
                    <option value="">— выберите —</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown size={16} className="candidates-form-select__chevron" />
            </div>
          </div>

          <div className="candidates-form-row">
            <label className="candidates-form-label" htmlFor="hire-category">
              <Users size={13} />
              Категория *
            </label>
            <div className="candidates-form-select">
              <select
                id="hire-category"
                value={category}
                disabled={submitting}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Users size={16} className="candidates-form-select__chevron" />
            </div>
          </div>
        </div>

        {/* ============ Footer ============ */}
        <footer className="candidates-modal__footer">
          <button
            type="button"
            className="candidates-btn candidates-btn--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Отмена
          </button>
          <button
            type="button"
            className="candidates-btn candidates-btn--primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="candidates-modal__spinner" />
                Приём…
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Принять
              </>
            )}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}