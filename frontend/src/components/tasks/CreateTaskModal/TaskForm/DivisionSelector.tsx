import React from 'react';
import '../style.css';

interface DivisionSelectorProps {
  divisions: Division[];
  selectedDivisionId: string;
  onChange: (divisionId: string) => void;
  isLoading: boolean;
  onDivisionChange: (divisionId: string) => void; // Добавьте этот проп
}

export function DivisionSelector({
  divisions,
  selectedDivisionId,
  onChange,
  isLoading,
  onDivisionChange
}: DivisionSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange(value);
    onDivisionChange(value); // Вызываем обработчик при изменении
  };

  return (
    <div className="task-form-field">
      <label htmlFor="division-select" className="task-form-label">
        Подразделение
      </label>
      <select
        id="division-select"
        value={selectedDivisionId}
        onChange={handleChange}
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