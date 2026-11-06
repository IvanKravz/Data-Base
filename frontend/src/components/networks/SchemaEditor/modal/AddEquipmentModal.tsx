import React, { useEffect, useMemo, useState } from 'react';
import { Key, Search, X } from 'lucide-react';
import { equipmentApi } from '../../../../api/equipment';
import { SchemaModal } from './SchemaModal';

interface Props {
    token: string | null;
    facilityId: number;
    facilityName: string;
    excludeIds: Set<number>;
    onClose: () => void;
    onPick: (equipment: any) => Promise<void>;
}

export const AddEquipmentModal: React.FC<Props> = ({
    token, facilityId, facilityName, excludeIds, onClose, onPick,
}) => {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [savingId, setSavingId] = useState<number | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        equipmentApi.getEquipment(token, {
            facility: String(facilityId),
            is_network: 'true',   // ← только сетевое оборудование
        })
            .then(d => setList(Array.isArray(d) ? d : (d.results || [])))
            .catch(e => {
                console.error('[AddEquipmentModal] getEquipment:', e);
                setList([]);
            })
            .finally(() => setLoading(false));
    }, [token, facilityId]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return list
            .filter(e => !excludeIds.has(e.id))
            .filter(e => !q ||
                (e.name || '').toLowerCase().includes(q) ||
                (e.serial_number || '').toLowerCase().includes(q) ||
                (e.inventory_number || '').toLowerCase().includes(q));
    }, [list, excludeIds, search]);

    const pick = async (e: any) => {
        setSavingId(e.id);
        try {
            await onPick(e);
            onClose();
        } finally {
            setSavingId(null);
        }
    };

    return (
        <SchemaModal
            title={`Добавить технику в «${facilityName}»`}
            icon={<Key size={18} />}
            onClose={onClose}
        >
            <div className="schema-search">
                <Search size={16} className="schema-search__icon" />
                <input
                    className="schema-search__input"
                    placeholder="Поиск по названию / серийному..."
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
                        Нет доступной техники. Добавляйте только сетевое
                        оборудование через карточку объекта.
                    </div>
                )}
                {!loading && filtered.map(e => (
                    <div key={e.id} className="schema-list__item">
                        <span className="schema-list__item-icon schema-list__item-icon--equipment">
                            <Key size={16} />
                        </span>
                        <div className="schema-list__item-text">
                            <div className="schema-list__item-title">{e.name}</div>
                            <div className="schema-list__item-sub">
                                {e.device_type_display || 'Сетевое оборудование'}
                                {e.serial_number ? <> · S/N {e.serial_number}</> : null}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="schema-btn schema-btn--primary schema-btn--sm"
                            disabled={savingId === e.id}
                            onClick={() => pick(e)}
                        >
                            {savingId === e.id ? '…' : 'Добавить'}
                        </button>
                    </div>
                ))}
            </div>
        </SchemaModal>
    );
};