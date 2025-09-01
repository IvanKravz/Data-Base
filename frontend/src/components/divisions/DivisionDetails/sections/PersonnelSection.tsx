import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react'; // Добавлен импорт Plus
import { PersonnelList } from '../../../personnel/PersonnelList/PersonnelList';
import { SearchBar } from '../../../common/SearchBar';
import { useParams, useNavigate } from 'react-router-dom';
import { divisionsApi } from '../../../../api';
import './style.css'

export function PersonnelSection() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [division, setDivision] = useState<any>(null); // Переименовано getDivisions -> setDivision
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDivision = async () => {
      try {
        if (!id || !token) return;
        const data = await divisionsApi.getDivisionById(id, token);
        setDivision(data);
      } catch (err) {
        setError('Не удалось загрузить подразделение');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDivision();
  }, [id, token]);

  const onBack = () => {
    navigate(`/divisions/${division.id}`);
  };

  // Навигация на страницу создания сотрудника
  const onCreateEmployee = () => {
    navigate(`/personnel/create`);
  };

  return (
    <>
      <div className="personnel-header-wrapper">
        <h3 className="personnel-header-division">
          <button
            onClick={onBack}
            className="back-button"
          >
            <ArrowLeft className="back-button-icon" />
          </button>
          Личный состав
        </h3>
        <button
          onClick={onCreateEmployee}
          className="create-employee-button"
        >
          <Plus size={16} />
          <span>Создать сотрудника</span>
        </button>
      </div>

      <div className="personnel-container">
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
    </>
  );
}