import React from 'react';
import { Equipment, EquipmentCategory } from '../../../../../types';
import { Package, Tag } from 'lucide-react';
import { EQUIPMENT_CATEGORIES } from '../../../../equipment/constants';

interface BasicInformationProps {
  formData: Equipment;
  onChange: (data: Partial<Equipment>) => void;
}

export function BasicInformation({ formData, onChange }: BasicInformationProps) {
  // Получаем список доступных категорий в зависимости от текущей категории техники
  const availableCategories = formData.category === 'closed'
    ? { closed: EQUIPMENT_CATEGORIES.closed }
    : Object.entries(EQUIPMENT_CATEGORIES)
        .filter(([key]) => key !== 'closed')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Record<string, string>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Название
        </label>
        <div className="relative">
          <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Введите название техники"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Категория
        </label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.category}
            onChange={(e) => onChange({ category: e.target.value as EquipmentCategory })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none"
          >
            {Object.entries(availableCategories).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Тип техники
        </label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            required
            value={formData.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Введите тип техники"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Статус
        </label>
        <div className="relative">
          <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.status}
            onChange={(e) => onChange({ status: e.target.value as Equipment['status'] })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none"
          >
            <option value="in-operation">Эксплуатируется</option>
            <option value="in-storage">На складе</option>
            <option value="defective">Неисправно</option>
            <option value="for-disposal">На списание</option>
          </select>
        </div>
      </div>
    </div>
  );
}