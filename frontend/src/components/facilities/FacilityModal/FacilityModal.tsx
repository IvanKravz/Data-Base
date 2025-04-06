import React from 'react';
import { X, Building2, MapPin, Users, Tag, Star } from 'lucide-react';
import { Facility } from '../../../types';
import { EditFacilityForm } from '../../forms/facility/EditFacilityForm';

interface FacilityModalProps {
  facility: Facility;
  onClose: () => void;
  onUpdate: (facility: Facility) => void;
  isEditing: boolean;
}

export function FacilityModal({ facility, onClose, onUpdate, isEditing }: FacilityModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto md:max-w-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Редактирование объекта' : facility.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {isEditing ? (
            <EditFacilityForm
              facility={facility}
              onSubmit={onUpdate}
              onCancel={onClose}
            />
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Информация об объекте</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Наименование</p>
                      <p className="font-medium">{facility.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500">Тип объекта</p>
                      <p className="font-medium">{facility.type === 'station' ? 'Станция' : 'ШД'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-500">Класс</p>
                      <p className="font-medium">{facility.class} класс</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Адрес</p>
                      <p className="font-medium">{facility.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">Подразделение</p>
                      <p className="font-medium">
                        {facility.division}
                        {facility.subdivision && ` - ${facility.subdivision}`}
                      </p>
                    </div>
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