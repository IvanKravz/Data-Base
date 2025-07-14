import { Search } from 'lucide-react';
import './style.css';

interface SearchBarProps {
  value: string;
  onChange: (term: string) => void;
  placeholder: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="search-bar-container">
      <Search className="search-bar-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-bar-input"
      />
    </div>
  );
}