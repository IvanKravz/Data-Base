import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Division } from '../../../../types';
import { PersonnelList } from '../../../personnel/PersonnelList/PersonnelList';
import { SearchBar } from '../../../common/SearchBar';
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom';
import { RootState } from '../../../../store/store';
import { divisionsApi } from '../../../../api';
import './style.css'

interface PersonnelSectionProps {
  division: Division;
  activeSubdivision: string | null;
}

export function PersonnelSection() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [division, getDivisions] = useState('');
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const data = await divisionsApi.getDivisionById(id, token);
        getDivisions(data);
      } catch (err) {
        setError('Не удалось загрузить подразделения');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDivisions();
  }, [token]);

  const onBack = () => {
    navigate(`/divisions/${division.id}`);
  };

  return (
    <div className="personnel-container">
      <h2 className="personnel-header-division">
        <button
          onClick={onBack}
          className="back-button"
        >
          <ArrowLeft className="back-button-icon" />
        </button>
        Персонал подразделения
      </h2>
      <div className="search-container">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Поиск по ФИО, званию, должности, личному номеру, телефону..."
        />
      </div>

      <PersonnelList
        selectedDivision={division?.name}
        selectedCategory="all"
        selectedAccessClass="all"
        searchTerm={searchTerm}
        division={division}
      />
    </div>
  );
}