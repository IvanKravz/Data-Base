import React, { memo } from 'react';
import { Factory, Plus, X } from 'lucide-react';
import { Handle, Position, NodeProps } from '@xyflow/react';

function pickLabel(...values: any[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v;
    if (v && typeof v === 'object' && typeof v.name === 'string' && v.name.trim()) return v.name;
  }
  return '';
}

interface FacilityData {
  facility: any;
  onAddEquipment?: (facilityId: number, facilityName: string) => void;
  onRemove?: (facilityId: number) => void;
}

function FacilityNodeInner({ data, selected }: NodeProps<{ data: FacilityData }>) {
  const { facility, onAddEquipment, onRemove } = data;
  const typeLabel = pickLabel(
    facility?.facility_type_display, facility?.type_display,
    facility?.category, facility?.facility_type, facility?.type,
  );
  const border = selected ? '#FFD700' : '#7dd3fc';

  return (
    <div className="schema-group schema-group--facility" style={{ borderColor: border }}>
      <div className="schema-group__header">
        <Factory size={14} color="#0369a1" />
        <span className="schema-group__title">{typeLabel || 'Объект'}</span>
        <span className="flex-spacer" />
        <button
          type="button"
          className="schema-group__action"
          title="Добавить технику"
          onClick={(e) => {
            e.stopPropagation();
            onAddEquipment?.(facility.id, facility.name || typeLabel || 'Объект');
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
            onRemove?.(facility.id);
          }}
        >
          <X size={14} />
        </button>
      </div>
      <Handle type="source" position={Position.Top} id="group-t" style={{ opacity: 0 }} />
    </div>
  );
}

export const FacilityNode = memo(FacilityNodeInner);