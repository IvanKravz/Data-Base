import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Division } from '../../../types';

interface EditDivisionModalProps {
  division: Division;
  onClose: () => void;
  onUpdate: (division: Division) => void;
}

export function EditDivisionModal({ division, onClose, onUpdate }: EditDivisionModalProps) {
  const [formData, setFormData] = useState(division);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Редактировать подразделение</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество персонала
            </label>
            <input
              type="number"
              value={formData.personnelCount}
              onChange={(e) => setFormData({ ...formData, personnelCount: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество техники
            </label>
            <input
              type="number"
              value={formData.equipmentCount}
              onChange={(e) => setFormData({ ...formData, equipmentCount: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              min="0"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}