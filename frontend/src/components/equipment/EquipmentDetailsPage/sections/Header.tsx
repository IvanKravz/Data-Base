import React from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Equipment } from '../../../../types';
import { getStatusIcon, getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';

interface HeaderProps {
  equipment: Equipment;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function Header({ equipment, onBack, onEdit, onDelete }: HeaderProps) {
  const StatusIcon = getStatusIcon(equipment.status);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-full border ${getStatusColor(equipment.status)}`}>
              <StatusIcon className="h-4 w-4" />
              {getStatusLabel(equipment.status)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          <span>Редактировать</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Удалить</span>
        </button>
      </div>
    </div>
  );
}