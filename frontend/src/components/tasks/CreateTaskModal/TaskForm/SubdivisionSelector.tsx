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
  restrictedSubdivisionId?: string | null;
}

export function SubdivisionSelector({
  subdivisions,
  selectedSubdivisionId,
  onChange,
  isLoading,
  hasDivision,
  restrictedSubdivisionId
}: SubdivisionSelectorProps) {
  if (!hasDivision || subdivisions.length === 0) return null;

  if (restrictedSubdivisionId) {
    const restrictedSubdivision = subdivisions.find(sub => sub.id === restrictedSubdivisionId);
    return (
      <div className="task-form-field">
        <label className="task-form-label">Отделение</label>
        <div className="restricted-subdivision-info">
          <span className="restricted-subdivision-text">
            {restrictedSubdivision?.name || 'Ваше отделение'}
          </span>
          <span className="restricted-subdivision-note">
            (доступно только ваше отделение)
          </span>
        </div>
        <input type="hidden" value={restrictedSubdivisionId} onChange={() => {}} />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange(value === '' ? null : value);
  };

  return (
    <div className="task-form-field">
      <label htmlFor="subdivision-select" className="task-form-label">
        Отделение
      </label>
      <select
        id="subdivision-select"
        value={selectedSubdivisionId || ''}
        onChange={handleChange}
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