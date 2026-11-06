import React, { useEffect, useMemo, useState } from 'react';
import { Building, Search, X } from 'lucide-react';
import { networksApi } from '../../../../api/networksApi';
import { SchemaModal } from './SchemaModal';

interface Props {
    token: string | null;
    excludeIds: Set<number>;
    onClose: () => void;
    onPick: (division: any) => Promise<void>;
}

export const AddDivisionModal: React.FC<Props> = ({ token, excludeIds, onClose, onPick }) => {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [savingId, setSavingId] = useState<number | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        networksApi.getDivisions(token)
            .then(setList)
            .catch(e => {
                console.error('[AddDivisionModal] getDivisions:', e);
                setList([]);
            })
            .finally(() => setLoading(false));
    }, [token]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return list
            .filter(d => !excludeIds.has(d.id))
            .filter(d => !q || (d.name || '').toLowerCase().includes(q));
    }, [list, excludeIds, search]);

    const pick = async (d: any) => {
        setSavingId(d.id);
        try {
            await onPick(d);
            onClose();
        } finally {
            setSavingId(null);
        }
    };

    return (
        <SchemaModal
            title="Добавить подразделение на схему"
            icon={<Building size={18} />}
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
                    <div className="schema-empty">Нет доступных подразделений.</div>
                )}
                {!loading && filtered.map(d => (
                    <div key={d.id} className="schema-list__item">
                        <span className="schema-list__item-icon">
                            <Building size={16} />
                        </span>
                        <div className="schema-list__item-text">
                            <div className="schema-list__item-title">{d.name}</div>
                        </div>
                        <button
                            type="button"
                            className="schema-btn schema-btn--primary schema-btn--sm"
                            disabled={savingId === d.id}
                            onClick={() => pick(d)}
                        >
                            {savingId === d.id ? '…' : 'Добавить'}
                        </button>
                    </div>
                ))}
            </div>
        </SchemaModal>
    );
};