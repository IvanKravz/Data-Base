import React, { useState } from 'react';
import { User, Mail, Phone, FileText, Plus, Trash2, Pencil, X } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  customFields: {
    id: string;
    label: string;
    value: string;
  }[];
}

export function CabinetSection() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Администратор',
    email: 'admin@example.com',
    phone: '+7 (999) 123-45-67',
    customFields: []
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassword({ current: '', new: '', confirm: '' });
  };

  const handleAddCustomField = () => {
    setProfile(prev => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { id: Date.now().toString(), label: '', value: '' }
      ]
    }));
  };

  const handleRemoveCustomField = (id: string) => {
    setProfile(prev => ({
      ...prev,
      customFields: prev.customFields.filter(field => field.id !== id)
    }));
  };

  const handleCustomFieldChange = (id: string, field: 'label' | 'value', value: string) => {
    setProfile(prev => ({
      ...prev,
      customFields: prev.customFields.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Личный кабинет</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" />
              <span>Редактировать</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  ФИО
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  Телефон
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900">Дополнительная информация</h3>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Добавить поле</span>
                </button>
              </div>

              <div className="space-y-3">
                {profile.customFields.map((field) => (
                  <div key={field.id} className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleCustomFieldChange(field.id, 'label', e.target.value)}
                        placeholder="Название поля"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
                        placeholder="Значение"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(field.id)}
                      className="p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {profile.customFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Добавьте дополнительные поля с информацией о себе</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
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
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">ФИО</p>
                  <p className="font-medium">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Телефон</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            </div>

            {profile.customFields.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-4">
                  Дополнительная информация
                </h3>
                <div className="space-y-3">
                  {profile.customFields.map((field) => (
                    <div key={field.id} className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-500">{field.label}</p>
                        <p className="font-medium">{field.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Изменить пароль</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Текущий пароль
            </label>
            <input
              type="password"
              value={password.current}
              onChange={(e) => setPassword({ ...password, current: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Новый пароль
            </label>
            <input
              type="password"
              value={password.new}
              onChange={(e) => setPassword({ ...password, new: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Подтверждение пароля
            </label>
            <input
              type="password"
              value={password.confirm}
              onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Изменить пароль
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}