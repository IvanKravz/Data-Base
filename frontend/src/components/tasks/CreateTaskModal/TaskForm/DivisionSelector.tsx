import React from 'react';
import '../style.css';

interface Division {
  id: string;
  name: string;
}

interface DivisionSelectorProps {
  divisions: Division[];
  selectedDivisionId: string;
  onChange: (divisionId: string) => void;
  isLoading: boolean;
}

export function DivisionSelector({
  divisions,
  selectedDivisionId,
  onChange,
  isLoading,
}: DivisionSelectorProps) {
  // Если доступно только одно подразделение – показываем disabled select
  if (divisions.length === 1) {
    const singleDivision = divisions[0];
    return (
      <div className="task-form-field">
        <label className="task-form-label">Подразделение</label>
        <select
          id="division-select"
          value={singleDivision.id}
          disabled
          className="task-form-select task-form-select-disabled"
        >
          <option value={singleDivision.id}>{singleDivision.name}</option>
        </select>
      </div>
    );
  }

  return (
    <div className="task-form-field">
      <label htmlFor="division-select" className="task-form-label">
        Подразделение
      </label>
      <select
        id="division-select"
        value={selectedDivisionId}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        className="task-form-select"
        required
      >
        <option value="">Выберите подразделение</option>
        {divisions.map(division => (
          <option key={division.id} value={division.id}>
            {division.name}
          </option>
        ))}
      </select>
    </div>
  );
}