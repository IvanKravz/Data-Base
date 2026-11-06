import React from 'react';
import {
  BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps, Position,
} from '@xyflow/react';

interface DirData {
  label?: string;
  cable_type?: string;
  isDirection?: boolean;
  from_handle?: string;
  to_handle?: string;
}

function sideFromHandle(id?: string): Position | undefined {
  switch (id) {
    case 'top': return Position.Top;
    case 'bottom': return Position.Bottom;
    case 'left': return Position.Left;
    case 'right': return Position.Right;
    default: return undefined;
  }
}

export function DirectionEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, style, selected,
}: EdgeProps<{ data?: DirData }>) {
  const src = sideFromHandle(data?.from_handle) ?? sourcePosition;
  const tgt = sideFromHandle(data?.to_handle) ?? targetPosition;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition: src,
    targetX, targetY, targetPosition: tgt,
  });

  const isDir = data?.isDirection !== false;
  const stroke = selected ? '#f59e0b' : (isDir ? '#ef4444' : '#94a3b8');

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={24}   /* широкая зона клика по ребру */
        style={{
          stroke,
          strokeWidth: selected ? 3 : (isDir ? 2 : 1.2),
          strokeDasharray: isDir ? '6 4' : undefined,
          ...style,
        }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              background: 'white',
              border: `1px solid ${selected ? '#f59e0b' : '#e2e8f0'}`,
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              pointerEvents: 'all',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            className="nodrag nopan"
            /* клик по лейблу тоже открывает редактор — ReactFlow
               сам пробросит это событие в onEdgeClick */
            data-edge-label-id={id}
          >
            {data.label}
            {data.cable_type ? ` · ${data.cable_type}` : ''}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}