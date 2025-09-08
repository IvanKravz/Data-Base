import React from 'react';

interface DateFieldProps {
  label: string;
  filterType: string;
  value: string;
  filters: string;
  onChange: (value: string) => void;
  onRemoveFilter: () => void;
}

export function DateField({
  label,
  value,
  filters,
  onChange,
  onRemoveFilter
}: DateFieldProps) {
  return (
    <div className="search-field">
      <label>{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {filters && (
        <div className="selected-filters">
          <span className="filter-tag">
            {filters}
            <button onClick={onRemoveFilter}>×</button>
          </span>
        </div>
      )}
    </div>
  );
}