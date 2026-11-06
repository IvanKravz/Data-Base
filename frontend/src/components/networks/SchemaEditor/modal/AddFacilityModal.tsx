import React, { useEffect, useMemo, useState } from 'react';
import { Factory, Search, X } from 'lucide-react';
import { networksApi } from '../../../../api/networksApi';
import { SchemaModal } from './SchemaModal';

interface Props {
    token: string | null;
    divisionId: number;
    divisionName: string;
    excludeIds: Set<number>;
    onClose: () => void;
    onPick: (facility: any) => Promise<void>;
}

export const AddFacilityModal: React.FC<Props> = ({
    token, divisionId, divisionName, excludeIds, onClose, onPick,
}) => {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [savingId, setSavingId] = useState<number | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        networksApi.getFacilities(token, divisionId)
            .then(setList)
            .catch(e => {
                console.error('[AddFacilityModal] getFacilities:', e);
                setList([]);
            })
            .finally(() => setLoading(false));
    }, [token, divisionId]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return list
            .filter(f => !excludeIds.has(f.id))
            .filter(f => !q || (f.name || '').toLowerCase().includes(q));
    }, [list, excludeIds, search]);

    const pick = async (f: any) => {
        setSavingId(f.id);
        try {
            await onPick(f);
            onClose();
        } finally {
            setSavingId(null);
        }
    };

    return (
        <SchemaModal
            title={`Добавить объект в «${divisionName}»`}
            icon={<Factory size={18} />}
            onClose={onClose}
        >
            <div className="schema-search">
                <Search size={16} className="schema-search__icon" />
                <input
                    className="schema-search__input"
                    placeholder="Поиск по названию..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                />
                {search && (
                    <button
                        type="button"
                        className="schema-search__clear"
                        onClick={() => setSearch('')}
                        aria-label="Очистить"
                        title="Очистить"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="schema-list">
                {loading && <div className="schema-empty">Загрузка…</div>}
                {!loading && filtered.length === 0 && (
                    <div className="schema-empty">
                        Нет доступных объектов в этом подразделении.
                    </div>
                )}
                {!loading && filtered.map(f => (
                    <div key={f.id} className="schema-list__item">
                        <span className="schema-list__item-icon schema-list__item-icon--facility">
                            <Factory size={16} />
                        </span>
                        <div className="schema-list__item-text">
                            <div className="schema-list__item-title">{f.name}</div>
                            {f.type_display && (
                                <div className="schema-list__item-sub">{f.type_display}</div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="schema-btn schema-btn--primary schema-btn--sm"
                            disabled={savingId === f.id}
                            onClick={() => pick(f)}
                        >
                            {savingId === f.id ? '…' : 'Добавить'}
                        </button>
                    </div>
                ))}
            </div>
        </SchemaModal>
    );
};