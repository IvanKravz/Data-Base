// PersonnelSection.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { PersonnelList } from '../../../personnel/PersonnelList/PersonnelList';
import { SearchBar } from '../../../common/SearchBar';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, divisionsApi, employeesApi } from '../../../../api';
import './style.css'
import { isExploitationChief, isExploitationEmployee, getCurrentUser } from '../../../../api/utils/permissions';

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

  // Получаем данные текущего пользователя
  const currentUser = getCurrentUser();

  // Мемоизируем вычисления типов пользователей
  const isExploitationUser = useMemo(() => isExploitationChief() || isExploitationEmployee(), []);
  const isChief = useMemo(() => isExploitationChief(), []);

  // Для эксплуатационных пользователей отключаем глобальный режим
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  // Получаем ID подразделения пользователя
  const userDivisionId = useMemo(() => {
    if (!currentUser?.division_info) return null;
    return currentUser.division_info.id;
  }, [currentUser]);

  // Получаем ID отделения пользователя
  const userSubdivisionId = useMemo(() => {
    if (!currentUser?.division_info || isChief) return null;
    return currentUser.division_info.subdivision?.id || null;
  }, [currentUser, isChief]);

  // Получаем ID отделения из URL параметров
  const urlSubdivisionId = useMemo(() => {
    return searchParams.get('subdivision');
  }, [searchParams]);

  // Мемоизированная функция загрузки данных
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      if (isGlobalView) {
        // Глобальный режим - загружаем всех сотрудников
        const allPersonnel = await employeesApi.getPersonnel(token, {});
        setPersonnel(allPersonnel);
        authApi.updateGlobalView(true);
      } else if (isExploitationUser) {
        // Режим для эксплуатационных пользователей
        authApi.updateGlobalView(false);

        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }

        const data = await divisionsApi.getDivisionById(userDivisionId, token);
        setDivision(data);

        // Определяем какое отделение использовать: из URL или из данных пользователя
        const targetSubdivisionId = urlSubdivisionId || userSubdivisionId;

        // Устанавливаем название отделения если есть
        if (targetSubdivisionId) {
          const subdivision = data.subdivisions?.find((s: any) => s.id.toString() === targetSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }

        // Загружаем всех сотрудников и фильтруем
        const allPersonnel = await employeesApi.getPersonnel(token, {});

        const filteredPersonnel = allPersonnel.filter(person => {
          const matchesDivision = person.division?.id?.toString() === userDivisionId.toString();

          if (targetSubdivisionId) {
            return matchesDivision && person.subdivision?.id?.toString() === targetSubdivisionId.toString();
          }

          return matchesDivision;
        });

        setPersonnel(filteredPersonnel);
      } else {
        // Стандартный режим подразделения
        if (!id) return;

        authApi.updateGlobalView(false);

        const data = await divisionsApi.getDivisionById(id, token);
        setDivision(data);

        // Используем subdivision из URL параметров
        const subdivisionId = urlSubdivisionId;
        if (subdivisionId) {
          const subdivision = data.subdivisions?.find((s: any) => s.id.toString() === subdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }

        const allPersonnel = await employeesApi.getPersonnel(token, {});
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
      console.error('Error fetching data:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [token, isGlobalView, isExploitationUser, userDivisionId, userSubdivisionId, id, urlSubdivisionId]);

  // Основной эффект загрузки данных
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onBack = useCallback(() => {
    if (isGlobalView) {
      navigate('/');
    } else {
      // Если есть subdivision в URL, возвращаемся к подразделению с учетом отделения
      if (urlSubdivisionId) {
        navigate(`/divisions/${id}?subdivision=${urlSubdivisionId}`);
      } else {
        navigate(`/divisions/${id}`);
      }
    }
  }, [isGlobalView, navigate, id, urlSubdivisionId]);

  const onCreateEmployee = useCallback(() => {
    // При создании сотрудника передаем параметры подразделения и отделения
    const queryParams = new URLSearchParams();
    if (id) queryParams.append('division', id);
    if (urlSubdivisionId) queryParams.append('subdivision', urlSubdivisionId);

    navigate(`/personnel/create?${queryParams.toString()}`);
  }, [navigate, id, urlSubdivisionId]);

  const getHeaderTitle = useCallback(() => {
    if (isGlobalView) {
      return 'Личный состав: Все подразделения';
    }

    if (isExploitationUser) {
      const divisionName = currentUser?.division_info?.name || 'Ваше подразделение';
      // Для эксплуатационных пользователей учитываем subdivision из URL
      if (urlSubdivisionId) {
        return `Личный состав: ${divisionName}${subdivisionName ? ` / ${subdivisionName}` : ''}`;
      } else if (isChief) {
        return `Личный состав: ${divisionName}`;
      } else {
        const userSubdivisionName = currentUser?.division_info?.subdivision?.name || '';
        return `Личный состав: ${divisionName}${userSubdivisionName ? ` / ${userSubdivisionName}` : ''}`;
      }
    }

    return `Личный состав: ${division?.name || ''} ${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  }, [isGlobalView, isExploitationUser, isChief, currentUser, division, subdivisionName, urlSubdivisionId]);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <>
      <div className="personnel-header-wrapper">
        <h3 className="personnel-header-division">
          {id && (
            <button onClick={onBack} className="back-button">
              <ArrowLeft className="back-button-icon" />
            </button>
          )}
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
          setSearchTerm={handleSearchTermChange}
          placeholder="Поиск по ФИО, званию, должности, личному номеру, телефону..."
        />

        <PersonnelList
          selectedDivision={isGlobalView ? 'Все подразделения' : division?.name}
          selectedCategory="all"
          selectedAccessClass="all"
          searchTerm={searchTerm}
          division={isExploitationUser ? {
            id: userDivisionId,
            name: currentUser?.division_info?.name
          } : division}
          personnel={personnel}
          loading={loading}
        />
      </div>
    </>
  );
}