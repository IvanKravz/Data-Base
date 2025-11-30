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
  onDivisionChange: (divisionId: string) => void;
  restrictedDivisionId?: string | null; // Новый пропс
}

export function DivisionSelector({
  divisions,
  selectedDivisionId,
  onChange,
  isLoading,
  onDivisionChange,
  restrictedDivisionId // Принимаем новый пропс
}: DivisionSelectorProps) {
  // Если есть ограничение по подразделению, показываем специальное сообщение вместо выпадающего списка
  if (restrictedDivisionId) {
    const restrictedDivision = divisions.find(div => div.id === restrictedDivisionId);
    return (
      <div className="task-form-field">
        <label className="task-form-label">
          Подразделение
        </label>
        <div className="restricted-division-info">
          <span className="restricted-division-text">
            {restrictedDivision?.name || 'Ваше подразделение'}
          </span>
          <span className="restricted-division-note">
            (доступно только ваше подразделение)
          </span>
        </div>
        <input
          type="hidden"
          value={restrictedDivisionId}
          onChange={() => {}} // Пустая функция для подавления предупреждений
        />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange(value);
    onDivisionChange(value);
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