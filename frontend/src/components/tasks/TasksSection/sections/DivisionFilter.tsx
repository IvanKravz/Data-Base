import React from 'react';
import { divisions } from '../../../../data/divisionsData';
import '../style.css';

interface DivisionFilterProps {
  selectedDivision: string;
  onDivisionChange: (division: string) => void;
}

export function DivisionFilter({ selectedDivision, onDivisionChange }: DivisionFilterProps) {
  return (
    <div className="tasks-division-filter">
      <div className="tasks-division-buttons">
        <button
          onClick={() => onDivisionChange('all')}
          className={`tasks-division-button ${
            selectedDivision === 'all' ? 'tasks-division-button-active' : ''
          }`}
        >
          Все подразделения
        </button>
        {divisions.map((division) => (
          <button
            key={division.id}
            onClick={() => onDivisionChange(division.id)}
            className={`tasks-division-button ${
              selectedDivision === division.id ? 'tasks-division-button-active' : ''
            }`}
          >
            {division.name}
          </button>
        ))}
      </div>
    </div>
  );
}