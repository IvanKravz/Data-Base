import React from 'react';
import { divisions } from '../../../../data/divisionsData';

interface DivisionFilterProps {
  selectedDivision: string;
  onDivisionChange: (division: string) => void;
}

export function DivisionFilter({ selectedDivision, onDivisionChange }: DivisionFilterProps) {
  return (
    <div className="border-b border-gray-200 -mx-6 px-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        <button
          onClick={() => onDivisionChange('all')}
          className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-all duration-200 ${
            selectedDivision === 'all' 
              ? 'bg-blue-100 text-blue-700 font-medium shadow-sm' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Все подразделения
        </button>
        {divisions.map((division) => (
          <button
            key={division.id}
            onClick={() => onDivisionChange(division.id)}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-all duration-200 ${
              (selectedDivision === division.id || selectedDivision === division.name)
                ? 'bg-blue-100 text-blue-700 font-medium shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {division.name}
          </button>
        ))}
      </div>
    </div>
  );
}