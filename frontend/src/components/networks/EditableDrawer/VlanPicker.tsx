import React, { useEffect, useMemo, useState } from 'react';
import { networksApi } from '../../../api/networksApi';

interface Props {
    token: string | null;
    value: number | null;
    onChange: (v: number | null) => void;
}

export const VlanPicker: React.FC<Props> = ({ token, value, onChange }) => {
    const [list, setList] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        setLoading(true);
        networksApi.getVlans(token)
            .then(data => { if (!cancelled) setList(Array.isArray(data) ? data : []); })
            .catch(e => {
                console.error('[VlanPicker] getVlans:', e);
                if (!cancelled) setList([]);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return list;
        return list.filter(v =>
            String(v.vlan_id).includes(q) || (v.name || '').toLowerCase().includes(q),
        );
    }, [list, search]);

    const current = list.find(v => v.id === value);

    const choose = (id: number | null) => {
        onChange(id);
        setOpen(false);
    };

    return (
        <div className="picker">
            <button
                type="button"
                className="picker__field"
                onClick={() => setOpen(o => !o)}
            >
                {current ? `${current.name} (VLAN ${current.vlan_id})` : 'Не задан'}
            </button>
            {open && (
                <div
                    className="picker__dropdown"
                    /* ✅ Клик внутри dropdown не должен всплывать до label/кнопки */
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <input
                        autoFocus
                        placeholder="Поиск VLAN..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="picker__list">
                        <div
                            className="picker__item"
                            onClick={() => choose(null)}
                        >
                            — Не задан —
                        </div>
                        {loading && <div className="muted" style={{ padding: 8 }}>Загрузка…</div>}
                        {!loading && filtered.length === 0 && (
                            <div className="muted" style={{ padding: 8 }}>Нет VLAN.</div>
                        )}
                        {!loading && filtered.map(v => (
                            <div
                                key={v.id}
                                className={`picker__item ${v.id === value ? 'active' : ''}`}
                                onClick={() => choose(v.id)}
                            >
                                {v.name} <span className="muted">VLAN {v.vlan_id}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};