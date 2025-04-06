import { Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  placeholder: string;
}

export function SearchBar({ searchTerm, setSearchTerm, placeholder }: SearchBarProps) {

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`pl-10 pr-4 py-2 w-full rounded-lg border 'bg-gray-700 border-gray-600 text-gray-200' 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
      />
    </div>
  );
}