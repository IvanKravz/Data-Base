import React from 'react';
import './Select.css';

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
    label?: string;
    options: SelectOption[];
    value?: string | number | null;
    onChange?: (value: string | number | null) => void;
    placeholder?: string;
    allowClear?: boolean;
    error?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder,
    allowClear = false,
    error,
    className = '',
    id,
    ...props
}) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 7)}`;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '') {
            onChange?.(null);
        } else {
            onChange?.(val);
        }
    };

    return (
        <div className={`select-wrapper ${className}`}>
            {label && <label htmlFor={selectId} className="select-label">{label}</label>}
            <select
                id={selectId}
                className={`select-field ${error ? 'select-error' : ''}`}
                value={value ?? ''}
                onChange={handleChange}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <span className="select-error-message">{error}</span>}
        </div>
    );
};