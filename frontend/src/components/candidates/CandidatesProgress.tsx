import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { CandidateStage } from '../../api/candidatesApi';
import { formatDateForServer, formatDisplayDate } from '../../api/utils/dateFormatters';

interface Props {
    stages: CandidateStage[];
}

const PHASES: { key: CandidateStage['phase']; title: string; short: string }[] = [
    { key: 'primary', title: 'Первичное оформление', short: 'Первич.' },
    { key: 'coordination', title: 'Согласование и направление', short: 'Согл.' },
    { key: 'medical', title: 'Медицина и психодиагностика', short: 'Медицина' },
    { key: 'checks', title: 'Проверки и справки', short: 'Проверки' },
    { key: 'interviews', title: 'Собеседования и поручения', short: 'Собесед.' },
    { key: 'attestation', title: 'Аттестация и завершение', short: 'Аттест.' },
];

type SegmentStatus = 'done' | 'overdue' | 'skipped' | 'pending';

const STATUS_LABELS: Record<SegmentStatus, string> = {
    done: 'Выполнен',
    overdue: 'Просрочен',
    skipped: 'Пропущен',
    pending: 'Ожидает',
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** Просрочка: planned в прошлом, actual не установлен, статус не завершён. */
const isOverdue = (stage: CandidateStage): boolean => {
    if (stage.status === 'done' || stage.status === 'skipped') return false;
    if (stage.actual_date) return false;
    if (!stage.planned_date) return false;
    const iso = formatDateForServer(stage.planned_date);
    if (!iso) return false;
    return iso < todayIso();
};

const getSegmentStatus = (stage: CandidateStage): SegmentStatus => {
    if (isOverdue(stage)) return 'overdue';
    if (stage.status === 'done') return 'done';
    if (stage.status === 'skipped') return 'skipped';
    return 'pending';
};

const buildTooltip = (stage: CandidateStage, status: SegmentStatus): string => {
    const lines: string[] = [`№${stage.order}. ${stage.stage_type_display}`];
    if (stage.planned_date) lines.push(`План: ${formatDisplayDate(stage.planned_date)}`);
    if (stage.actual_date) lines.push(`Факт: ${formatDisplayDate(stage.actual_date)}`);
    lines.push(`Статус: ${STATUS_LABELS[status]}`);
    return lines.join('\n');
};

export function CandidatesProgress({ stages }: Props) {
    const grouped = useMemo(() => {
        const map = new Map<string, CandidateStage[]>();
        for (const s of stages) {
            if (!map.has(s.phase)) map.set(s.phase, []);
            map.get(s.phase)!.push(s);
        }
        for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
        return map;
    }, [stages]);

    const stats = useMemo(() => {
        let done = 0;
        let overdue = 0;
        let skipped = 0;
        const total = stages.length;
        for (const s of stages) {
            const st = getSegmentStatus(s);
            if (st === 'done') done += 1;
            else if (st === 'overdue') overdue += 1;
            else if (st === 'skipped') skipped += 1;
        }
        return { done, overdue, skipped, total };
    }, [stages]);

    const percent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

    const handleSegmentClick = (stageId: number) => {
        const el = document.getElementById(`stage-${stageId}`);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        el.classList.add('candidates-stage-card--highlight');
        window.setTimeout(() => {
            el.classList.remove('candidates-stage-card--highlight');
        }, 1200);
    };

    return (
        <div className="candidates-progress">
            <div className="candidates-progress__head">
                <span className="candidates-progress__label">Прогресс прохождения</span>
                <span className="candidates-progress__counters">
                    <span className="candidates-progress__counter">
                        {stats.done} / {stats.total}
                    </span>
                    <span className="candidates-progress__percent">{percent}%</span>
                    {stats.overdue > 0 && (
                        <span className="candidates-overdue-pill">
                            <AlertCircle size={14} /> {stats.overdue} просрочено
                        </span>
                    )}
                </span>
            </div>

            <div className="candidates-progress__phases">
                {PHASES.map(({ key, title, short }) => {
                    const items = grouped.get(key) ?? [];
                    if (items.length === 0) return null;
                    const done = items.filter((s) => getSegmentStatus(s) === 'done').length;
                    return (
                        <div
                            key={key}
                            className="candidates-progress-phase"
                            style={{ flexGrow: items.length }}
                        >
                            <div className="candidates-progress-phase__header">
                                <span className="candidates-progress-phase__title" title={title}>
                                    {short}
                                </span>
                                <span className="candidates-progress-phase__counter">
                                    {done}/{items.length}
                                </span>
                            </div>
                            <div className="candidates-progress-phase__segments">
                                {items.map((s) => {
                                    const status = getSegmentStatus(s);
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            className={`candidates-progress-segment candidates-progress-segment--${status}`}
                                            data-tooltip={buildTooltip(s, status)}
                                            aria-label={`Этап ${s.order}: ${s.stage_type_display}`}
                                            onClick={() => handleSegmentClick(s.id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="candidates-progress__legend">
                <span className="candidates-progress-legend">
                    <span className="candidates-progress-legend__dot candidates-progress-legend__dot--done" />
                    Выполнен
                </span>
                <span className="candidates-progress-legend">
                    <span className="candidates-progress-legend__dot candidates-progress-legend__dot--overdue" />
                    Просрочен
                </span>
                <span className="candidates-progress-legend">
                    <span className="candidates-progress-legend__dot candidates-progress-legend__dot--pending" />
                    Ожидает
                </span>
                <span className="candidates-progress-legend">
                    <span className="candidates-progress-legend__dot candidates-progress-legend__dot--skipped" />
                    Пропущен
                </span>
            </div>
        </div>
    );
}