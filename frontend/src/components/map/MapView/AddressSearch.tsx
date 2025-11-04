// AddressSearch.tsx
import React, { useState, useEffect } from 'react';
import { geocodeAddress } from '../data/addresses';
import './style.css';

interface AddressSearchProps {
  onAddressFound: (coords: [number, number]) => void;
  onNameFound?: (name: string) => void; // Добавляем новый пропс
}

const AddressSearch: React.FC<AddressSearchProps> = ({ onAddressFound, onNameFound }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      // Сначала пробуем найти по адресу
      const result = geocodeAddress(searchQuery);
      console.log('result.name', result.name)
      if (result) {
        onAddressFound([result.lat, result.lng]);
        if (onNameFound && result.name) {
          onNameFound(result.name);
        }
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
        placeholder="Поиск, например Хабаровск, улица Ленина, 2"
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