import React from 'react';
import { FileText } from 'lucide-react';
import { Facility } from '../../../../../types';

interface DocumentationProps {
  formData: Omit<Facility, 'id'>;
  onChange: (data: Partial<Facility>) => void;
}

export function Documentation({ formData, onChange }: DocumentationProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Номер акта приемки помещения
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.acceptanceActNumber || ''}
            onChange={(e) => onChange({ acceptanceActNumber: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите номер акта"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Номер акта РИМ
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.rimActNumber || ''}
            onChange={(e) => onChange({ rimActNumber: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите номер акта"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Номер акта ввода
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.commissioningActNumber || ''}
            onChange={(e) => onChange({ commissioningActNumber: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите номер акта"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Номер разрешения на открытие
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.openingPermissionNumber || ''}
            onChange={(e) => onChange({ openingPermissionNumber: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите номер разрешения"
          />
        </div>
      </div>
    </div>
  );
}