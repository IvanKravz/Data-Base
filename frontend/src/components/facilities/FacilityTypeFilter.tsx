import React from 'react';
import { Building2, Star, Calculator } from 'lucide-react';
import { Facility } from '../../types';

interface FacilityTypeFilterProps {
  facilities: Facility[];
  selectedType: 'all' | 'station' | 'shd';
  onTypeChange: (type: 'all' | 'station' | 'shd') => void;
  selectedClass: 'all' | '1' | '2';
  onClassChange: (facilityClass: 'all' | '1' | '2') => void;
  hideTypeFilter?: boolean;
}

export function FacilityTypeFilter({
  facilities,
  selectedType,
  onTypeChange,
  selectedClass,
  onClassChange,
  hideTypeFilter = false
}: FacilityTypeFilterProps) {
  // Get count for facility type and class combinations
  const getCounts = () => {
    const counts = {
      all: {
        total: facilities.length,
        class1: facilities.filter(f => f.class === '1').length,
        class2: facilities.filter(f => f.class === '2').length
      },
      station: {
        total: facilities.filter(f => f.type === 'station').length,
        class1: facilities.filter(f => f.type === 'station' && f.class === '1').length,
        class2: facilities.filter(f => f.type === 'station' && f.class === '2').length
      },
      shd: {
        total: facilities.filter(f => f.type === 'shd').length,
        class1: facilities.filter(f => f.type === 'shd' && f.class === '1').length,
        class2: facilities.filter(f => f.type === 'shd' && f.class === '2').length
      }
    };

    return counts;
  };

  const counts = getCounts();

  return (
    <div className="space-y-6">
      {/* Type filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onTypeChange('all')}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${selectedType === 'all'
              ? 'bg-gray-100 border-gray-300 ring-2 ring-gray-400 shadow-md'
              : 'bg-white border-gray-200 hover:bg-gray-50'
            }
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Итого</span>
          </div>
          <span className="px-2 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
            {counts.all.total}
          </span>
        </button>

        <button
          onClick={() => onTypeChange('station')}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${selectedType === 'station'
              ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400 shadow-md'
              : 'bg-white border-gray-200 hover:bg-blue-50'
            }
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Станция</span>
          </div>
          <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-700">
            {counts.station.total}
          </span>
        </button>

        <button
          onClick={() => onTypeChange('shd')}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${selectedType === 'shd'
              ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-400 shadow-md'
              : 'bg-white border-gray-200 hover:bg-purple-50'
            }
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            <span className="font-medium">ШД</span>
          </div>
          <span className="px-2 py-1 text-sm rounded-full bg-purple-100 text-purple-700">
            {counts.shd.total}
          </span>
        </button>
      </div>

      {/* Class filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onClassChange('all')}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${selectedClass === 'all'
              ? 'bg-gray-100 border-gray-300 ring-2 ring-gray-400 shadow-md'
              : 'bg-white border-gray-200 hover:bg-gray-50'
            }
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Все классы</span>
          </div>
          <span className="px-2 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
            {selectedType === 'all' ? counts.all.total : 
             selectedType === 'station' ? counts.station.total : 
             counts.shd.total}
          </span>
        </button>

        <button
          onClick={() => onClassChange('1')}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${selectedClass === '1'
              ? 'bg-green-100 border-green-300 ring-2 ring-green-400 shadow-md'
              : 'bg-white border-gray-200 hover:bg-green-50'
            }
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-green-600" />
            <span className="font-medium">1 класс</span>
          </div>
          <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-700">
            {selectedType === 'all' ? counts.all.class1 : 
             selectedType === 'station' ? counts.station.class1 : 
             counts.shd.class1}
          </span>
        </button>

        <button
          onClick={() => onClassChange('2')}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${selectedClass === '2'
              ? 'bg-yellow-100 border-yellow-300 ring-2 ring-yellow-400 shadow-md'
              : 'bg-white border-gray-200 hover:bg-yellow-50'
            }
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">2 класс</span>
          </div>
          <span className="px-2 py-1 text-sm rounded-full bg-yellow-100 text-yellow-700">
            {selectedType === 'all' ? counts.all.class2 : 
             selectedType === 'station' ? counts.station.class2 : 
             counts.shd.class2}
          </span>
        </button>
      </div>
    </div>
  );
}