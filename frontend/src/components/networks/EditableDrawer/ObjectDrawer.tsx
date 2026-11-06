// src/components/networks/EditableDrawer/ObjectDrawer.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    X, Info, Cpu, Layers, GitBranch, Shield, ExternalLink, Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InterfacesTab } from './InterfacesTab';
import { networksApi } from '../../../api/networksApi';
import './styles/EquipmentDrawer.css';
import './styles/ObjectDrawer.css';

export type DrawerObjectType = 'division' | 'facility' | 'equipment' | 'edge';

interface Props {
    open: boolean;
    objectType: DrawerObjectType | null;
    object: any;
    token: string | null;
    networkId: string | undefined;
    /** Права на редактирование сетевых настроек (NetworkInterface.change). */
    canEdit: boolean;
    onClose: () => void;
    onChanged?: () => void;
    /**
     * Удаление объекта из схемы (снять membership).
     * Не вызывается для edge — там удаление через DirectionEditor.
     */
    onDelete?: (type: DrawerObjectType, obj: any) => Promise<void> | void;
}

type Tab = 'info' | 'interfaces' | 'ip-addresses' | 'vlans' | 'routing' | 'acls';

const EQUIPMENT_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Инфо', icon: <Info size={14} /> },
    { key: 'interfaces', label: 'Интерфейсы', icon: <Cpu size={14} /> },
    { key: 'ip-addresses', label: 'IP', icon: <Layers size={14} /> },
    { key: 'vlans', label: 'VLAN', icon: <Layers size={14} /> },
    { key: 'routing', label: 'Маршруты', icon: <GitBranch size={14} /> },
    { key: 'acls', label: 'ACL', icon: <Shield size={14} /> },
];

