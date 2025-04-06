import React from 'react';
import { Equipment } from '../../../../types';

interface DatesInfoProps {
  formData: Omit<Equipment, 'id'>;
  onChange: (data: Partial<Equipment>) => void;
}

export function DatesInfo({ formData, onChange }: DatesInfoProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Дата производства
        </label>
        <input
          type="date"
          required
          value={formData.manufacturingDate}
          onChange={(e) => onChange({ manufacturingDate: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Дата покупки
        </label>
        <input
          type="date"
          required
          value={formData.purchaseDate}
          onChange={(e) => onChange({ purchaseDate: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
        />
      </div>
    </div>
  );
}