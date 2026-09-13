import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 7)}`;
    return (
        <div className={`input-wrapper ${className}`}>
            {label && <label htmlFor={inputId} className="input-label">{label}</label>}
            <input id={inputId} className={`input-field ${error ? 'input-error' : ''}`} {...props} />
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};