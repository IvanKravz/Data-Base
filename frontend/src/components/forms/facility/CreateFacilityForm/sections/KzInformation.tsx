import React from 'react';
import { Ruler } from 'lucide-react';
import { Facility } from '../../../../../types';

interface KzInformationProps {
  formData: Omit<Facility, 'id'>;
  onChange: (data: Partial<Facility>) => void;
}

export function KzInformation({ formData, onChange }: KzInformationProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Размер КЗ
        </label>
        <div className="relative">
          <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.kzSize || ''}
            onChange={(e) => onChange({ kzSize: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите размер КЗ"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.hasTransformerInKz || false}
            onChange={(e) => onChange({ hasTransformerInKz: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">ТП в пределах КЗ</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.hasGroundingInKz || false}
            onChange={(e) => onChange({ hasGroundingInKz: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Контур заземления в пределах КЗ</span>
        </label>
      </div>
    </div>
  );
}