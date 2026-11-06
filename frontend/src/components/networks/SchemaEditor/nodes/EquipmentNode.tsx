import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Key } from 'lucide-react';

function EquipmentNodeInner({ data, selected }: NodeProps<{ data: {
  equipment: any;
  highlighted?: boolean;
} }>) {
  const { equipment, highlighted } = data;

  const border = selected ? '#FFD700' : highlighted ? '#61dafb' : '#fdba74';
  const shadow = selected
    ? '0 0 0 3px rgba(255,215,0,.4)'
    : highlighted ? '0 0 0 3px rgba(97,218,251,.4)' : undefined;

  return (
    <div
      className="schema-node schema-node--equipment schema-node--equipment-compact"
      style={{ borderColor: border, boxShadow: shadow }}
      title={equipment?.name}
    >
      <Handle type="source" position={Position.Top}    id="top"    className="schema-handle schema-handle--top" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="schema-handle schema-handle--bottom" />
      <Handle type="source" position={Position.Left}   id="left"   className="schema-handle schema-handle--left" />
      <Handle type="source" position={Position.Right}  id="right"  className="schema-handle schema-handle--right" />

      {/* ✅ Оранжевый «ключик» вместо иконки типа */}
      <div className="schema-node__icon">
        <Key size={22} color="#f97316" strokeWidth={2.2} />
      </div>
      <div className="schema-node__text">
        <div className="schema-node__label">{equipment?.name || ''}</div>
      </div>
    </div>
  );
}

export const EquipmentNode = memo(EquipmentNodeInner);