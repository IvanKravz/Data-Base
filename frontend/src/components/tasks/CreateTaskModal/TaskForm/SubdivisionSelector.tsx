import React from 'react';
import '../style.css';

interface Subdivision {
  id: string;
  name: string;
}

interface SubdivisionSelectorProps {
  subdivisions: Subdivision[];
  selectedSubdivisionId: string | null;
  onChange: (subdivisionId: string | null) => void;
  isLoading: boolean;
  hasDivision: boolean;
}

export function SubdivisionSelector({
  subdivisions,
  selectedSubdivisionId,
  onChange,
  isLoading,
  hasDivision,
}: SubdivisionSelectorProps) {
  if (!hasDivision || subdivisions.length === 0) return null;

  // Если доступно только одно отделение – показываем disabled select
  if (subdivisions.length === 1) {
    const singleSubdivision = subdivisions[0];
    return (
      <div className="task-form-field">
        <label className="task-form-label">Отделение</label>
        <select
          id="subdivision-select"
          value={singleSubdivision.id}
          disabled
          className="task-form-select task-form-select-disabled"
        >
          <option value={singleSubdivision.id}>{singleSubdivision.name}</option>
        </select>
      </div>
    );
  }

  return (
    <div className="task-form-field">
      <label htmlFor="subdivision-select" className="task-form-label">
        Отделение
      </label>
      <select
        id="subdivision-select"
        value={selectedSubdivisionId || ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        disabled={isLoading}
        className="task-form-select"
        aria-busy={isLoading}
        aria-describedby={isLoading ? "subdivision-loading" : undefined}
      >
        <option value="">Не выбрано</option>
        {subdivisions.map(subdivision => (
          <option key={subdivision.id} value={subdivision.id}>
            {subdivision.name}
          </option>
        ))}
      </select>
      {isLoading && (
        <span id="subdivision-loading" className="sr-only">Загрузка...</span>
      )}
    </div>
  );
}