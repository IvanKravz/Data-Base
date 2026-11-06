import React, { useEffect, useState } from 'react';
import { networksApi } from '../../../api/networksApi';

interface Props {
    token: string | null;
    networkId: string | undefined;
    onClose: () => void;
    onPick: (ip: {
        id?: number;
        address: string;
        subnet_id: number;
        hostname?: string;
        purpose?: string;
        assigned_to?: string;
    }) => void;
}

export const IpAddressPicker: React.FC<Props> = ({
    token, networkId, onClose, onPick,
}) => {
    const [subnets, setSubnets] = useState<any[]>([]);
    const [subnetId, setSubnetId] = useState<number | null>(null);
    const [hosts, setHosts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [manual, setManual] = useState('');
    const [loadingSubnets, setLoadingSubnets] = useState(false);
    const [loadingHosts, setLoadingHosts] = useState(false);

    useEffect(() => {
        if (!token || !networkId) return;
        let cancelled = false;
        setLoadingSubnets(true);
        networksApi.getSubnets(token, String(networkId))
            .then(data => { if (!cancelled) setSubnets(Array.isArray(data) ? data : []); })
            .catch(e => {
                console.error('[IpAddressPicker] getSubnets:', e);
                if (!cancelled) setSubnets([]);
            })
            .finally(() => { if (!cancelled) setLoadingSubnets(false); });
        return () => { cancelled = true; };
    }, [token, networkId]);

    useEffect(() => {
        if (!token || !subnetId) { setHosts([]); return; }
        let cancelled = false;
        setLoadingHosts(true);
        networksApi.getSubnetHosts(token, subnetId, {
            status: 'free',
            search: search || '',
            limit: 100,
        })
            .then(data => { if (!cancelled) setHosts(Array.isArray(data) ? data : []); })
            .catch(e => {
                console.error('[IpAddressPicker] getSubnetHosts:', e);
                if (!cancelled) setHosts([]);
            })
            .finally(() => { if (!cancelled) setLoadingHosts(false); });
        return () => { cancelled = true; };
    }, [token, subnetId, search]);

    const pickManual = () => {
        if (!subnetId || !manual) return;
        onPick({ address: manual.trim(), subnet_id: subnetId });
    };

    return (
        <div className="ip-picker-overlay" onClick={onClose}>
            <div className="ip-picker-modal" onClick={e => e.stopPropagation()}>
                <div className="ip-picker-modal__header">
                    <h4>Назначить IP-адрес</h4>
                    <button type="button" onClick={onClose} aria-label="Закрыть">✕</button>
                </div>

                <label>
                    Подсеть
                    <select
                        value={subnetId || ''}
                        onChange={e => setSubnetId(Number(e.target.value) || null)}
                    >
                        <option value="">— выберите —</option>
                        {loadingSubnets && <option disabled>Загрузка…</option>}
                        {subnets.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.cidr} — {s.purpose || ''}
                            </option>
                        ))}
                    </select>
                </label>

                {subnetId && (
                    <>
                        <input
                            placeholder="Поиск по адресу/hostname..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                        <div className="ip-picker-list">
                            {loadingHosts && <div className="muted" style={{ padding: 8 }}>Загрузка…</div>}
                            {!loadingHosts && hosts.map(h => (
                                <div key={h.address} className="ip-picker-list__item">
                                    <span className="mono">{h.address}</span>
                                    {h.hostname && <span className="muted">{h.hostname}</span>}
                                    <span className="ip-picker-list__spacer" />
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => onPick({
                                            address: h.address,
                                            subnet_id: subnetId,
                                            hostname: h.hostname,
                                        })}
                                    >
                                        Выбрать
                                    </button>
                                </div>
                            ))}
                            {!loadingHosts && hosts.length === 0 && (
                                <div className="muted" style={{ padding: 8 }}>Свободных нет</div>
                            )}
                        </div>

                        <div className="ip-picker-manual">
                            <input
                                placeholder="Или ввести вручную (адрес)"
                                value={manual}
                                onChange={e => setManual(e.target.value)}
                            />
                            <button type="button" onClick={pickManual}>Создать</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};