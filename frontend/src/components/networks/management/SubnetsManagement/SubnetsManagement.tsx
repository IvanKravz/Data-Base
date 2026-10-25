// src/components/networks/management/SubnetsManagement/SubnetsManagement.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Subnet } from '../../../../types';
import { networksApi } from '../../../../api/networksApi';
import SubnetsTree from '../SubnetsTree/SubnetsTree';
import SubnetPanel from '../SubnetPanel/SubnetPanel';
import SubnetModal from '../../modals/SubnetModal';
import SubnetSplitModal from '../../modals/SubnetSplitModal';
import SubnetWizard from '../SubnetWizard/SubnetWizard';
import { Sparkles } from 'lucide-react';
import '../../ManagementPanel.css';
import './SubnetsManagement.css';

interface Props {
    token: string | null;
    networkId?: string;
    initialSelectedId?: string | null;
    onConsumeInitial?: () => void;
}

type ModalState =
    | { kind: 'none' }
    | { kind: 'edit'; subnet: Subnet | null }
    | { kind: 'split'; subnet: Subnet }
    | { kind: 'wizard' };

const SubnetsManagement: React.FC<Props> = ({
    token,
    networkId,
    initialSelectedId,
    onConsumeInitial,
}) => {
    const [subnets, setSubnets] = useState<Subnet[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState>({ kind: 'none' });
    const [search, setSearch] = useState('');

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            setError(null);
            const data = await networksApi.getSubnets(token, networkId);
            setSubnets(data);
            setSelectedId(prev => {
                if (prev && !data.some(s => s.id === prev)) return null;
                return prev;
            });
        } catch (e: any) {
            console.error(e);
            setError(e?.response?.data?.detail || 'Ошибка загрузки подсетей');
        } finally {
            setLoading(false);
        }
    }, [token, networkId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Применение внешнего фокуса (переход из «IP-адреса»)
    useEffect(() => {
        if (!initialSelectedId) return;
        if (subnets.some(s => s.id === initialSelectedId)) {
            setSelectedId(initialSelectedId);
            onConsumeInitial?.();
        }
    }, [initialSelectedId, subnets, onConsumeInitial]);

    const selectedSubnet = selectedId
        ? subnets.find(s => s.id === selectedId) || null
        : null;

    const filteredSubnets = search.trim()
        ? subnets.filter(s =>
            s.cidr.includes(search) ||
            s.purpose.toLowerCase().includes(search.toLowerCase()) ||
            (s.vlan_name || '').toLowerCase().includes(search.toLowerCase()),
        )
        : subnets;

    const handleDelete = async (subnet: Subnet) => {
        if (!token) return;
        if (!window.confirm(`Удалить подсеть ${subnet.cidr}? Все IP-адреса внутри будут удалены.`)) return;
        try {
            await networksApi.deleteSubnet(token, subnet.id);
            if (selectedId === subnet.id) setSelectedId(null);
            fetchData();
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Ошибка удаления');
        }
    };

    if (loading) return <div className="loading">Загрузка подсетей…</div>;

    return (
        <div className="subnets-ipam">
            <div className="subnets-ipam-toolbar">
                <div className="subnets-ipam-search">
                    <input
                        type="text"
                        placeholder="Поиск по CIDR, назначению, VLAN…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    type="button"
                    className="btn-secondary btn-wizard"
                    onClick={() => setModal({ kind: 'wizard' })}
                    title="Мастер: выбрать маску и свободное место"
                >
                    <Sparkles size={14} /> Мастер
                </button>
                <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setModal({ kind: 'edit', subnet: null })}
                >
                    + Добавить подсеть
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="subnets-ipam-body">
                <aside className="subnets-ipam-tree">
                    <SubnetsTree
                        subnets={filteredSubnets}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onEdit={s => setModal({ kind: 'edit', subnet: s })}
                        onDelete={handleDelete}
                        onSplit={s => setModal({ kind: 'split', subnet: s })}
                    />
                </aside>

                <main className="subnets-ipam-panel">
                    {selectedSubnet ? (
                        <SubnetPanel
                            token={token!}
                            subnet={selectedSubnet}
                            onRefresh={fetchData}
                            onEdit={() => setModal({ kind: 'edit', subnet: selectedSubnet })}
                            onSplit={() => setModal({ kind: 'split', subnet: selectedSubnet })}
                            onDelete={() => handleDelete(selectedSubnet)}
                        />
                    ) : (
                        <div className="subnets-ipam-empty">
                            <p>Выберите подсеть слева, чтобы увидеть IP-пул</p>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setModal({ kind: 'edit', subnet: null })}
                            >
                                Создать первую подсеть
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {modal.kind === 'edit' && (
                <SubnetModal
                    token={token!}
                    subnet={modal.subnet}
                    networkId={networkId}
                    onSaved={newId => {
                        setModal({ kind: 'none' });
                        fetchData();
                        if (newId) setSelectedId(String(newId));
                    }}
                    onClose={() => setModal({ kind: 'none' })}
                />
            )}

            {modal.kind === 'split' && (
                <SubnetSplitModal
                    token={token!}
                    subnet={modal.subnet}
                    onSplit={() => { setModal({ kind: 'none' }); fetchData(); }}
                    onClose={() => setModal({ kind: 'none' })}
                />
            )}

            {modal.kind === 'wizard' && (
                <SubnetWizard
                    token={token!}
                    networkId={networkId}
                    onSaved={newId => {
                        setModal({ kind: 'none' });
                        fetchData();
                        if (newId) setSelectedId(String(newId));
                    }}
                    onClose={() => setModal({ kind: 'none' })}
                />
            )}
        </div>
    );
};

export default SubnetsManagement;