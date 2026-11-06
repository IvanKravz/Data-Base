// src/components/networks/management/OverviewTab/OverviewTab.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    VLAN,
    NetworkInterface,
    Subnet,
    IPAddress,
    Equipment,
    SubnetHost,
    NetworkInterfaceInput,
} from '../../../../types';
import { networksApi } from '../../../../api/networksApi';
import SubnetWizard from '../SubnetWizard/SubnetWizard';
import { InterfaceModal } from '../../modals/InterfaceModal';
import VLANModal from '../../modals/VLANModal';
import QuickAddIPModal from '../../modals/QuickAddIPModal';
import {
    Layers,
    Server,
    Boxes,
    Globe,
    AlertTriangle,
    Plus,
    Network as NetworkIcon,
} from 'lucide-react';
import './OverviewTab.css';


interface Props {
    token: string | null;
    onNavigateToTab: (tab: string) => void;
    onNavigateToSubnets: (subnetId: string) => void;
}

interface Problem {
    kind: 'subnet_high_usage' | 'subnet_no_gateway' | 'ip_no_owner' | 'vlan_empty';
    title: string;
    subtitle?: string;
    onClick?: () => void;
}

type AddModal = 'none' | 'subnet' | 'ip' | 'vlan' | 'interface';

const USAGE_WARN = 0.9;
const PROBLEM_LIMIT = 12;

