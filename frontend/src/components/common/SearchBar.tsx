import { Search } from 'lucide-react';
import './style.css';

interface SearchBarProps {
  searchTerm: string;  
  setSearchTerm: (term: string) => void; 
  placeholder: string;
}

export function SearchBar({ searchTerm, setSearchTerm, placeholder }: SearchBarProps) {
  return (
    <div className="search-bar-container">
      <Search className="search-bar-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar-input"
      />
    </div>
  );
}