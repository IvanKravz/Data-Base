import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Facility } from '../../../../../types';

interface BasicInformationProps {
  formData: Facility;
  onChange: (data: Partial<Facility>) => void;
}

export function BasicInformation({ formData, onChange }: BasicInformationProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Название объекта
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Введите название объекта"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Адрес
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => onChange({ address: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Введите адрес объекта"
          />
        </div>
      </div>
    </div>
  );
}