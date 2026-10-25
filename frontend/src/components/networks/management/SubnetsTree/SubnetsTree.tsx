// src/components/networks/management/SubnetsTree/SubnetsTree.tsx
import React, { useMemo, useState } from 'react';
import { Subnet } from '../../types';
import { ChevronRight, Edit, Scissors, Trash2 } from 'lucide-react';
import './SubnetsTree.css';

interface Props {
    subnets: Subnet[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onEdit: (s: Subnet) => void;
    onDelete: (s: Subnet) => void;
    onSplit: (s: Subnet) => void;
}

const SubnetsTree: React.FC<Props> = ({
    subnets, selectedId, onSelect, onEdit, onDelete, onSplit,
}) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const tree = useMemo(() => {
        const map: Record<string, Subnet[]> = {};
        subnets.forEach(s => {
            const key = s.parent || 'root';
            (map[key] ||= []).push(s);
        });
        return map;
    }, [subnets]);

    const toggle = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setExpanded(p => ({ ...p, [id]: !p[id] }));
    };

    const sorted = (arr: Subnet[]) =>
        [...arr].sort((a, b) =>
            a.network_address.localeCompare(b.network_address) ||
            a.prefix_length - b.prefix_length,
        );

    const renderNode = (s: Subnet, depth: number): React.ReactNode => {
        const children = tree[s.id] || [];
        const isOpen = !!expanded[s.id];
        const isSelected = selectedId === s.id;
        const usedRatio = s.host_count ? (s.used_count / s.host_count) * 100 : 0;
        const isFull = usedRatio >= 90;

        return (
            <div key={s.id} className="st-node">
                <div
                    className={`st-row ${isSelected ? 'st-row-selected' : ''}`}
                    style={{ paddingLeft: 8 + depth * 16 }}
                    onClick={() => onSelect(s.id)}
                >
                    <button
                        type="button"
                        className="st-toggle"
                        onClick={e => toggle(e, s.id)}
                        disabled={children.length === 0}
                        style={{ visibility: children.length === 0 ? 'hidden' : 'visible' }}
                    >
                        <ChevronRight
                            size={14}
                            className={`st-toggle-icon ${isOpen ? 'expanded' : ''}`}
                        />
                    </button>

                    <div className="st-main">
                        <div className="st-cidr">
                            {s.cidr}
                            {isFull && <span className="st-full-badge">заполнена</span>}
                        </div>
                        <div className="st-meta">
                            <span className="st-prefix">/{s.prefix_length}</span>
                            {s.vlan_name && <span className="st-vlan">· VLAN {s.vlan_name}</span>}
                            {s.purpose && <span className="st-purpose">· {s.purpose}</span>}
                        </div>
                        <div className="st-usage">
                            <div className="st-usage-bar">
                                <div
                                    className={`st-usage-fill ${isFull ? 'st-usage-full' : ''}`}
                                    style={{ width: `${Math.min(usedRatio, 100)}%` }}
                                />
                            </div>
                            <span className="st-usage-label">
                                {s.used_count}/{s.host_count}
                            </span>
                        </div>
                    </div>

                    <div className="st-actions">
                        <button
                            type="button"
                            title="Разбить"
                            onClick={e => { e.stopPropagation(); onSplit(s); }}
                            disabled={s.prefix_length >= 31 || s.children_count > 0}
                        >
                            <Scissors size={13} />
                        </button>
                        <button
                            type="button"
                            title="Изменить"
                            onClick={e => { e.stopPropagation(); onEdit(s); }}
                        >
                            <Edit size={13} />
                        </button>
                        <button
                            type="button"
                            title="Удалить"
                            onClick={e => { e.stopPropagation(); onDelete(s); }}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                {isOpen && children.length > 0 && (
                    <div>{sorted(children).map(c => renderNode(c, depth + 1))}</div>
                )}
            </div>
        );
    };

    const roots = sorted(tree['root'] || []);

    if (roots.length === 0) {
        return <div className="st-empty">Подсети не найдены</div>;
    }

    return <div className="st-container">{roots.map(r => renderNode(r, 0))}</div>;
};

export default SubnetsTree;