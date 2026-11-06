import React, { memo } from 'react';
import { Building, Plus, X } from 'lucide-react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface DivisionData {
  division: any;
  onAddFacility?: (divisionId: number, divisionName: string) => void;
  onRemove?: (divisionId: number) => void;
}

function DivisionNodeInner({ data, selected }: NodeProps<{ data: DivisionData }>) {
  const { division, onAddFacility, onRemove } = data;
  const border = selected ? '#FFD700' : '#93c5fd';

  return (
    <div className="schema-group schema-group--division" style={{ borderColor: border }}>
      <div className="schema-group__header">
        <Building size={16} color="#1e40af" />
        <span className="schema-group__title">
          {division?.name || 'Подразделение'}
        </span>
        <span className="flex-spacer" />
        <button
          type="button"
          className="schema-group__action"
          title="Добавить объект"
          onClick={(e) => {
            e.stopPropagation();
            onAddFacility?.(division.id, division.name);
          }}
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          className="schema-group__action schema-group__action--danger"
          title="Удалить из схемы"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(division.id);
          }}
        >
          <X size={14} />
        </button>
      </div>
      <Handle type="source" position={Position.Top} id="group-t" style={{ opacity: 0 }} />
    </div>
  );
}

export const DivisionNode = memo(DivisionNodeInner);