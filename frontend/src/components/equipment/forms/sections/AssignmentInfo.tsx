import React from 'react';
import { Building2, User, MapPin } from 'lucide-react';
import { Equipment } from '../../../../types';
import { divisions } from '../../../../data/divisionsData';

interface AssignmentInfoProps {
  formData: Omit<Equipment, 'id'>;
  onChange: (data: Partial<Equipment>) => void;
  availableSubdivisions: string[];
  availablePersonnel: any[];
  availableFacilities: any[];
}

export function AssignmentInfo({ 
  formData, 
  onChange,
  availableSubdivisions,
  availablePersonnel,
  availableFacilities
}: AssignmentInfoProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Подразделение
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.division}
            onChange={(e) => onChange({ 
              division: e.target.value,
              subdivision: undefined,
              assignedTo: undefined,
              facilityId: undefined
            })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          >
            {divisions.map(division => (
              <option key={division.id} value={division.name}>
                {division.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {availableSubdivisions.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700">
            Отделение
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={formData.subdivision || ''}
              onChange={(e) => onChange({ 
                subdivision: e.target.value,
                assignedTo: undefined,
                facilityId: undefined
              })}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              <option value="">Выберите отделение</option>
              {availableSubdivisions.map(subdivision => (
                <option key={subdivision} value={subdivision}>
                  {subdivision}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Ответственный сотрудник
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.assignedTo || ''}
            onChange={(e) => onChange({ assignedTo: e.target.value || undefined })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          >
            <option value="">Не назначен</option>
            {availablePersonnel.map(person => (
              <option key={person.id} value={person.name}>
                {person.name} - {person.position}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700">
          Объект
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.facilityId || ''}
            onChange={(e) => onChange({ facilityId: e.target.value || undefined })}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          >
            <option value="">Не привязан к объекту</option>
            {availableFacilities.map(facility => (
              <option key={facility.id} value={facility.id}>
                {facility.name} ({facility.type === 'station' ? 'Станция' : 'ШД'}, {facility.class} класс)
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}