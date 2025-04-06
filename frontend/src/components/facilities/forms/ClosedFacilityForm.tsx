import React, { useState } from 'react';
import { Facility } from '../../../types';
import { Building2, MapPin, FileText, Ruler, CheckSquare, MessageSquare } from 'lucide-react';
import { divisions } from '../../../data/divisionsData';

interface ClosedFacilityFormProps {
  initialData: Omit<Facility, 'id'>;
  onSubmit: (data: Omit<Facility, 'id'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function ClosedFacilityForm({ initialData, onSubmit, onCancel, isEditing = false }: ClosedFacilityFormProps) {
  const [formData, setFormData] = useState({
    ...initialData,
    comments: initialData.comments || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Основная информация</h3>
        <div className="grid grid-cols-1 gap-6">
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите адрес объекта"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Документация</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Номер акта приемки помещения
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.acceptanceActNumber || ''}
                onChange={(e) => setFormData({ ...formData, acceptanceActNumber: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, rimActNumber: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, commissioningActNumber: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, openingPermissionNumber: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите номер разрешения"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Информация о КЗ</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Размер КЗ
            </label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.kzSize || ''}
                onChange={(e) => setFormData({ ...formData, kzSize: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, hasTransformerInKz: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">ТП в пределах КЗ</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasGroundingInKz || false}
                onChange={(e) => setFormData({ ...formData, hasGroundingInKz: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Контур заземления в пределах КЗ</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Классификация</h3>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700">
            Класс
          </label>
          <div className="relative">
            <CheckSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value as '1' | '2' })}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">1 класс</option>
              <option value="2">2 класс</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Принадлежность</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Подразделение
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={formData.division}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  division: e.target.value,
                  subdivision: undefined
                })}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {divisions.map(division => (
                  <option key={division.id} value={division.name}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(formData.division === '1 отдел' || formData.division === '2 отдел') && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Отделение
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.subdivision || ''}
                  onChange={(e) => setFormData({ ...formData, subdivision: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите отделение</option>
                  {formData.division === '1 отдел' ? (
                    <>
                      <option value="Отделение A">Отделение A</option>
                      <option value="Отделение B">Отделение B</option>
                      <option value="Отделение C">Отделение C</option>
                    </>
                  ) : (
                    <>
                      <option value="Отделение D">Отделение D</option>
                      <option value="Отделение E">Отделение E</option>
                      <option value="Отделение F">Отделение F</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          <span>Комментарии</span>
        </h3>
        <textarea
          value={formData.comments || ''}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[120px]"
          placeholder="Добавьте комментарии к объекту..."
        />
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow transition-all"
        >
          {isEditing ? 'Сохранить' : 'Создать объект'}
        </button>
      </div>
    </form>
  );
}