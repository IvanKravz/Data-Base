import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Pencil, Trash2, UserPlus } from 'lucide-react';
import { candidatesApi, CandidateDetail, CandidateStage } from '../../api/candidatesApi';
import { useAppPermissions } from '../../api/utils/AppPermissionsContext';
import AccessDenied from '../errors/AccessDenied/AccessDenied';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { CandidatesProgress } from './CandidatesProgress';
import { CandidateTimeline } from './CandidateTimeline';
import { HireDialog } from './HireDialog';
import './styles/candidates.css';
import './styles/CandidateDetailsPage.css';

export function CandidateDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { canAccessPage } = useAppPermissions();

    const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [hireOpen, setHireOpen] = useState(false);

    const canEdit = canAccessPage('Candidate', 'change');
    const canDelete = canAccessPage('Candidate', 'delete');
    const canHire = canEdit && candidate?.status !== 'hired';

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                setIsForbidden(false);
                const data = await candidatesApi.get(id!);
                if (!cancelled) setCandidate(data);
            } catch (e: any) {
                if (cancelled) return;
                if (e?.status === 403) setIsForbidden(true);
                else if (e?.status === 404) setError('Кандидат не найден');
                else setError('Не удалось загрузить данные кандидата');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const handleStageUpdated = (updated: CandidateStage) => {
        setCandidate((prev) => prev ? {
            ...prev,
            stages: prev.stages.map((s) => (s.id === updated.id ? updated : s)),
            progress: {
                ...prev.progress,
                done: prev.stages.filter((s) =>
                    s.id === updated.id ? updated.status === 'done' : s.status === 'done',
                ).length,
            },
            overdue_count: prev.stages.filter((s) =>
                s.id === updated.id ? updated.is_overdue : s.is_overdue,
            ).length,
        } : prev);
    };

    const handleDelete = async () => {
        if (!candidate) return;
        if (!window.confirm(`Удалить кандидата №${candidate.number} — ${candidate.full_name}?`)) return;
        try {
            await candidatesApi.remove(candidate.number);
            navigate('/candidates', { replace: true });
        } catch { /* apiError уже разослан */ }
    };

    if (loading) return <div className="candidates-loading">Загрузка…</div>;
    if (isForbidden) return <AccessDenied />;
    if (error || !candidate) {
        return (
            <div className="candidates-error">
                <AlertCircle size={18} /> {error || 'Кандидат не найден'}
            </div>
        );
    }

    return (
        <div className="candidate-details page-fade-in">
            <header className="candidate-details__header">
                <button
                    type="button"
                    className="candidates-btn candidates-btn--ghost"
                    onClick={() => navigate('/candidates')}
                >
                    <ArrowLeft size={16} /> К списку
                </button>

                <div className="candidate-details__title-block">
                    <h1 className="candidate-details__title">
                        <UserPlus size={22} />
                        {candidate.full_name}
                    </h1>
                </div>

                <div className="candidate-details__actions">
                    {canHire && (
                        <button
                            type="button"
                            className="candidates-btn candidates-btn--primary"
                            onClick={() => setHireOpen(true)}
                        >
                            Принять на службу
                        </button>
                    )}
                    {canEdit && (
                        <button
                            type="button"
                            className="candidates-btn candidates-btn--secondary"
                            onClick={() => navigate(`/candidates/${candidate.number}/edit`)}
                        >
                            <Pencil size={16} /> Редактировать
                        </button>
                    )}
                    {canDelete && (
                        <button
                            type="button"
                            className="candidates-btn candidates-btn--danger"
                            onClick={handleDelete}
                        >
                            <Trash2 size={16} /> Удалить
                        </button>
                    )}
                </div>
            </header>

            <section className="candidate-details__card">
                <div className="candidate-details__grid">
                    <div className="candidate-details__field">
                        <span className="candidate-details__label">Статус</span>
                        <span className="candidate-details__value">
                            <CandidateStatusBadge
                                status={candidate.status}
                                display={candidate.status_display}
                            />
                        </span>
                    </div>
                    {(candidate.status === 'hired'
                        || candidate.status === 'archived'
                        || candidate.status === 'rejected') && candidate.status_changed_at && (
                            <div className="candidate-details__field">
                                <span className="candidate-details__label">Период статуса</span>
                                <span className="candidate-details__value">
                                    {new Date(candidate.status_changed_at).getFullYear()}
                                </span>
                            </div>
                        )}
                    <div className="candidate-details__field">
                        <span className="candidate-details__label">Планируемая должность</span>
                        <span className="candidate-details__value">{candidate.planned_position}</span>
                    </div>
                    <div className="candidate-details__field">
                        <span className="candidate-details__label">Телефон</span>
                        <span className="candidate-details__value">{candidate.phone || '—'}</span>
                    </div>
                    <div className="candidate-details__field">
                        <span className="candidate-details__label">Куратор</span>
                        <span className="candidate-details__value">
                            {candidate.curator_display || '—'}
                        </span>
                    </div>
                    <div className="candidate-details__field">
                        <span className="candidate-details__label">Подразделение</span>
                        <span className="candidate-details__value">
                            {candidate.division_display || '—'}
                        </span>
                    </div>
                </div>

                {candidate.note && (
                    <div className="candidate-details__note">
                        <span className="candidate-details__label">Примечания</span>
                        <p>{candidate.note}</p>
                    </div>
                )}
            </section>

            <section className="candidate-details__progress-section">
                <CandidatesProgress stages={candidate.stages} />
            </section>

            <section className="candidate-details__timeline">
                <h2 className="candidate-details__section-title">График этапов</h2>
                <CandidateTimeline
                    candidateId={candidate.number}
                    stages={candidate.stages}
                    canEdit={canEdit}
                    onStageUpdated={handleStageUpdated}
                />
            </section>

            {hireOpen && (
                <HireDialog
                    candidate={candidate}
                    onClose={() => setHireOpen(false)}
                    onSuccess={(employeeId) => {
                        setHireOpen(false);
                        navigate(`/personnel/${employeeId}`);
                    }}
                />
            )}
        </div>
    );
}