import React from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Equipment } from '../../../../types';
import { getStatusIcon, getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';
import '.././style.css'

interface HeaderProps {
  equipment: Equipment;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEditEquipment: boolean;
}

export function Header({ equipment, onBack, onEdit, onDelete, canEditEquipment }: HeaderProps) {

  return (
    <div className="equipment-header">
      <div className="equipment-flex equipment-items-center equipment-gap-md">
        <button
          onClick={onBack}
          className="equipment-btn--icon"
        >
          <ArrowLeft size={20} />
        </button>
        <div className='equipment-header-info'>
          <h1 className="equipment-header__title">{equipment.name}</h1>
          <span className={`equipment-status ${getStatusColor(equipment.status)}`}>
            {/* <StatusIcon size={16} /> */}
            {getStatusLabel(equipment.status)}
          </span>
        </div>
      </div>
      {canEditEquipment && (<div className="equipment-flex equipment-items-center equipment-gap-sm">
        <button
          onClick={onEdit}
          className="equipment-btn equipment-btn--primary"
        >
          <Pencil size={16} />
          Редактировать
        </button>
        <button
          onClick={onDelete}
          className="equipment-btn equipment-btn--danger"
        >
          <Trash2 size={16} />
          Удалить
        </button>
      </div>
      )}
    </div>
  );
}