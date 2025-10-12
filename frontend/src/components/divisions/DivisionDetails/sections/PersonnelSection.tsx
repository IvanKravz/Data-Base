// PersonnelSection.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { PersonnelList } from '../../../personnel/PersonnelList/PersonnelList';
import { SearchBar } from '../../../common/SearchBar';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, divisionsApi, employeesApi } from '../../../../api';
import './style.css'

export function PersonnelSection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [division, setDivision] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subdivisionName, setSubdivisionName] = useState('');
  const [personnel, setPersonnel] = useState([]);

  const isGlobalView = !id;


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isGlobalView) {
          // Глобальный режим - загружаем всех сотрудников
          const allPersonnel = await employeesApi.getPersonnel(token, {});
          console.log('allPersonnel', allPersonnel)
          setPersonnel(allPersonnel);
          authApi.updateGlobalView(true);
        } else {
          // Режим подразделения - используем старую проверку и логику
          if (!id || !token) return;

          authApi.updateGlobalView(false);
          
          const data = await divisionsApi.getDivisionById(id, token);
          setDivision(data);

          const subdivisionId = searchParams.get('subdivision');
          if (subdivisionId) {
            const subdivision = data.subdivisions?.find((s: any) => s.id.toString() === subdivisionId.toString());
            setSubdivisionName(subdivision?.name || '');
          }

          // Загружаем сотрудников с фильтрацией на клиенте (как было раньше)
          const allPersonnel = await employeesApi.getPersonnel(token, {});

          // Фильтруем сотрудников по подразделению и отделению на клиенте
          const filteredPersonnel = allPersonnel.filter(person => {
            const matchesDivision = person.division?.id?.toString() === id.toString();

            if (subdivisionId) {
              return matchesDivision && person.subdivision?.id?.toString() === subdivisionId.toString();
            }

            return matchesDivision;
          });

          setPersonnel(filteredPersonnel);
        }
      } catch (err) {
        setError('Не удалось загрузить данные');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, searchParams, isGlobalView]);

  const onBack = () => {
    if (isGlobalView) {
      navigate('/');
    } else {
      navigate(`/divisions/${id}`);
    }
  };

  const onCreateEmployee = () => {
    navigate(`/personnel/create`);
  };

  const getHeaderTitle = () => {
    if (isGlobalView) {
      return 'Личный состав: Все подразделения';
    }
    return `Личный состав: ${division?.name || ''} ${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  };

  if (loading) {
    return <div className="flex justify-center py-12">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  console.log('isGlobalView', isGlobalView)

  return (
    <>
      <div className="personnel-header-wrapper">
        <h3 className="personnel-header-division">
          {!isGlobalView && <button
            onClick={onBack}
            className="back-button"
          >
            <ArrowLeft className="back-button-icon" />
          </button>
          }
          {getHeaderTitle()}
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
          selectedDivision={isGlobalView ? 'Все подразделения' : division?.name}
          selectedCategory="all"
          selectedAccessClass="all"
          searchTerm={searchTerm}
          division={division}
          personnel={personnel}
          loading={loading}
        />
      </div>
    </>
  );
}