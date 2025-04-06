import React, { useState } from 'react';
import { Person } from '../../../../types';
import { divisions } from '../../../../data/divisionsData';
import { User, Mail, Phone, Building2, Calendar, Shield, Plus, Trash2 } from 'lucide-react';

interface CreatePersonnelFormProps {
  onSubmit: (person: Omit<Person, 'id'>) => void;
  onCancel: () => void;
}

export function CreatePersonnelForm({ onSubmit, onCancel }: CreatePersonnelFormProps) {
  const [formData, setFormData] = useState<Omit<Person, 'id'>>({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    birthDate: '',
    contractDate: '',
    division: '1 отдел',
    comments: '', // Added comments field
    isMaterialResponsible: false,
    isShaWorker: false,
    shaDetails: {
      conclusionNumber: '',
      startDate: '',
      accessLevel: '1',
      equipment: []
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-blue-500" />
          Основная информация
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              ФИО
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите ФИО"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Должность
            </label>
            <input
              type="text"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите должность"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-green-500" />
          Контактная информация
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Телефон
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+7 (___) ___-__-__"
            />
          </div>
        </div>
      </div>

      {/* Assignment */}
      <div>
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-purple-500" />
          Принадлежность
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Подразделение
            </label>
            <select
              value={formData.division}
              onChange={(e) => setFormData({ 
                ...formData, 
                division: e.target.value,
                subdivision: undefined
              })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {divisions.map((division) => (
                <option key={division.id} value={division.name}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>

          {(formData.division === '1 отдел' || formData.division === '2 отдел') && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Отделение
              </label>
              <select
                value={formData.subdivision || ''}
                onChange={(e) => setFormData({ ...formData, subdivision: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          )}
        </div>
      </div>

      {/* Dates */}
      <div>
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          Даты
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Дата рождения
            </label>
            <input
              type="date"
              required
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Дата контракта
            </label>
            <input
              type="date"
              required
              value={formData.contractDate}
              onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Comments */}
      <div>
        <h3 className="text-base font-medium text-gray-900 mb-4">Комментарии</h3>
        <textarea
          value={formData.comments || ''}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Добавьте комментарии к сотруднику..."
        />
      </div>

      {/* Form Actions */}
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
          Создать сотрудника
        </button>
      </div>
    </form>
  );
}