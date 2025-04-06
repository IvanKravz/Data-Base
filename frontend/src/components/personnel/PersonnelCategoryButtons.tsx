import React from 'react';
import { Users, ClipboardList, Shield, Key } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Person } from '../../types';

interface PersonnelCategoryButtonsProps {
  selectedDivision: string;
  selectedCategory: 'all' | 'mol' | 'sha';
  onCategoryChange: (category: 'all' | 'mol' | 'sha') => void;
  selectedAccessClass: 'all' | '1' | '2';
  onAccessClassChange: (accessClass: 'all' | '1' | '2') => void;
}

export function PersonnelCategoryButtons({
  selectedDivision,
  selectedCategory,
  onCategoryChange,
  selectedAccessClass,
  onAccessClassChange
}: PersonnelCategoryButtonsProps) {
  const personnel = useSelector((state: RootState) => state.personnel.personnel);

  // Filter personnel by division first
  const divisionPersonnel = selectedDivision === 'all'
    ? personnel
    : personnel.filter(person => person.division === selectedDivision);

  const getCategoryCount = (category: 'all' | 'mol' | 'sha', accessClass?: 'all' | '1' | '2') => {
    if (category === 'all') {
      return divisionPersonnel.length;
    }
    if (category === 'mol') {
      return divisionPersonnel.filter(person => person.isMaterialResponsible).length;
    }
    const shaWorkers = divisionPersonnel.filter(person => person.isShaWorker);
    if (accessClass === 'all' || !accessClass) {
      return shaWorkers.length;
    }
    return shaWorkers.filter(person => person.shaDetails?.accessLevel === accessClass).length;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onCategoryChange('all')}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${selectedCategory === 'all'
              ? 'bg-gray-100 border-gray-300 ring-2 ring-gray-400 shadow-md'
              : 'bg-white border-gray-200 hover:bg-gray-50'
            }
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Все сотрудники</span>
          </div>
          <span className="px-2 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
            {getCategoryCount('all')}
          </span>
        </button>

        <button
          onClick={() => onCategoryChange('mol')}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${selectedCategory === 'mol'
              ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400 shadow-md'
              : 'bg-white border-gray-200 hover:bg-blue-50'
            }
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <span className="font-medium">МОЛ</span>
          </div>
          <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-700">
            {getCategoryCount('mol')}
          </span>
        </button>

        <button
          onClick={() => onCategoryChange('sha')}
          className={`
            relative flex items-center justify-between px-4 py-3 rounded-xl border
            transition-all duration-300 ease-in-out transform
            ${selectedCategory === 'sha'
              ? 'bg-green-100 border-green-300 ring-2 ring-green-400 shadow-md'
              : 'bg-white border-gray-200 hover:bg-green-50'
            }
            hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
          `}
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="font-medium">ШаРаботник</span>
          </div>
          <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-700">
            {getCategoryCount('sha')}
          </span>
        </button>
      </div>

      {selectedCategory === 'sha' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['all', '1', '2'] as const).map((accessClass) => (
            <button
              key={accessClass}
              onClick={() => onAccessClassChange(accessClass)}
              className={`
                relative flex items-center justify-between px-4 py-3 rounded-xl border
                transition-all duration-300 ease-in-out transform
                ${selectedAccessClass === accessClass
                  ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-400 shadow-md'
                  : 'bg-white border-gray-200 hover:bg-purple-50'
                }
                hover:scale-[1.02] hover:shadow-md
                active:scale-[0.98]
              `}
            >
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-600" />
                <span className="font-medium">
                  {accessClass === 'all' ? 'Все формы допуска' : `${accessClass} класс`}
                </span>
              </div>
              <span className="px-2 py-1 text-sm rounded-full bg-purple-100 text-purple-700">
                {getCategoryCount('sha', accessClass)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}