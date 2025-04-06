import React from 'react';
import { Tag, Star } from 'lucide-react';
import { Facility } from '../../../../../types';

interface ClassificationProps {
  formData: Facility;
  onChange: (data: Partial<Facility>) => void;
}

export function Classification({ formData, onChange }: ClassificationProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Тип объекта
        </label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.type}
            onChange={(e) => onChange({ type: e.target.value as Facility['type'] })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none bg-none"
          >
            <option value="station">Станция</option>
            <option value="shd">ШД</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Класс
        </label>
        <div className="relative">
          <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.class}
            onChange={(e) => onChange({ class: e.target.value as Facility['class'] })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none bg-none"
          >
            <option value="1">1 класс</option>
            <option value="2">2 класс</option>
          </select>
        </div>
      </div>
    </div>
  );
}