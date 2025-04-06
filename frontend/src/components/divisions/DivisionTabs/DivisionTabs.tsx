import React from 'react';
import { divisions } from '../../../data/divisionsData';

interface DivisionTabsProps {
  selectedDivision: string;
  onSelectDivision: (division: string) => void;
}

export function DivisionTabs({ selectedDivision, onSelectDivision }: DivisionTabsProps) {
  return (
    <div className="border-b mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => onSelectDivision('all')}
          className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
            selectedDivision === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Все подразделения
        </button>
        {divisions.map((division) => (
          <button
            key={division.id}
            onClick={() => onSelectDivision(division.name)}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
              selectedDivision === division.name
                ? 'bg-blue-100 text-blue-700'
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