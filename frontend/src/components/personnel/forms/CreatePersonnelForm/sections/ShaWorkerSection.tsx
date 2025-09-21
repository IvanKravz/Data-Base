import React from 'react';
import { Person } from '../../../../../types';
import { Plus, Trash2 } from 'lucide-react';

interface ShaWorkerSectionProps {
  formData: Omit<Person, 'id'>;
  setFormData: (data: Omit<Person, 'id'>) => void;
}

export function ShaWorkerSection({ formData, setFormData }: ShaWorkerSectionProps) {
  const handleAddEquipment = () => {
    setFormData(prev => ({
      ...prev,
      shaDetails: {
        ...prev.shaDetails!,
        equipment: [
          ...prev.shaDetails!.equipment,
          { type: '', conclusionNumber: '' }
        ]
      }
    }));
  };

  const handleRemoveEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shaDetails: {
        ...prev.shaDetails!,
        equipment: prev.shaDetails!.equipment.filter((_, i) => i !== index)
      }
    }));
  };

  const handleEquipmentChange = (index: number, field: 'type' | 'conclusionNumber', value: string) => {
    setFormData(prev => ({
      ...prev,
      shaDetails: {
        ...prev.shaDetails!,
        equipment: prev.shaDetails!.equipment.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
      <h4 className="font-medium mb-4 text-gray-900">
        Информация о допуске
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Дата начала
          </label>
          <input
            type="date"
            required
            value={formData.shaDetails?.startDate || ''}
            onChange={(e) => setFormData({
              ...formData,
              shaDetails: {
                ...formData.shaDetails!,
                startDate: e.target.value
              }
            })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Форма допуска
          </label>
          <select
            required
            value={formData.shaDetails?.accessLevel || '1'}
            onChange={(e) => setFormData({
              ...formData,
              shaDetails: {
                ...formData.shaDetails!,
                accessLevel: e.target.value as '1' | '2'
              }
            })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="1">1 класс</option>
            <option value="2">2 класс</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-gray-900">
            Техника и заключения
          </h5>
          <button
            type="button"
            onClick={handleAddEquipment}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" />
            <span>Добавить технику</span>
          </button>
        </div>

        <div className="space-y-3">
          {formData.shaDetails?.equipment.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    value={item.type}
                    onChange={(e) => handleEquipmentChange(index, 'type', e.target.value)}
                    placeholder="Тип техники"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={item.conclusionNumber}
                    onChange={(e) => handleEquipmentChange(index, 'conclusionNumber', e.target.value)}
                    placeholder="Номер заключения"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveEquipment(index)}
                className="p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {formData.shaDetails?.equipment.length === 0 && (
            <p className="text-center py-3 text-gray-500">
              Добавьте типы техники и номера заключений
            </p>
          )}
        </div>
      </div>
    </div>
  );
}