export const ObjectDrawer: React.FC<Props> = ({
    open, objectType, object, token, networkId, canEdit,
    onClose, onChanged, onDelete,
}) => {
    const [tab, setTab] = useState<Tab>('info');
    const navigate = useNavigate();

    // При смене объекта — возвращаемся на «Инфо»
    useEffect(() => { setTab('info'); }, [object?.id, objectType]);

    // Без прав — принудительно «Инфо» (вкладки не показываем)
    useEffect(() => {
        if (!canEdit && tab !== 'info') setTab('info');
    }, [canEdit, tab]);

    const isEquipment = objectType === 'equipment';
    const isEdge = objectType === 'edge';
    const shouldRender = open && !!object;
    const showTabs = isEquipment && canEdit;

    const typeLabelText = useMemo(() => {
        if (!objectType) return '';
        if (objectType === 'equipment') return 'Структурная схема';
        return typeLabel(objectType, object);
    }, [objectType, object]);

    return (
        <aside className={`object-drawer ${shouldRender ? 'object-drawer--open' : ''}`}>
            {shouldRender && (
                <>
                    <header className="object-drawer__head">
                        <div className="object-drawer__title">
                            <span className="object-drawer__type">{typeLabelText}</span>
                            <h3>{object.name || (isEdge ? 'Соединение' : 'Без названия')}</h3>
                        </div>
                        <div className="object-drawer__head-actions">
                            {isEquipment && (
                                <button
                                    type="button"
                                    className="object-drawer__close"
                                    title="Открыть полную карточку техники"
                                    onClick={() => navigate(`/equipment/${object.id}`)}
                                >
                                    <ExternalLink size={16} />
                                </button>
                            )}
                            {!isEdge && onDelete && canEdit && (
                                <button
                                    type="button"
                                    className="object-drawer__close object-drawer__close--danger"
                                    title="Удалить из схемы"
                                    onClick={() => onDelete(objectType as DrawerObjectType, object)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button
                                type="button"
                                className="object-drawer__close"
                                onClick={onClose}
                                aria-label="Закрыть"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </header>

                    {showTabs && (
                        <nav className="object-drawer__tabs">
                            {EQUIPMENT_TABS.map(t => (
                                <button
                                    key={t.key}
                                    type="button"
                                    className={`object-drawer__tab ${tab === t.key ? 'active' : ''}`}
                                    onClick={() => setTab(t.key)}
                                >
                                    {t.icon}<span>{t.label}</span>
                                </button>
                            ))}
                        </nav>
                    )}

                    <div className="object-drawer__body">
                        {isEdge && (
                            <DirectionEditor
                                direction={object}
                                token={token}
                                canEdit={canEdit}
                                onChanged={onChanged}
                                onClose={onClose}
                            />
                        )}

                        {isEquipment && tab === 'info' && (
                            <ObjectInfo objectType="equipment" object={object} />
                        )}

                        {isEquipment && canEdit && tab === 'interfaces' && (
                            <InterfacesTab
                                token={token}
                                networkId={networkId}
                                equipment={object}
                                canEdit={canEdit}
                                onChanged={onChanged}
                            />
                        )}

                        {isEquipment && canEdit && tab === 'ip-addresses' && (
                            <EquipmentIpAddressesTab token={token} equipment={object} />
                        )}

                        {isEquipment && canEdit && tab === 'vlans' && (
                            <EquipmentVlansTab token={token} equipment={object} />
                        )}

                        {isEquipment && canEdit && tab === 'routing' && (
                            <EquipmentRoutingTab token={token} equipment={object} />
                        )}

                        {isEquipment && canEdit && tab === 'acls' && (
                            <EquipmentAclsTab token={token} equipment={object} />
                        )}

                        {!isEquipment && !isEdge && (
                            <ObjectInfo
                                objectType={objectType as 'division' | 'facility'}
                                object={object}
                            />
                        )}
                    </div>
                </>
            )}
        </aside>
    );
};

/* =====================================================================
 * helpers / ObjectInfo / мини-вкладки / DirectionEditor
 * ===================================================================== */

function typeLabel(type: DrawerObjectType | null, obj: any): string {
    if (!type) return '';
    if (type === 'division') return 'Подразделение';
    if (type === 'edge') return 'Соединение';

    const pick = (...vals: any[]) => {
        for (const v of vals) {
            if (typeof v === 'string' && v.trim()) return v;
            if (v && typeof v === 'object' && typeof v.name === 'string') return v.name;
        }
        return '';
    };
    if (type === 'facility') {
        return pick(
            obj?.facility_type_display, obj?.type_display,
            obj?.category, obj?.facility_type, obj?.type,
        ) || 'Объект';
    }
    return pick(obj?.device_type_display, obj?.category, obj?.device_type) || 'Оборудование';
}

const ObjectInfo: React.FC<{
    objectType: 'division' | 'facility' | 'equipment';
    object: any;
}> = ({ objectType, object }) => {
    const rows = buildInfoRows(objectType, object);
    if (!rows.length) return <div className="object-info__empty">Нет данных.</div>;
    return (
        <dl className="object-info__list">
            {rows.map(([label, value], idx) => (
                <div key={idx} className="object-info__row">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                </div>
            ))}
        </dl>
    );
};

function buildInfoRows(
    type: 'division' | 'facility' | 'equipment',
    o: any,
): [string, string][] {
    const rows: [string, string][] = [];
    const push = (label: string, v: any) => {
        if (v === null || v === undefined || v === '' || typeof v === 'object') return;
        rows.push([label, String(v)]);
    };
    const pick = (...vals: any[]) => {
        for (const v of vals) {
            if (typeof v === 'string' && v.trim()) return v;
            if (v && typeof v === 'object' && typeof v.name === 'string') return v.name;
        }
        return '';
    };

    if (type === 'division') {
        push('Название', o.name);
        push('Тип', pick(o.division_type_display, o.type_display, o.division_type, o.type));
        push('Адрес', o.address || o.location);
        push('Телефон', o.phone);
        push('Email', o.email);
        push('Описание', o.description);
    } else if (type === 'facility') {
        push('Название', o.name);
        push('Тип', pick(o.facility_type_display, o.type_display, o.category, o.facility_type, o.type));
        push('Подразделение', pick(o.division));
        push('Отделение', pick(o.subdivision));
        push('Адрес', o.address || o.location);
        push('Описание', o.description);
    } else {
        push('Название', o.name);
        push('Тип устройства', pick(o.device_type_display, o.device_type));
        push('Категория', pick(o.category));
        push('Статус', pick(o.status_display, o.status));
        push('Серийный №', o.serial_number);
        push('Инвентарный №', o.inventory_number);
        push('Подразделение', pick(o.division));
        push('Объект', pick(o.facility));
        push('Ответственный', pick(o.assigned_to));
        push('Версия ПО', o.ver_software);
        push('MAC', o.mac_address);
        push('Комментарии', o.comments);
    }
    return rows;
}

/* =====================================================================
 * Вкладки оборудования
 * ===================================================================== */

const EquipmentIpAddressesTab: React.FC<{ token: string | null; equipment: any }> = ({ token, equipment }) => {
    const [ips, setIps] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !equipment?.id) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        networksApi.getIPAddresses(token, { interface__equipment: equipment.id })
            .then(list => { if (!cancelled) setIps(list); })
            .catch(e => {
                if (cancelled) return;
                setError('Не удалось загрузить IP-адреса');
                console.error('[ObjectDrawer] getIPAddresses:', e);
                setIps([]);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, equipment?.id]);

    const statusLabel: Record<string, string> = {
        free: 'Свободен', reserved: 'Зарезервирован', in_use: 'Используется', deprecated: 'Устарел',
    };

    if (loading) return <div className="muted">Загрузка…</div>;
    if (error) return <div className="object-settings__error">{error}</div>;
    if (!ips.length) return (
        <div className="object-info__empty">
            У оборудования нет назначенных IP-адресов.<br />
            Назначайте IP через вкладку «Интерфейсы».
        </div>
    );

    return (
        <div className="drawer-mini-scroll">
            <table className="drawer-mini-table">
                <thead><tr><th>Адрес</th><th>Интерфейс</th><th>Статус</th><th>Hostname</th></tr></thead>
                <tbody>
                    {ips.map(ip => (
                        <tr key={ip.id}>
                            <td><code>{ip.address}</code></td>
                            <td>{ip.interface_name || '—'}</td>
                            <td>
                                <span className={`badge badge--ip badge--ip-${ip.status}`}>
                                    {statusLabel[ip.status] || ip.status}
                                </span>
                            </td>
                            <td>{ip.hostname || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const EquipmentVlansTab: React.FC<{ token: string | null; equipment: any }> = ({ token, equipment }) => {
    const [ifaces, setIfaces] = useState<any[]>([]);
    const [allVlans, setAllVlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token || !equipment?.id) return;
        let cancelled = false;
        setLoading(true);
        Promise.all([
            networksApi.getNetworkInterfaces(token, { equipment: equipment.id }).catch(() => []),
            networksApi.getVlans(token).catch(() => []),
        ])
            .then(([i, v]) => {
                if (cancelled) return;
                setIfaces(i || []); setAllVlans(v || []);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, equipment?.id]);

    const usedVlanIds = useMemo(() => {
        const s = new Set<number>();
        ifaces.forEach((i: any) => {
            if (i.access_vlan) s.add(i.access_vlan);
            if (i.native_vlan) s.add(i.native_vlan);
            (i.vlan_configurations || []).forEach((vc: any) => {
                if (vc.vlan) s.add(vc.vlan);
            });
        });
        return s;
    }, [ifaces]);

    const vlans = useMemo(
        () => allVlans.filter(v => usedVlanIds.has(v.id)),
        [allVlans, usedVlanIds],
    );

    if (loading) return <div className="muted">Загрузка…</div>;
    if (!vlans.length) return (
        <div className="object-info__empty">
            VLAN не используются на этом оборудовании.<br />
            Привязка VLAN — через вкладку «Интерфейсы» (access/native).
        </div>
    );

    return (
        <div className="drawer-mini-scroll">
            <table className="drawer-mini-table">
                <thead><tr><th>VLAN</th><th>Название</th><th>Описание</th></tr></thead>
                <tbody>
                    {vlans.map(v => (
                        <tr key={v.id}>
                            <td><b>{v.vlan_id}</b></td>
                            <td>{v.name}</td>
                            <td className="muted">{v.description || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const EquipmentRoutingTab: React.FC<{ token: string | null; equipment: any }> = ({ token, equipment }) => {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !equipment?.id) return;
        let cancelled = false;
        setLoading(true); setError(null);
        networksApi.getRoutingTable(token, equipment.id)
            .then(list => { if (!cancelled) setRows(list || []); })
            .catch(e => {
                if (cancelled) return;
                console.error('[ObjectDrawer] getRoutingTable:', e);
                setError('Не удалось загрузить маршруты'); setRows([]);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, equipment?.id]);

    if (loading) return <div className="muted">Загрузка…</div>;
    if (error) return <div className="object-settings__error">{error}</div>;
    if (!rows.length) return <div className="object-info__empty">Маршруты не заданы.</div>;

    return (
        <div className="drawer-mini-scroll">
            <table className="drawer-mini-table">
                <thead><tr><th>Сеть</th><th>Маска</th><th>Шлюз</th><th>Метрика</th></tr></thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.id}>
                            <td><code>{r.network}</code></td>
                            <td><code>{r.netmask}</code></td>
                            <td><code>{r.gateway}</code></td>
                            <td>{r.metric}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const EquipmentAclsTab: React.FC<{ token: string | null; equipment: any }> = ({ token, equipment }) => {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !equipment?.id) return;
        let cancelled = false;
        setLoading(true); setError(null);
        networksApi.getAcls(token, equipment.id)
            .then(list => { if (!cancelled) setRows(list || []); })
            .catch(e => {
                if (cancelled) return;
                console.error('[ObjectDrawer] getAcls:', e);
                setError('Не удалось загрузить ACL'); setRows([]);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, equipment?.id]);

    if (loading) return <div className="muted">Загрузка…</div>;
    if (error) return <div className="object-settings__error">{error}</div>;
    if (!rows.length) return <div className="object-info__empty">ACL не заданы.</div>;

    return (
        <div className="drawer-mini-scroll">
            <table className="drawer-mini-table">
                <thead><tr><th>#</th><th>Действие</th><th>Протокол</th><th>Источник</th><th>Назначение</th></tr></thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.id}>
                            <td>{r.sequence}</td>
                            <td>
                                <span className={`badge badge--${r.action === 'permit' ? 'ok' : 'danger'}`}>
                                    {r.action}
                                </span>
                            </td>
                            <td>{r.protocol}</td>
                            <td><code>{r.source_network || 'any'}</code></td>
                            <td><code>{r.destination_network || 'any'}</code></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/* =====================================================================
 * DirectionEditor — как было
 * ===================================================================== */

const SIDES: [string, string][] = [
    ['top', 'Сверху'], ['bottom', 'Снизу'], ['left', 'Слева'], ['right', 'Справа'],
];

const DirectionEditor: React.FC<{
    direction: any;
    token: string | null;
    canEdit: boolean;
    onChanged?: () => void;
    onClose: () => void;
}> = ({ direction, token, canEdit, onChanged, onClose }) => {
    const [form, setForm] = useState({
        label: direction.label || '',
        cable_type: direction.cable_type || '',
        from_handle: direction.from_handle || 'bottom',
        to_handle: direction.to_handle || 'top',
        bandwidth: direction.bandwidth ?? '',
        latency: direction.latency ?? '',
        description: direction.description || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setForm({
            label: direction.label || '',
            cable_type: direction.cable_type || '',
            from_handle: direction.from_handle || 'bottom',
            to_handle: direction.to_handle || 'top',
            bandwidth: direction.bandwidth ?? '',
            latency: direction.latency ?? '',
            description: direction.description || '',
        });
    }, [direction.id]);

    const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
        setForm(f => ({ ...f, [k]: v }));

    const save = async () => {
        if (!token) return;
        setSaving(true); setError(null);
        try {
            await networksApi.updateNetworkDirection(token, direction.id, {
                label: form.label,
                cable_type: form.cable_type,
                from_handle: form.from_handle,
                to_handle: form.to_handle,
                bandwidth: form.bandwidth === '' ? null : Number(form.bandwidth),
                latency: form.latency === '' ? null : Number(form.latency),
                description: form.description,
            } as any);
            onChanged?.();
        } catch {
            setError('Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!token || !window.confirm('Удалить соединение?')) return;
        try {
            await networksApi.deleteNetworkDirection(token, direction.id);
            onChanged?.();
            onClose();
        } catch {
            setError('Не удалось удалить');
        }
    };

    return (
        <div className="object-settings">
            <div className="object-info__list" style={{ marginBottom: 12 }}>
                <div className="object-info__row">
                    <dt>Откуда</dt>
                    <dd>{direction.from_membership_details?.equipment?.name || '—'}</dd>
                </div>
                <div className="object-info__row">
                    <dt>Куда</dt>
                    <dd>{direction.to_membership_details?.equipment?.name || '—'}</dd>
                </div>
            </div>

            <label>Сторона источника
                <select value={form.from_handle} onChange={e => set('from_handle', e.target.value)} disabled={!canEdit}>
                    {SIDES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </label>

            <label>Сторона приёмника
                <select value={form.to_handle} onChange={e => set('to_handle', e.target.value)} disabled={!canEdit}>
                    {SIDES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </label>

            <label>Метка кабеля
                <input value={form.label} onChange={e => set('label', e.target.value)} disabled={!canEdit} />
            </label>

            <label>Тип кабеля
                <input value={form.cable_type} onChange={e => set('cable_type', e.target.value)} disabled={!canEdit} />
            </label>

            <label>Пропускная способность (Mbps)
                <input type="number" value={form.bandwidth} onChange={e => set('bandwidth', e.target.value)} disabled={!canEdit} />
            </label>

            <label>Задержка (ms)
                <input type="number" value={form.latency} onChange={e => set('latency', e.target.value)} disabled={!canEdit} />
            </label>

            <label>Описание
                <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} disabled={!canEdit} />
            </label>

            {error && <div className="object-settings__error">{error}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {canEdit && (
                    <button type="button" className="btn-primary" disabled={saving} onClick={save}>
                        {saving ? 'Сохранение…' : 'Сохранить'}
                    </button>
                )}
                {canEdit && (
                    <button type="button" className="btn-danger" onClick={remove}>Удалить</button>
                )}
                {!canEdit && (
                    <div className="muted" style={{ fontSize: '0.82rem' }}>
                        Нет прав на редактирование соединений
                    </div>
                )}
            </div>
        </div>
    );
};