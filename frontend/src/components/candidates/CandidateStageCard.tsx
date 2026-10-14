import { useState, useRef, useEffect, useMemo } from 'react';
import {
  AlertCircle, CheckCircle2, Circle, MinusCircle, MessageSquare, X, Check,
} from 'lucide-react';
import { CandidateStage, candidatesApi } from '../../api/candidatesApi';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { formatDateForInput, formatDisplayDate, formatDateForServer } from '../../api/utils/dateFormatters';

interface Props {
  stage: CandidateStage;
  candidateId: number;
  canEdit: boolean;
  onStageUpdated: (updated: CandidateStage) => void;
}

type EditingField = 'planned' | 'actual' | 'comment' | null;

const STAGE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Ожидает' },
  { value: 'done', label: 'Выполнен' },
  { value: 'skipped', label: 'Пропущен' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  done: 'Выполнен',
  skipped: 'Пропущен',
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const computeIsOverdue = (
  status: string,
  plannedDate: string | null,
  actualDate: string | null,
): boolean => {
  if (status === 'done' || status === 'skipped') return false;
  // Если фактическая дата установлена — этап фактически пройден,
  // поэтому просрочка не имеет смысла, даже если статус выставлен в pending.
  if (actualDate) return false;
  if (!plannedDate) return false;
  const iso = formatDateForServer(plannedDate);
  if (!iso) return false;
  return iso < todayIso();
};

export function CandidateStageCard({ stage, candidateId, canEdit, onStageUpdated }: Props) {
  const [editing, setEditing] = useState<EditingField>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<Partial<CandidateStage> | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  // Снимаем optimistic-патч, когда родитель прислал свежие данные
  useEffect(() => {
    setOptimistic(null);
  }, [stage.planned_date, stage.actual_date, stage.status, stage.comment]);

  const current = useMemo<CandidateStage>(() => {
    const merged = { ...stage, ...(optimistic ?? {}) };
    const isOverdue = computeIsOverdue(
      merged.status,
      merged.planned_date,
      merged.actual_date,
    );
    return {
      ...merged,
      is_overdue: isOverdue,
      status_display: isOverdue ? 'Просрочен' : (STATUS_LABELS[merged.status] ?? merged.status),
    };
  }, [stage, optimistic]);

  /**
   * Клик вне карточки закрывает любой открытый поповер
   * (редактор комментария / редактор даты / dropdown статуса).
   */
  useEffect(() => {
    if (!editing && !statusOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'OPTION') return;
      if (ref.current && !ref.current.contains(target)) {
        setEditing(null);
        setStatusOpen(false);
        setLocalError(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [editing, statusOpen]);

  const startEdit = (field: EditingField) => {
    if (!canEdit) return;
    setStatusOpen(false);
    setEditing(field);
    setLocalError(null);
    if (field === 'planned') setDraft(formatDateForInput(current.planned_date));
    if (field === 'actual') setDraft(formatDateForInput(current.actual_date));
    if (field === 'comment') setDraft(current.comment ?? '');
  };

  const openStatusMenu = () => {
    if (!canEdit) return;
    setEditing(null);
    setLocalError(null);
    setStatusOpen((v) => !v);
  };

  const save = async (patch: Partial<CandidateStage>) => {
    const rollback = optimistic;

    setOptimistic({ ...(optimistic ?? {}), ...patch });
    setSaving(true);
    setLocalError(null);

    try {
      const updated = await candidatesApi.updateStage(candidateId, stage.id, patch);
      setOptimistic(updated);
      onStageUpdated(updated);
      setEditing(null);
      setStatusOpen(false);
    } catch (e: any) {
      setOptimistic(rollback);
      setLocalError(e?.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusPick = (value: CandidateStage['status']) => {
    setStatusOpen(false);
    if (value === current.status) return;
    save({ status: value });
  };

  /**
   * Мгновенное сохранение даты.
   * Нативный календарь `<input type="date">` при выборе дня отправляет
   * `onChange` со значением в формате `YYYY-MM-DD`, но не эмитит `blur`
   * сразу — поэтому ловим момент выбора здесь, а не на размытии.
   * Промежуточные состояния (частично введённый год/месяц/день) —
   * неполный ISO — игнорируем, чтобы не дёргать PATCH зря.
   */
  const handleDateChange = (field: 'planned' | 'actual', value: string) => {
    setDraft(value);

    // Пустая строка = пользователь очистил поле через календарь.
    if (value === '') {
      if (field === 'planned') {
        save({ planned_date: null });
        return;
      }
      // Очистка фактической даты: если этап был «Выполнен»,
      // возвращаем его в «Ожидает» — факта выполнения больше нет.
      const patch: Partial<CandidateStage> = { actual_date: null };
      if (current.status === 'done') patch.status = 'pending';
      save(patch);
      return;
    }

    // Промежуточные состояния ввода (неполный ISO) не сохраняем
    if (!ISO_DATE_RE.test(value)) return;

    if (field === 'planned') {
      save({ planned_date: value });
      return;
    }
    // Установка actual_date помечает этап выполненным
    save({ actual_date: value, status: 'done' });
  };

  const toggleCommentPopover = () => {
    if (!canEdit) return;
    if (editing === 'comment') {
      setEditing(null);
      setLocalError(null);
      return;
    }
    setStatusOpen(false);
    setEditing('comment');
    setLocalError(null);
    setDraft(current.comment ?? '');
  };

  const icon = (() => {
    if (current.is_overdue) return <AlertCircle size={16} className="candidates-stage-icon--red" />;
    if (current.status === 'done') return <CheckCircle2 size={16} className="candidates-stage-icon--green" />;
    if (current.status === 'skipped') return <MinusCircle size={16} className="candidates-stage-icon--yellow" />;
    return <Circle size={16} className="candidates-stage-icon--gray" />;
  })();

  const statusKey = current.is_overdue ? 'overdue' : current.status;
  const editableCls = canEdit ? 'candidates-stage-card__editable' : '';

  return (
    <div
      ref={ref}
      id={`stage-${stage.id}`}
      className={
        `candidates-stage-card` +
        ` ${current.is_overdue ? 'candidates-stage-card--overdue' : ''}` +
        ` ${saving ? 'candidates-stage-card--saving' : ''}` +
        ` ${editing === 'comment' ? 'candidates-stage-card--comment-open' : ''}` +
        ` ${statusOpen ? 'candidates-stage-card--status-open' : ''}`
      }
    >
      {saving && <div className="candidates-stage-card__saving-bar" />}

      <div className="candidates-stage-card__head">
        <span className="candidates-stage-card__order">{current.order}.</span>
        <span className="candidates-stage-card__title">{current.stage_type_display}</span>
      </div>

      <div className="candidates-stage-card__dates">
        {/* План */}
        <div className="candidates-stage-card__date-row">
          <span className="candidates-stage-card__label">План:</span>
          {editing === 'planned' ? (
            <span className="candidates-stage-card__edit">
              <input
                type="date"
                value={draft}
                autoFocus
                disabled={saving}
                onChange={(e) => handleDateChange('planned', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditing(null);
                }}
              />
            </span>
          ) : (
            <span
              className={`candidates-stage-card__value ${editableCls}`}
              onClick={() => startEdit('planned')}
              title={canEdit ? 'Изменить планируемую дату' : undefined}
            >
              {formatDisplayDate(current.planned_date)}
            </span>
          )}
        </div>

        {/* Факт */}
        <div className="candidates-stage-card__date-row">
          <span className="candidates-stage-card__label">Факт:</span>
          {editing === 'actual' ? (
            <span className="candidates-stage-card__edit">
              <input
                type="date"
                value={draft}
                autoFocus
                disabled={saving}
                onChange={(e) => handleDateChange('actual', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditing(null);
                }}
              />
            </span>
          ) : (
            <span
              className={`candidates-stage-card__value ${editableCls}`}
              onClick={() => startEdit('actual')}
              title={canEdit ? 'Изменить фактическую дату' : undefined}
            >
              {formatDisplayDate(current.actual_date)}
            </span>
          )}
        </div>
      </div>

      {/* Статус + иконка комментария */}
      <div className="candidates-stage-card__footer">
        <span className="candidates-stage-card__status">
          {icon}
          {canEdit ? (
            <span
              className="candidates-stage-card__status-trigger"
              onClick={openStatusMenu}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openStatusMenu();
                }
              }}
              title="Изменить статус"
            >
              <CandidateStatusBadge status={statusKey} display={current.status_display} />
            </span>
          ) : (
            <CandidateStatusBadge status={statusKey} display={current.status_display} />
          )}
        </span>

        <span
          className={`candidates-stage-card__comment ${editableCls}`}
          title={current.comment || (canEdit ? 'Добавить комментарий' : '')}
          onClick={toggleCommentPopover}
        >
          <MessageSquare
            size={14}
            className={current.comment ? 'candidates-stage-card__comment--has' : ''}
          />
        </span>
      </div>

      {/* Поповер выбора статуса */}
      {statusOpen && (
        <div className="candidates-stage-card__status-popover" role="listbox" aria-label="Статус этапа">
          <span className="candidates-stage-card__popover-label">Статус этапа</span>
          {STAGE_STATUS_OPTIONS.map((o) => {
            const active = o.value === current.status;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                className={`candidates-stage-card__status-option ${active ? 'is-active' : ''}`}
                onClick={() => handleStatusPick(o.value as CandidateStage['status'])}
                disabled={saving}
              >
                <span className="candidates-stage-card__status-option-dot" />
                <span>{o.label}</span>
                {active && <Check size={14} className="candidates-stage-card__status-option-check" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Поповер комментария */}
      {editing === 'comment' && (
        <div className="candidates-stage-card__comment-popover">
          <textarea
            autoFocus
            rows={3}
            value={draft}
            disabled={saving}
            placeholder="Комментарий к этапу…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save({ comment: draft });
              if (e.key === 'Escape') setEditing(null);
            }}
          />
          <div className="candidates-stage-card__comment-actions">
            <span className="candidates-stage-card__comment-hint">Ctrl+Enter — сохранить</span>
            <button
              type="button"
              className="candidates-stage-card__comment-btn candidates-stage-card__comment-btn--save"
              onClick={() => save({ comment: draft })}
              disabled={saving}
              aria-label="Сохранить"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              className="candidates-stage-card__comment-btn"
              onClick={() => setEditing(null)}
              disabled={saving}
              aria-label="Отмена"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {localError && <div className="candidates-stage-card__error">{localError}</div>}
    </div>
  );
}