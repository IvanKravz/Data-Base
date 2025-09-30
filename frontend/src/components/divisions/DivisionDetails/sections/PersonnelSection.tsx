import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { PersonnelList } from '../../../personnel/PersonnelList/PersonnelList';
import { SearchBar } from '../../../common/SearchBar';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'; // Добавлен useSearchParams
import { divisionsApi } from '../../../../api';
import './style.css'

export function PersonnelSection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Добавлен для получения параметров подразделения
  const [searchTerm, setSearchTerm] = useState('');
  const [division, setDivision] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subdivisionName, setSubdivisionName] = useState(''); // Добавлено состояние для названия подразделения

  useEffect(() => {
    const fetchDivision = async () => {
      try {
        if (!id || !token) return;
        const data = await divisionsApi.getDivisionById(id, token);
        setDivision(data);

        // Получаем ID подразделения из query параметров
        const subdivisionId = searchParams.get('subdivision');
        if (subdivisionId) {
          // Ищем подразделение в данных division
          const subdivision = data.subdivisions?.find((s: any) => s.id.toString() === subdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        }
      } catch (err) {
        setError('Не удалось загрузить подразделение');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDivision();
  }, [id, token, searchParams]); // Добавлен searchParams в зависимости

  const onBack = () => {
    navigate(`/divisions/${division.id}`);
  };

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
          Личный состав: {division?.name ? ` ${division?.name}` : ''} {subdivisionName ? ` / ${subdivisionName}` : ''}
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

          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Поиск по ФИО, званию, должности, личному номеру, телефону..."
          />
       

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