import React from 'react';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}

export function DateField({
  label,
  value,
  onChange,
  onRemove
}: DateFieldProps) {
  return (
    <div className="search-field">
      <label>{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <div className="selected-filters">
          <span className="filter-tag">
            {value}
            <button onClick={onRemove}>×</button>
          </span>
        </div>
      )}
    </div>
  );
}