import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DisposalInfo } from '../../../types';

interface DisposalModalProps {
  onConfirm: (disposalInfo: DisposalInfo) => void;
  onCancel: () => void;
}

export function DisposalModal({ onConfirm, onCancel }: DisposalModalProps) {
  const [formData, setFormData] = useState<DisposalInfo>({
    actNumber: '',
    actDate: '',
    disposalCertNumber: '',
    disposalCertDate: '',
    comments: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Списание техники</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                № акта списания
              </label>
              <input
                type="text"
                required
                value={formData.actNumber}
                onChange={(e) => setFormData({ ...formData, actNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Дата акта
              </label>
              <input
                type="date"
                required
                value={formData.actDate}
                onChange={(e) => setFormData({ ...formData, actDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:text-gray-500 [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                № справки о ликвидации
              </label>
              <input
                type="text"
                required
                value={formData.disposalCertNumber}
                onChange={(e) => setFormData({ ...formData, disposalCertNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Дата справки
              </label>
              <input
                type="date"
                required
                value={formData.disposalCertDate}
                onChange={(e) => setFormData({ ...formData, disposalCertDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:text-gray-500 [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Комментарии
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Добавьте комментарии о списании..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Списать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}