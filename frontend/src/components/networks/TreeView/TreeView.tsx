// components/networks/TreeView/TreeView.tsx
import React, { useState, useEffect } from 'react';
import {
    ChevronRight, Building, Server, Cpu, Factory,
} from 'lucide-react';
import { Network } from '../../../types';
import './TreeView.css';

interface TreeViewProps {
    network: Network | null;
    memberships: any[];
    onHighlightNode?: (id: string | null) => void;
    onClearHighlight?: () => void;
    onNodeSelect?: (nodeId: string) => void;
}

const getStringValue = (v: any): string => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return v.toString();
    if (v && typeof v === 'object' && v.name) return v.name;
    return 'Не указано';
};

export const TreeView: React.FC<TreeViewProps> = ({
    network,
    memberships,
    onHighlightNode,
    onClearHighlight,
    onNodeSelect,
}) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [highlighted, setHighlighted] = useState<string | null>(null);

    useEffect(() => {
        // раскрыть первые уровни по умолчанию
        const initial: Record<string, boolean> = {};
        const divisions = new Map<number, any>();
        memberships.forEach(m => {
            if (m.division) divisions.set(m.division.id, m.division);
        });
        divisions.forEach((_, id) => { initial[`division-${id}`] = true; });
        setExpanded(initial);
        setHighlighted(null);
    }, [network, memberships]);

    if (!network) {
        return (
            <div className="tree-empty">
                <Server size={48} />
                <p>Сеть не выбрана</p>
            </div>
        );
    }

    const divisions = Array.from(
        new Map(memberships.filter(m => m.division).map(m => [m.division.id, m.division])).values(),
    );

    const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

    const hover = (id: string | null) => {
        setHighlighted(id);
        onHighlightNode?.(id);
    };

    const leave = () => {
        setHighlighted(null);
        onClearHighlight?.();
    };

    return (
        <div className="tree-view">
            <h3 className="tree-view__title">Иерархия сети: {network.name}</h3>

            {divisions.length === 0 && (
                <div className="tree-empty">
                    <p>В сети нет подразделений</p>
                </div>
            )}

            {divisions.map((division: any) => {
                const divKey = `division-${division.id}`;
                const isExpanded = !!expanded[divKey];

                const divisionFacilities = Array.from(
                    new Map(
                        memberships
                            .filter(m => m.division?.id === division.id && m.facility)
                            .map(m => [m.facility.id, m.facility]),
                    ).values(),
                );

                return (
                    <div key={divKey} className="tree-node">
                        <div
                            className={`tree-item tree-item--division ${highlighted === divKey ? 'highlighted' : ''}`}
                            onMouseEnter={() => hover(divKey)}
                            onMouseLeave={leave}
                            onClick={() => { toggle(divKey); onNodeSelect?.(divKey); }}
                        >
                            <span className={`tree-toggle ${isExpanded ? 'expanded' : ''}`}>
                                <ChevronRight size={16} />
                            </span>
                            <Building size={16} />
                            <span>{getStringValue(division.name)}</span>
                        </div>

                        {isExpanded && (
                            <div className="tree-children">
                                {divisionFacilities.length === 0 && (
                                    <div className="tree-empty-note">Нет объектов</div>
                                )}
                                {divisionFacilities.map((facility: any) => {
                                    const facKey = `facility-${facility.id}`;
                                    const facExpanded = !!expanded[facKey];

                                    const facilityEquipment = Array.from(
                                        new Map(
                                            memberships
                                                .filter(m => m.facility?.id === facility.id && m.equipment)
                                                .map(m => [m.equipment.id, m.equipment]),
                                        ).values(),
                                    );

                                    return (
                                        <div key={facKey} className="tree-node">
                                            <div
                                                className={`tree-item tree-item--facility ${highlighted === facKey ? 'highlighted' : ''}`}
                                                onMouseEnter={() => hover(facKey)}
                                                onMouseLeave={leave}
                                                onClick={() => { toggle(facKey); onNodeSelect?.(facKey); }}
                                            >
                                                <span className={`tree-toggle ${facExpanded ? 'expanded' : ''}`}>
                                                    <ChevronRight size={14} />
                                                </span>
                                                <Factory size={14} />
                                                <span>{getStringValue(facility.name)}</span>
                                            </div>

                                            {facExpanded && (
                                                <div className="tree-children tree-children--deep">
                                                    {facilityEquipment.length === 0 && (
                                                        <div className="tree-empty-note">Нет оборудования</div>
                                                    )}
                                                    {facilityEquipment.map((eq: any) => {
                                                        const eqKey = `equipment-${eq.id}`;
                                                        return (
                                                            <div
                                                                key={eqKey}
                                                                className={`tree-item tree-item--equipment ${highlighted === eqKey ? 'highlighted' : ''}`}
                                                                onMouseEnter={() => hover(eqKey)}
                                                                onMouseLeave={leave}
                                                                onClick={() => onNodeSelect?.(eqKey)}
                                                            >
                                                                <Cpu size={14} />
                                                                <span>
                                                                    {getStringValue(eq.name)}
                                                                    {eq.device_type_display && (
                                                                        <span className="tree-muted"> · {eq.device_type_display}</span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};