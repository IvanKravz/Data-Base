import { useMemo } from 'react';
import { CandidateStage } from '../../api/candidatesApi';
import { CandidateStageCard } from './CandidateStageCard';

interface Props {
  candidateId: number;
  stages: CandidateStage[];
  canEdit: boolean;
  onStageUpdated: (updated: CandidateStage) => void;
}

const PHASE_ORDER: { key: CandidateStage['phase']; title: string }[] = [
  { key: 'primary',      title: 'Первичное оформление' },
  { key: 'coordination', title: 'Согласование и направление' },
  { key: 'medical',      title: 'Медицина и психодиагностика' },
  { key: 'checks',       title: 'Проверки и справки' },
  { key: 'interviews',   title: 'Собеседования и поручения' },
  { key: 'attestation',  title: 'Аттестация и завершение' },
];

export function CandidateTimeline({ candidateId, stages, canEdit, onStageUpdated }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, CandidateStage[]>();
    for (const s of stages) {
      if (!map.has(s.phase)) map.set(s.phase, []);
      map.get(s.phase)!.push(s);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [stages]);

  return (
    <div className="candidates-timeline-scroll">
      <div className="candidates-timeline-track">
        {PHASE_ORDER.map(({ key, title }) => {
          const items = grouped.get(key) ?? [];
          if (items.length === 0) return null;
          const done = items.filter((s) => s.status === 'done').length;
          return (
            <section key={key} className="candidates-timeline-phase">
              <header className="candidates-timeline-phase__header">
                <h4 className="candidates-timeline-phase__title">{title}</h4>
                <span className="candidates-timeline-phase__counter">{done}/{items.length}</span>
              </header>
              <div className="candidates-timeline-phase__stages">
                {items.map((s) => (
                  <CandidateStageCard
                    key={s.id}
                    stage={s}
                    candidateId={candidateId}
                    canEdit={canEdit}
                    onStageUpdated={onStageUpdated}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}