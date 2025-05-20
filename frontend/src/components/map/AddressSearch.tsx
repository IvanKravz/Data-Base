// AddressSearch.tsx
import React, { useState, useEffect } from 'react';
import { geocodeAddress } from './data/addresses';
import './style.css';

interface AddressSearchProps {
  onAddressFound: (coords: [number, number]) => void;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ onAddressFound }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      const result = geocodeAddress(searchQuery);
      if (result) {
        onAddressFound([result.lat, result.lng]);
        setError('');
      } else {
        setError('Объект не найден');
      }
    } catch (err) {
      setError('Ошибка при поиске');
    }
  };

  return (
    <div className="address-search-container">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Поиск по названию или адресу"
        className="address-input"
        onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button onClick={handleSearch} className="search-button">
        Поиск
      </button>
      {error && <div className="search-error">{error}</div>}
    </div>
  );
};

export default AddressSearch;