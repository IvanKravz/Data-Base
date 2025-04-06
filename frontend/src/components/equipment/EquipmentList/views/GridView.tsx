import React from 'react';
import { Equipment } from '../../../../types';
import { Pencil, Trash2 } from 'lucide-react';
import { getStatusIcon, getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';
import { EQUIPMENT_CATEGORIES } from '../../constants';

interface GridViewProps {
  equipment: Equipment[];
  onEdit: (e: React.MouseEvent, item: Equipment) => void;
  onView: (item: Equipment) => void;
  onDelete: (id: string) => void;
}

export function GridView({ equipment, onEdit, onView, onDelete }: GridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {equipment.map((item) => {
        const StatusIcon = getStatusIcon(item.status);
        return (
          <div
            key={item.id}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onView(item)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm truncate flex-1 text-gray-900">
                {item.name}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => onEdit(e, item)}
                  className="text-blue-500 hover:text-blue-700 p-1"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-xs space-y-1 text-gray-600">
              <p className="truncate">{item.type}</p>
              <p className="truncate">{EQUIPMENT_CATEGORIES[item.category]}</p>
              <p className="truncate">№: {item.inventoryNumber}</p>
              <p className="truncate">{item.division}</p>
              <p className={`${getStatusColor(item.status)} font-medium flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {getStatusLabel(item.status)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}