// components/networks/InterfacesTable/InterfacesTable.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Search } from 'lucide-react';
import { networksApi } from '../../../api/networksApi';
import { NetworkSchemaPayload } from '../../../types';
import './InterfacesTable.css';

interface InterfacesTableProps {
    token: string | null;
    schemaPayload: NetworkSchemaPayload;
    canEdit: boolean;
    onOpenDrawer: (equipment: any) => void;
    onChanged?: () => void;
}

export const InterfacesTable: React.FC<InterfacesTableProps> = ({
    token, schemaPayload, canEdit, onOpenDrawer, onChanged,
}) => {
    const [equipmentFilter, setEquipmentFilter] = useState<string>('');
    const [interfaces, setInterfaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const equipmentList = useMemo(() => {
        const map = new Map<number, any>();
        schemaPayload.memberships.forEach(m => {
            if (m.equipment) map.set(m.equipment.id, m.equipment);
        });
        return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [schemaPayload]);

    const equipmentById = useMemo(() => {
        const m = new Map<number, any>();
        equipmentList.forEach(e => m.set(e.id, e));
        return m;
    }, [equipmentList]);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                if (equipmentFilter) {
                    const list = await networksApi.getNetworkInterfaces(token, {
                        equipment: equipmentFilter,
                    });
                    if (!cancelled) setInterfaces(list);
                } else {
                    // грузим по всем equipment — параллельно
                    const results = await Promise.all(
                        equipmentList.map(eq =>
                            networksApi
                                .getNetworkInterfaces(token, { equipment: eq.id })
                                .catch(() => []),
                        ),
                    );
                    if (!cancelled) setInterfaces(results.flat());
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();

        return () => { cancelled = true; };
    }, [token, equipmentFilter, equipmentList]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return interfaces;
        return interfaces.filter((iface: any) => {
            const eqName = equipmentById.get(iface.equipment)?.name || '';
            const haystack = `${iface.name} ${iface.mode || ''} ${iface.mac_address || ''} ${eqName}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [interfaces, search, equipmentById]);

    const remove = async (id: number) => {
        if (!token || !window.confirm('Удалить интерфейс?')) return;
        await networksApi.deleteNetworkInterface(token, id);
        setInterfaces(prev => prev.filter((i: any) => i.id !== id));
        onChanged?.();
    };

    return (
        <div className="ifaces-table-view">
            <div className="ifaces-toolbar">
                <div className="ifaces-toolbar__search">
                    <Search size={16} className="ifaces-toolbar__icon" />
                    <input
                        placeholder="Поиск по имени, MAC, оборудованию..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <select
                    className="ifaces-toolbar__select"
                    value={equipmentFilter}
                    onChange={e => setEquipmentFilter(e.target.value)}
                >
                    <option value="">Всё оборудование</option>
                    {equipmentList.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                </select>

                {canEdit && equipmentFilter && (
                    <button
                        className="btn-primary"
                        onClick={() => onOpenDrawer(equipmentById.get(Number(equipmentFilter)))}
                    >
                        <Plus size={16} /> Управление интерфейсами
                    </button>
                )}
            </div>

            {loading && <div className="muted">Загрузка...</div>}

            {!loading && filtered.length === 0 && (
                <div className="ifaces-empty">
                    Интерфейсы не найдены. Откройте оборудование и добавьте интерфейсы.
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="ifaces-table-wrap">
                    <table className="ifaces-table">
                        <thead>
                            <tr>
                                <th>Оборудование</th>
                                <th>Имя</th>
                                <th>Тип</th>
                                <th>Режим</th>
                                <th>Access VLAN</th>
                                <th>Native VLAN</th>
                                <th>MAC</th>
                                <th>IP</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((iface: any) => {
                                const eq = equipmentById.get(iface.equipment);
                                const ips = iface.ip_addresses || [];
                                return (
                                    <tr key={iface.id}>
                                        <td className="ifaces-table__eq">{eq?.name || '—'}</td>
                                        <td><strong>{iface.name}</strong></td>
                                        <td>{iface.interface_type}</td>
                                        <td>{iface.mode}{iface.is_trunk ? ' · trunk' : ''}</td>
                                        <td>{iface.access_vlan_name || '—'}</td>
                                        <td>{iface.native_vlan_name || '—'}</td>
                                        <td className="mono">{iface.mac_address || '—'}</td>
                                        <td className="mono">
                                            {ips.length === 0 ? '—' : ips.map((ip: any) => ip.address).join(', ')}
                                        </td>
                                        <td>
                                            <div className="ifaces-actions">
                                                {canEdit && eq && (
                                                    <button
                                                        className="icon-btn"
                                                        onClick={() => onOpenDrawer(eq)}
                                                        title="Открыть оборудование"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button
                                                        className="icon-btn icon-btn--danger"
                                                        onClick={() => remove(iface.id)}
                                                        title="Удалить"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};