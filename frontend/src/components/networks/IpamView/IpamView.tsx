// components/networks/IpamView/IpamView.tsx
import React, { useEffect, useState } from 'react';
import { ChevronRight, Layers, Search } from 'lucide-react';
import { networksApi } from '../../../api/networksApi';
import './IpamView.css';

interface IpamViewProps {
    token: string | null;
    networkId: string;
}

export const IpamView: React.FC<IpamViewProps> = ({ token, networkId }) => {
    const [subnets, setSubnets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [hostsCache, setHostsCache] = useState<Record<number, any[]>>({});
    const [hostsLoading, setHostsLoading] = useState<Record<number, boolean>>({});
    const [hostSearch, setHostSearch] = useState<Record<number, string>>({});

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        networksApi.getSubnets(token, networkId)
            .then(setSubnets)
            .finally(() => setLoading(false));
    }, [token, networkId]);

    const toggle = async (subnetId: number) => {
        setExpanded(prev => ({ ...prev, [subnetId]: !prev[subnetId] }));
        if (expanded[subnetId] || hostsCache[subnetId]) return;
        if (!token) return;
        setHostsLoading(prev => ({ ...prev, [subnetId]: true }));
        try {
            const hosts = await networksApi.getSubnetHosts(token, subnetId, { limit: 256 });
            setHostsCache(prev => ({ ...prev, [subnetId]: hosts }));
        } finally {
            setHostsLoading(prev => ({ ...prev, [subnetId]: false }));
        }
    };

    if (loading) return <div className="muted">Загрузка IPAM...</div>;

    return (
        <div className="ipam-view">
            {subnets.length === 0 && (
                <div className="ipam-empty">
                    <Layers size={40} />
                    <p>В этой сети ещё нет подсетей</p>
                    <p className="muted">Создайте подсети в разделе «Управление сетью».</p>
                </div>
            )}

            {subnets.map(subnet => {
                const isOpen = !!expanded[subnet.id];
                const hosts = hostsCache[subnet.id] || [];
                const search = hostSearch[subnet.id] || '';
                const filteredHosts = search
                    ? hosts.filter(h => h.address.includes(search) ||
                        (h.hostname || '').toLowerCase().includes(search.toLowerCase()))
                    : hosts;

                const used = subnet.used_count ?? 0;
                const total = subnet.host_count ?? 0;
                const usedPct = total ? Math.round((used / total) * 100) : 0;

                return (
                    <div key={subnet.id} className="ipam-subnet">
                        <div
                            className="ipam-subnet__head"
                            onClick={() => toggle(subnet.id)}
                        >
                            <span className={`ipam-toggle ${isOpen ? 'expanded' : ''}`}>
                                <ChevronRight size={16} />
                            </span>
                            <strong className="mono">{subnet.cidr}</strong>
                            {subnet.vlan_name && (
                                <span className="ipam-badge">VLAN {subnet.vlan_name}</span>
                            )}
                            <span className="ipam-badge ipam-badge--muted">
                                {subnet.purpose || 'Без назначения'}
                            </span>
                            <span className="ipam-bar">
                                <span className="ipam-bar__fill" style={{ width: `${usedPct}%` }} />
                            </span>
                            <span className="ipam-bar__label">
                                {used} / {total}
                            </span>
                        </div>

                        {isOpen && (
                            <div className="ipam-subnet__body">
                                <div className="ipam-host-search">
                                    <Search size={14} />
                                    <input
                                        placeholder="Поиск по адресу/hostname..."
                                        value={search}
                                        onChange={e => setHostSearch(prev => ({ ...prev, [subnet.id]: e.target.value }))}
                                    />
                                </div>

                                {hostsLoading[subnet.id] && <div className="muted">Загрузка хостов...</div>}

                                {!hostsLoading[subnet.id] && (
                                    <div className="ipam-host-list">
                                        {filteredHosts.slice(0, 256).map((h: any) => (
                                            <div
                                                key={h.address}
                                                className={`ipam-host ${h.status !== 'free' ? 'ipam-host--used' : ''}`}
                                            >
                                                <span className="mono">{h.address}</span>
                                                {h.status !== 'free' && (
                                                    <>
                                                        <span className={`ipam-status ipam-status--${h.status}`}>
                                                            {h.status}
                                                        </span>
                                                        {h.hostname && <span>{h.hostname}</span>}
                                                        {h.equipment_name && (
                                                            <span className="muted">{h.equipment_name}</span>
                                                        )}
                                                    </>
                                                )}
                                                {h.status === 'free' && (
                                                    <span className="ipam-status ipam-status--free">свободен</span>
                                                )}
                                            </div>
                                        ))}
                                        {filteredHosts.length === 0 && (
                                            <div className="muted">Ничего не найдено</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};