import React from 'react';
import { Equipment } from '../../../../../types';
import { Calendar } from 'lucide-react';

interface DatesInfoProps {
  formData: Equipment;
  onChange: (data: Partial<Equipment>) => void;
}

export function DatesInfo({ formData, onChange }: DatesInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Дата производства
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="date"
            required
            value={formData.manufacturingDate}
            onChange={(e) => onChange({ manufacturingDate: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Дата покупки
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="date"
            required
            value={formData.purchaseDate}
            onChange={(e) => onChange({ purchaseDate: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>
    </div>
  );
}