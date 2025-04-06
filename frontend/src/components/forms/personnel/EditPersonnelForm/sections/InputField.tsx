import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

export const InputField = ({
  label,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  required = false,
  placeholder = ''
}: InputFieldProps) => {
  return (
    <div className="form-field-group">
      <label className="form-label">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`form-input ${Icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
};