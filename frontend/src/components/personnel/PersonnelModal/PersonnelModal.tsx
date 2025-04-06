import React from 'react';
import { X } from 'lucide-react';
import { Person } from '../../../types';
import { EditPersonnelForm } from '../../forms/personnel/EditPersonnelForm';

interface PersonnelModalProps {
  person: Person;
  onClose: () => void;
  onUpdate: (updatedPerson: Person) => void;
  isEditing: boolean;
}

export function PersonnelModal({ person, onClose, onUpdate, isEditing }: PersonnelModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto md:max-w-3xl lg:max-w-4xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Редактирование сотрудника' : person.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {isEditing ? (
            <EditPersonnelForm
              person={person}
              onSubmit={onUpdate}
              onCancel={onClose}
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Основная информация</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Должность</p>
                      <p className="font-medium">{person.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Подразделение</p>
                      <p className="font-medium">{person.division}</p>
                    </div>
                    {person.division === "1 отдел" && person.subdivision && (
                      <div>
                        <p className="text-sm text-gray-500">Отделение</p>
                        <p className="font-medium">{person.subdivision}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Материально ответственное лицо</p>
                      <p className="font-medium">{person.isMaterialResponsible ? 'Да' : 'Нет'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Контактная информация</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{person.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Телефон</p>
                      <p className="font-medium">{person.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4">Даты</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Дата рождения</p>
                    <p className="font-medium">{person.birthDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Дата контракта</p>
                    <p className="font-medium">{person.contractDate}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}