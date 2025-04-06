import React from 'react';
import { Equipment } from '../../../../../types';
import { Hash, Database } from 'lucide-react';

interface IdentificationInfoProps {
  formData: Equipment;
  onChange: (data: Partial<Equipment>) => void;
}

export function IdentificationInfo({ formData, onChange }: IdentificationInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Серийный номер
        </label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            required
            value={formData.serialNumber}
            onChange={(e) => onChange({ serialNumber: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Введите серийный номер"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Инвентарный номер
        </label>
        <div className="relative">
          <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            required
            value={formData.inventoryNumber}
            onChange={(e) => onChange({ inventoryNumber: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Введите инвентарный номер"
          />
        </div>
      </div>
    </div>
  );
}