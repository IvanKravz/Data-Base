import React, { useMemo, useState } from 'react';

interface SearchFieldProps {
  type: string;
  label: string;
  placeholder: string;
  currentInputs: { [key: string]: string };
  filters: { [key: string]: string[] };
  suggestions: { [key: string]: string[] };
  onInputChange: (type: string, value: string) => void;
  onFocus: (type: string) => void;
  onBlur: () => void;
  onKeyPress: (e: React.KeyboardEvent, type: string) => void;
  onRemoveFilter: (type: string, index: number) => void;
  onSuggestionSelect: (suggestion: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const SearchField = ({
  type,
  label,
  placeholder,
  currentInputs,
  filters,
  suggestions,
  onInputChange,
  onFocus,
  onBlur,
  onKeyPress,
  onRemoveFilter,
  onSuggestionSelect,
  inputRef
}: SearchFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showLocalSuggestions, setShowLocalSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!isFocused || !currentInputs[type]) return [];
    
    return suggestions[type].filter(suggestion =>
      suggestion.toLowerCase().includes(currentInputs[type].toLowerCase())
    ).slice(0, 10);
  }, [isFocused, currentInputs, suggestions, type]);

  const handleFocus = () => {
    setIsFocused(true);
    setShowLocalSuggestions(currentInputs[type].length > 0);
    onFocus(type);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowLocalSuggestions(false);
      onBlur();
    }, 200);
  };

  const handleInputChangeLocal = (value: string) => {
    onInputChange(type, value);
    setShowLocalSuggestions(value.length > 0);
  };

  return (
    <div className="search-field">
      <label>{label}</label>
      <div className="input-with-suggestions">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={currentInputs[type]}
          onChange={(e) => handleInputChangeLocal(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={(e) => onKeyPress(e, type)}
        />
        
        {isFocused && showLocalSuggestions && filteredSuggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {filteredSuggestions.map(suggestion => (
              <div
                key={suggestion}
                className="suggestion-item"
                onMouseDown={() => onSuggestionSelect(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="selected-filters">
        {filters[type].map((value, index) => (
          <span key={index} className="filter-tag">
            {value}
            <button onClick={() => onRemoveFilter(type, index)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
};