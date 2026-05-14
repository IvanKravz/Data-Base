// components/networks/NetworkSchema2D.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNetworkData } from '../NetworkVisualization/components/useNetworkData';
import NetworkDetailsPanel from '../NetworkVisualization/components/NetworkDetailsPanel';

interface NetworkSchema2DProps {
    network: any;
    memberships: any[];
    directions: any[];
    highlightedNode?: string | null;
    selectedNode?: string | null;
    onNodeSelect?: (nodeId: string) => void;
    onNodeHover?: (nodeId: string | null) => void;
    onClearSelection?: () => void;
}

interface NodeLayout {
    id: string;
    name: string;
    type: 'division' | 'facility' | 'equipment';
    x: number;
    y: number;
    color: string;
    radius: number;
}

const NetworkSchema2D: React.FC<NetworkSchema2DProps> = ({
    network,
    memberships,
    directions,
    highlightedNode,
    selectedNode,
    onNodeSelect,
    onNodeHover,
    onClearSelection,
}) => {
    const { nodes: rawNodes, connections: rawEdges } = useNetworkData(network, memberships, directions);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(800);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            setContainerWidth(entries[0].contentRect.width);
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Layout (без изменений, тот же код, что у вас)
    const layoutNodes = useMemo(() => {
        const result: NodeLayout[] = [];
        const levels: Record<string, NodeLayout[]> = {
            division: [],
            facility: [],
            equipment: [],
        };
        rawNodes.forEach(node => {
            levels[node.type].push({
                id: node.id,
                name: node.name,
                type: node.type,
                x: 0, y: 0,
                color: node.color,
                radius: node.radius,
            });
        });
        // Division
        const startX = 100;
        const stepX = 220;
        const divY = 10;
        levels.division.forEach((div, idx) => {
            div.x = startX + idx * stepX;
            div.y = divY;
            result.push(div);
        });
        // Facility
        const facilityPositions: Record<string, { count: number }> = {};
        levels.facility.forEach(fac => {
            const membership = memberships.find(m => m.facility?.id === parseInt(fac.id.split('-')[1]) && m.division);
            const divisionId = membership ? `division-${membership.division.id}` : null;
            const parentDiv = result.find(d => d.id === divisionId);
            if (parentDiv) {
                const count = (facilityPositions[parentDiv.id]?.count || 0) + 1;
                facilityPositions[parentDiv.id] = { count };
                const totalUnderDiv = levels.facility.filter(f => {
                    const m = memberships.find(mm => mm.facility?.id === parseInt(f.id.split('-')[1]) && mm.division);
                    return m && `division-${m.division.id}` === parentDiv.id;
                }).length;
                const offset = (count - 1) * 150 - (totalUnderDiv - 1) * 75;
                fac.x = parentDiv.x + offset;
                fac.y = parentDiv.y + 120;
            } else {
                fac.x = 100 + (parseInt(fac.id.split('-')[1]) % 5) * 150;
                fac.y = 170;
            }
            result.push(fac);
        });
        // Equipment
        levels.equipment.forEach(eq => {
            const membership = memberships.find(m => m.equipment?.id === parseInt(eq.id.split('-')[1]) && m.facility);
            const facilityId = membership ? `facility-${membership.facility.id}` : null;
            const parentFac = result.find(f => f.id === facilityId);
            if (parentFac) {
                const siblings = result.filter(r => r.type === 'equipment' && r.id.startsWith(`equipment-${membership?.facility?.id}`));
                const offset = (siblings.length - 1) * 70;
                eq.x = parentFac.x + offset - 40;
                eq.y = parentFac.y + 100;
            } else {
                eq.x = 100 + (parseInt(eq.id.split('-')[1]) % 5) * 150;
                eq.y = 290;
            }
            result.push(eq);
        });
        return result;
    }, [rawNodes, memberships]);

    const { minX, maxX, minY, maxY } = useMemo(() => {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        layoutNodes.forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y);
        });
        return { minX, maxX, minY, maxY };
    }, [layoutNodes]);

    const contentWidth = maxX - minX + 200;  // отступы 100 слева и справа
    const contentHeight = maxY - minY + 200; // отступы 100 сверху и снизу

    const offsetX = useMemo(() => {
        if (containerWidth <= 0) return 0;
        return (containerWidth - contentWidth) / 2 - minX + 100;
    }, [containerWidth, contentWidth, minX]);

    const offsetY = 100;

    const svgWidth = Math.max(containerWidth, contentWidth);
    const svgHeight = Math.max(contentHeight, 500);

    const edges = useMemo(() => {
        return rawEdges
            .map(conn => {
                const fromNode = layoutNodes.find(n => n.id === conn.startId);
                const toNode = layoutNodes.find(n => n.id === conn.endId);
                if (!fromNode || !toNode) return null;
                return {
                    ...conn,
                    from: { x: fromNode.x, y: fromNode.y },
                    to: { x: toNode.x, y: toNode.y },
                    isDirection: conn.isDirection,
                    bandwidth: conn.bandwidth,
                };
            })
            .filter((edge): edge is NonNullable<typeof edge> => edge !== null);
    }, [rawEdges, layoutNodes]);

    const handleNodeClick = (nodeId: string) => onNodeSelect?.(nodeId);
    const handleNodeMouseEnter = (nodeId: string) => onNodeHover?.(nodeId);
    const handleNodeMouseLeave = () => onNodeHover?.(null);
    const handleClosePanel = () => onClearSelection?.();

    return (
        <div className="network-visualization-container">
            <div className="network-visualization">
                <h3 className="network-visualization-title">Структурная схема: {network.name}</h3>
                <div
                    ref={containerRef}
                    style={{ width: '100%', overflowX: 'auto', background: '#1a1a2e', borderRadius: '12px', padding: '20px 0' }}
                >
                    <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
                        <g transform={`translate(${offsetX}, ${offsetY})`}>
                            {/* Линии */}
                            {edges.map((edge, idx) => {
                                const isHighlighted =
                                    highlightedNode === edge.startId ||
                                    highlightedNode === edge.endId ||
                                    selectedNode === edge.startId ||
                                    selectedNode === edge.endId;
                                const strokeColor = edge.isDirection ? '#ff0000' : isHighlighted ? '#61dafb' : '#aaa';
                                const strokeWidth = edge.isDirection ? 2 : isHighlighted ? 2 : 1;
                                const isAnimated = edge.isDirection;
                                return (
                                    <line
                                        key={idx}
                                        x1={edge.from.x}
                                        y1={edge.from.y}
                                        x2={edge.to.x}
                                        y2={edge.to.y}
                                        stroke={strokeColor}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={isAnimated ? '6' : 'none'}
                                        style={{ transition: 'stroke 0.2s' }}
                                    />
                                );
                            })}
                            {/* Узлы */}
                            {layoutNodes.map(node => {
                                const isSelected = selectedNode === node.id;
                                const isHighlighted = highlightedNode === node.id;
                                const isEquipment = node.type === 'equipment';
                                return (
                                    <g
                                        key={node.id}
                                        transform={`translate(${node.x}, ${node.y})`}
                                        onClick={() => handleNodeClick(node.id)}
                                        onMouseEnter={() => handleNodeMouseEnter(node.id)}
                                        onMouseLeave={handleNodeMouseLeave}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <circle
                                            r={node.radius * 6}
                                            fill={node.color}
                                            stroke={isSelected ? '#FFD700' : isHighlighted ? '#61dafb' : 'none'}
                                            strokeWidth={3}
                                        />
                                        {isEquipment ? (
                                            <text
                                                x={0}
                                                y={node.radius * 4 + 10}
                                                fill="white"
                                                fontSize="12"
                                                textAnchor="middle"
                                                dominantBaseline="hanging"
                                            >
                                                {node.name}
                                            </text>
                                        ) : (
                                            <text
                                                x={node.radius * 4 + 8}
                                                y={4}
                                                fill="white"
                                                fontSize="13"
                                                dominantBaseline="middle"
                                            >
                                                {node.name}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                </div>
                <NetworkDetailsPanel
                    selectedNode={selectedNode || null}
                    memberships={memberships}
                    onClosePanel={handleClosePanel}
                />
            </div>
        </div>
    );
};

export default NetworkSchema2D;