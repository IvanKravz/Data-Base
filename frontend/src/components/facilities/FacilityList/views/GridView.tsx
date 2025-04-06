import React from 'react';
import { Building2, MapPin, Trash2, Tag, Star } from 'lucide-react';
import { Facility } from '../../../../types';

interface GridViewProps {
  facilities: Facility[];
  onFacilityClick: (facility: Facility) => void;
  onDelete: (id: string) => void;
}

export function GridView({ facilities, onFacilityClick, onDelete }: GridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {facilities.map((facility) => (
        <div
          key={facility.id}
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onFacilityClick(facility)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">
              {facility.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(facility.id);
              }}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 text-gray-600">
            <div className="flex items-center gap-1 text-sm">
              <Tag className="h-4 w-4" />
              <span>{facility.type === 'station' ? 'Станция' : 'ШД'}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4" />
              <span>{facility.class} класс</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{facility.address}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Building2 className="h-4 w-4" />
              <span>
                {facility.division}
                {facility.subdivision && ` - ${facility.subdivision}`}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}