const OverviewTab: React.FC<Props> = ({
    token,
    onNavigateToTab,
    onNavigateToSubnets,
}) => {
    const [vlans, setVlans] = useState<VLAN[]>([]);
    const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
    const [subnets, setSubnets] = useState<Subnet[]>([]);
    const [ips, setIPs] = useState<IPAddress[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addModal, setAddModal] = useState<AddModal>('none');

    const fetchAll = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            setError(null);
            const [v, i, s, a, e] = await Promise.all([
                networksApi.getVlans(token),
                networksApi.getNetworkInterfaces(token),
                networksApi.getSubnets(token),
                networksApi.getIPAddresses(token),
                networksApi.getEquipment(token).catch(() => [] as Equipment[]),
            ]);
            setVlans(v);
            setInterfaces(i);
            setSubnets(s);
            setIPs(a);
            setEquipment(e);
        } catch (e: any) {
            console.error(e);
            setError(e?.response?.data?.detail || 'Не удалось загрузить обзор сети');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ============ Статистика ============
    const stats = useMemo(() => {
        const totalIPs = subnets.reduce((acc, s) => acc + (s.host_count || 0), 0);
        const usedIPs = ips.filter(ip => ip.status !== 'free').length;
        const enabledIfaces = interfaces.filter(i => i.enabled).length;
        const vlanIdsWithSubnets = new Set(subnets.map(s => s.vlan).filter(Boolean));
        return {
            vlansTotal: vlans.length,
            vlansUsed: vlanIdsWithSubnets.size,
            ifacesTotal: interfaces.length,
            ifacesEnabled: enabledIfaces,
            subnetsTotal: subnets.length,
            ipsTotal: totalIPs,
            ipsUsed: usedIPs,
            ipsFree: Math.max(totalIPs - usedIPs, 0),
            ipsUsagePct: totalIPs ? Math.round((usedIPs / totalIPs) * 100) : 0,
        };
    }, [vlans, interfaces, subnets, ips]);

    // ============ Топ-подсети по занятости ============
    const busySubnets = useMemo(() => {
        return [...subnets]
            .filter(s => s.host_count > 0)
            .sort((a, b) => {
                const ra = a.used_count / a.host_count;
                const rb = b.used_count / b.host_count;
                return rb - ra;
            })
            .slice(0, 8);
    }, [subnets]);

    // ============ Проблемы ============
    const problems = useMemo<Problem[]>(() => {
        const list: Problem[] = [];

        subnets.forEach(s => {
            if (!s.host_count) return;
            const ratio = s.used_count / s.host_count;
            if (ratio >= USAGE_WARN) {
                list.push({
                    kind: 'subnet_high_usage',
                    title: `Подсеть ${s.cidr} заполнена на ${Math.round(ratio * 100)}%`,
                    subtitle: `${s.used_count} из ${s.host_count} адресов занято`,
                    onClick: () => onNavigateToSubnets(s.id),
                });
            }
        });

        subnets.forEach(s => {
            if (!s.gateway && s.prefix_length <= 30 && s.host_count > 2) {
                list.push({
                    kind: 'subnet_no_gateway',
                    title: `Подсеть ${s.cidr} без шлюза`,
                    subtitle: 'Для этой маски шлюз обычно нужен',
                    onClick: () => onNavigateToSubnets(s.id),
                });
            }
        });

        ips.forEach(ip => {
            if (ip.status !== 'in_use') return;
            if (!ip.hostname && !ip.assigned_to) {
                list.push({
                    kind: 'ip_no_owner',
                    title: `IP ${ip.address} занят, но не описан`,
                    subtitle: 'Укажите hostname или кому/чему назначен',
                    onClick: () => onNavigateToSubnets(ip.subnet),
                });
            }
        });

        const vlanIdsUsed = new Set(subnets.map(s => s.vlan).filter(Boolean));
        vlans.forEach(v => {
            if (!vlanIdsUsed.has(v.id)) {
                list.push({
                    kind: 'vlan_empty',
                    title: `VLAN ${v.vlan_id} · ${v.name} не используется`,
                    subtitle: 'Ни одна подсеть не привязана к этому VLAN',
                    onClick: () => onNavigateToTab('vlan'),
                });
            }
        });

        return list;
    }, [subnets, ips, vlans, onNavigateToSubnets, onNavigateToTab]);

    const visibleProblems = problems.slice(0, PROBLEM_LIMIT);
    const problemsRest = problems.length - visibleProblems.length;

    // ============ Обработчики добавления ============

    const handleWizardSaved = (createdId?: string) => {
        setAddModal('none');
        fetchAll();
        if (createdId) onNavigateToSubnets(createdId);
    };

    const handleVlanCreated = async (data: Omit<VLAN, 'id'>) => {
        if (!token) return;
        try {
            await networksApi.createVlan(token, data);
            setAddModal('none');
            fetchAll();
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Ошибка создания VLAN');
        }
    };

    const handleInterfaceCreated = async (data: NetworkInterfaceInput) => {
        if (!token) return;
        try {
            await networksApi.createNetworkInterface(token, data);
            setAddModal('none');
            fetchAll();
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Ошибка создания интерфейса');
        }
    };

    const handleIPCreated = async (subnetId: string, hostData: Partial<SubnetHost>) => {
        if (!token) return;
        try {
            await networksApi.saveSubnetHosts(token, subnetId, [hostData]);
            setAddModal('none');
            fetchAll();
        } catch (e: any) {
            throw e; // модалка покажет ошибку у себя
        }
    };

    if (loading) return <div className="loading">Загрузка обзора…</div>;

    return (
        <div className="ov">
            {error && <div className="error">{error}</div>}

            {/* Стат-карточки */}
            <div className="ov-stats">
                <button
                    type="button"
                    className="ov-stat"
                    onClick={() => onNavigateToTab('vlan')}
                    title="Перейти к VLAN"
                >
                    <div className="ov-stat-icon ov-stat-icon-vlan"><Layers size={20} /></div>
                    <div className="ov-stat-body">
                        <div className="ov-stat-label">VLAN</div>
                        <div className="ov-stat-value">{stats.vlansTotal}</div>
                        <div className="ov-stat-sub">{stats.vlansUsed} с подсетями</div>
                    </div>
                </button>

                <button
                    type="button"
                    className="ov-stat"
                    onClick={() => onNavigateToTab('interfaces')}
                    title="Перейти к интерфейсам"
                >
                    <div className="ov-stat-icon ov-stat-icon-ifaces"><Server size={20} /></div>
                    <div className="ov-stat-body">
                        <div className="ov-stat-label">Интерфейсы</div>
                        <div className="ov-stat-value">{stats.ifacesTotal}</div>
                        <div className="ov-stat-sub">{stats.ifacesEnabled} включено</div>
                    </div>
                </button>

                <button
                    type="button"
                    className="ov-stat"
                    onClick={() => onNavigateToTab('subnets')}
                    title="Перейти к подсетям"
                >
                    <div className="ov-stat-icon ov-stat-icon-subnets"><Boxes size={20} /></div>
                    <div className="ov-stat-body">
                        <div className="ov-stat-label">Подсети</div>
                        <div className="ov-stat-value">{stats.subnetsTotal}</div>
                        <div className="ov-stat-sub">
                            {stats.subnetsTotal === 0 ? 'пока нет' : 'во всех префиксах'}
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    className="ov-stat"
                    onClick={() => onNavigateToTab('ipaddresses')}
                    title="Перейти к IP-адресам"
                >
                    <div className="ov-stat-icon ov-stat-icon-ips"><Globe size={20} /></div>
                    <div className="ov-stat-body">
                        <div className="ov-stat-label">IP-адреса</div>
                        <div className="ov-stat-value">{stats.ipsUsed} / {stats.ipsTotal}</div>
                        <div className="ov-stat-sub">
                            {stats.ipsTotal
                                ? `${stats.ipsUsagePct}% занято · ${stats.ipsFree} свободно`
                                : 'нет подсетей'}
                        </div>
                    </div>
                </button>
            </div>

            {/* 2-колоночный блок */}
            <div className="ov-main">
                <section className="ov-card">
                    <header className="ov-card-header">
                        <h3 className="ov-card-title">
                            <NetworkIcon size={16} /> Занятость подсетей
                        </h3>
                        {subnets.length > busySubnets.length && (
                            <button
                                type="button"
                                className="ov-card-link"
                                onClick={() => onNavigateToTab('subnets')}
                            >
                                Все подсети →
                            </button>
                        )}
                    </header>

                    {busySubnets.length === 0 ? (
                        <div className="ov-empty">
                            Подсети ещё не созданы.{' '}
                            <button
                                type="button"
                                className="ov-empty-link"
                                onClick={() => setAddModal('subnet')}
                            >
                                Создать через мастер
                            </button>
                        </div>
                    ) : (
                        <ul className="ov-subnet-list">
                            {busySubnets.map(s => {
                                const ratio = s.host_count ? s.used_count / s.host_count : 0;
                                const pct = Math.round(ratio * 100);
                                const cls =
                                    pct >= 95 ? 'critical' :
                                        pct >= 80 ? 'warn' :
                                            pct >= 50 ? 'mid' : 'ok';
                                return (
                                    <li key={s.id} className="ov-subnet-row">
                                        <button
                                            type="button"
                                            className="ov-subnet-btn"
                                            onClick={() => onNavigateToSubnets(s.id)}
                                        >
                                            <div className="ov-subnet-info">
                                                <div className="ov-subnet-cidr">{s.cidr}</div>
                                                {s.vlan_name && (
                                                    <div className="ov-subnet-vlan">VLAN {s.vlan_name}</div>
                                                )}
                                            </div>
                                            <div className="ov-subnet-usage">
                                                <div className="ov-subnet-bar">
                                                    <div
                                                        className={`ov-subnet-fill ov-subnet-fill-${cls}`}
                                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="ov-subnet-count">
                                                    {s.used_count}/{s.host_count} · {pct}%
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className="ov-card">
                    <header className="ov-card-header">
                        <h3 className="ov-card-title">
                            <AlertTriangle size={16} /> Проблемы
                            {problems.length > 0 && (
                                <span className="ov-problems-count">{problems.length}</span>
                            )}
                        </h3>
                    </header>

                    {problems.length === 0 ? (
                        <div className="ov-empty ov-empty-ok">
                            Проблем не найдено — всё в порядке.
                        </div>
                    ) : (
                        <>
                            <ul className="ov-problems">
                                {visibleProblems.map((p, idx) => (
                                    <li key={`${p.kind}-${idx}`} className={`ov-problem ov-problem-${p.kind}`}>
                                        <button
                                            type="button"
                                            className="ov-problem-btn"
                                            onClick={p.onClick}
                                            disabled={!p.onClick}
                                        >
                                            <span className="ov-problem-icon">
                                                <AlertTriangle size={14} />
                                            </span>
                                            <span className="ov-problem-body">
                                                <span className="ov-problem-title">{p.title}</span>
                                                {p.subtitle && (
                                                    <span className="ov-problem-sub">{p.subtitle}</span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {problemsRest > 0 && (
                                <div className="ov-problems-more">
                                    и ещё {problemsRest}{' '}
                                    {problemsRest === 1 ? 'проблема' : 'проблем'}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>

            {/* Быстрые действия — реальные кнопки добавления */}
            <section className="ov-card ov-quick">
                <header className="ov-card-header">
                    <h3 className="ov-card-title"><Plus size={16} /> Быстрые действия</h3>
                </header>
                <div className="ov-quick-grid">
                    <button type="button" className="ov-quick-btn" onClick={() => setAddModal('subnet')}>
                        <Plus size={14} /> Подсеть
                    </button>
                    <button type="button" className="ov-quick-btn" onClick={() => setAddModal('ip')}>
                        <Plus size={14} /> IP-адрес
                    </button>
                    <button type="button" className="ov-quick-btn" onClick={() => setAddModal('vlan')}>
                        <Plus size={14} /> VLAN
                    </button>
                    <button type="button" className="ov-quick-btn" onClick={() => setAddModal('interface')}>
                        <Plus size={14} /> Интерфейс
                    </button>
                </div>
                <div className="ov-quick-hint">
                    Открывает модалку создания. «Подсеть» — мастер с выбором маски и свободного места.
                </div>
            </section>

            {/* Модалки */}
            {addModal === 'subnet' && (
                <SubnetWizard
                    token={token!}
                    onSaved={handleWizardSaved}
                    onClose={() => setAddModal('none')}
                />
            )}
            {addModal === 'vlan' && (
                <VLANModal
                    vlan={null}
                    onSave={handleVlanCreated}
                    onClose={() => setAddModal('none')}
                />
            )}
            {addModal === 'interface' && (
                <InterfaceModal
                    interface={null}
                    equipmentList={equipment}
                    vlanList={vlans}
                    onSave={handleInterfaceCreated}
                    onClose={() => setAddModal('none')}
                />
            )}
            {addModal === 'ip' && (
                <QuickAddIPModal
                    token={token!}
                    subnets={subnets}
                    onSave={handleIPCreated}
                    onClose={() => setAddModal('none')}
                />
            )}
        </div>
    );
};

export default OverviewTab;