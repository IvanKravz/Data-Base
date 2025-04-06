import React from 'react';
import { Database } from 'lucide-react';
import { EquipmentCategory } from '../../types';
import { EQUIPMENT_CATEGORIES } from './constants';

interface CategoryGridProps {
  categories: Record<string, string>;
  equipmentCounts: Record<string, number>;
  selectedCategory: EquipmentCategory | null;
  onSelectType: (category: EquipmentCategory | null) => void;
  equipmentTypes: string[];
  isClosedEquipment?: boolean;
  selectedStatus: 'all' | 'in-operation' | 'in-storage' | 'defective' | 'for-disposal';
  statusEquipmentCounts: Record<string, Record<string, number>>;
}

export function CategoryGrid({ 
  equipmentCounts,
  selectedCategory,
  onSelectType,
  equipmentTypes,
  isClosedEquipment = false,
  selectedStatus,
  statusEquipmentCounts
}: CategoryGridProps) {
  // Filter types based on selected status
  const availableTypes = equipmentTypes.filter(type => {
    if (selectedStatus === 'all') {
      return equipmentCounts[type] > 0;
    }
    return (statusEquipmentCounts[selectedStatus]?.[type] || 0) > 0;
  });

  if (availableTypes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {isClosedEquipment ? 'Типы техники' : 'Категории техники'}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {availableTypes.map((type) => {
          const count = selectedStatus === 'all' 
            ? equipmentCounts[type]
            : statusEquipmentCounts[selectedStatus]?.[type] || 0;

          return (
            <div
              key={type}
              onClick={() => onSelectType(selectedCategory === type ? null : type as EquipmentCategory)}
              className={`
                bg-white p-4 rounded-lg border transition-all duration-200 cursor-pointer
                hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                ${selectedCategory === type ? 'ring-2 ring-blue-500 shadow-sm' : 'border-gray-200'}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">
                  {isClosedEquipment ? type : EQUIPMENT_CATEGORIES[type as keyof typeof EQUIPMENT_CATEGORIES]}
                </h3>
                <Database className={`h-4 w-4 ${selectedCategory === type ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm ${selectedCategory === type ? 'text-blue-600' : 'text-gray-500'}`}>
                Количество: {count}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}