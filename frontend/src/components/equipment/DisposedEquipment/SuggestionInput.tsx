// components/equipment/DisposedEquipment/SuggestionInput.tsx
import React, { useState, useRef } from 'react';

interface SuggestionInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onRemove?: () => void;
}

export function SuggestionInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder = '',
  inputRef,
  onRemove
}: SuggestionInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef || localRef;

  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 10);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSuggestions(val.length > 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onChange(inputValue.trim());
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleFocus = () => {
    if (inputValue.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="deaf-field">
      <label>{label}</label>
      <div className="deaf-suggestion-wrapper">
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="deaf-input"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {filteredSuggestions.map(suggestion => (
              <div
                key={suggestion}
                className="suggestion-item"
                onMouseDown={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      {value && (
        <div className="deaf-selected-filter">
          <span className="deaf-filter-tag">
            {value}
            {onRemove && <button onClick={onRemove}>×</button>}
          </span>
        </div>
      )}
    </div>
  );
}