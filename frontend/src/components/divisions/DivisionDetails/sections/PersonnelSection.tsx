// PersonnelSection.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { PersonnelList } from '../../../personnel/PersonnelList/PersonnelList';
import { SearchBar } from '../../../common/SearchBar';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, divisionsApi, employeesApi } from '../../../../api';
import './style.css'
import { isExploitationChief, isExploitationEmployee, getCurrentUser, getPermissions } from '../../../../api/utils/permissions';

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

  // Стабилизированные значения
  const stableToken = useMemo(() => token, [token]);
  const stableSubdivisionId = useMemo(() => searchParams.get('subdivision'), [searchParams]);
  const stableCurrentUser = useMemo(() => currentUser, [JSON.stringify(currentUser)]);

  // Мемоизируем вычисления типов пользователей
  const isExploitationUser = useMemo(() => isExploitationChief() || isExploitationEmployee(), []);
  const isChief = useMemo(() => isExploitationChief(), []);

  // Для эксплуатационных пользователей отключаем глобальный режим
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  // Получаем ID подразделения пользователя
  const userDivisionId = useMemo(() => {
    if (!stableCurrentUser?.division_info) return null;
    return stableCurrentUser.division_info.id;
  }, [stableCurrentUser]);

  // Получаем ID отделения пользователя
  const userSubdivisionId = useMemo(() => {
    if (!stableCurrentUser?.division_info || isChief) return null;
    return stableCurrentUser.division_info.subdivision?.id || null;
  }, [stableCurrentUser, isChief]);

  // Мемоизированная функция загрузки данных
  const fetchData = useCallback(async () => {
    if (!stableToken) return;

    try {
      setLoading(true);
      setError(null);

      if (isGlobalView) {
        // Глобальный режим - загружаем всех сотрудников
        const allPersonnel = await employeesApi.getPersonnel(stableToken, {});
        setPersonnel(allPersonnel);
        authApi.updateGlobalView(true);
      } else if (isExploitationUser) {
        // Режим для эксплуатационных пользователей
        authApi.updateGlobalView(false);

        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }

        const targetSubdivisionId = stableSubdivisionId || userSubdivisionId;

        const data = await divisionsApi.getDivisionById(userDivisionId, stableToken);
        setDivision(data);

        // Устанавливаем название отделения если есть
        if (targetSubdivisionId) {
          const subdivision = data.subdivisions?.find((s: any) => s.id.toString() === targetSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }

        // Загружаем всех сотрудников и фильтруем
        const allPersonnel = await employeesApi.getPersonnel(stableToken, {});

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

        const data = await divisionsApi.getDivisionById(id, stableToken);
        setDivision(data);

        // Устанавливаем название отделения если есть
        if (stableSubdivisionId) {
          const subdivision = data.subdivisions?.find((s: any) => s.id.toString() === stableSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }

        const allPersonnel = await employeesApi.getPersonnel(stableToken, {});
        const filteredPersonnel = allPersonnel.filter(person => {
          const matchesDivision = person.division?.id?.toString() === id.toString();

          if (stableSubdivisionId) {
            return matchesDivision && person.subdivision?.id?.toString() === stableSubdivisionId.toString();
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
  }, [stableToken, isGlobalView, isExploitationUser, userDivisionId, userSubdivisionId, id, stableSubdivisionId]);

  // Основной эффект загрузки данных
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Логика фильтрации для отделения
  const filterBySubdivision = useCallback((items: any[]) => {
    // Для сотрудника эксплуатации не фильтруем по отделению - показываем весь персонал подразделения
    if (isExploitationUser && !id) {
      return items;
    }

    // Для обычных случаев
    if (isGlobalView) return items;
    if (!stableSubdivisionId) return items;

    return items.filter(item =>
      item.subdivision?.id?.toString() === stableSubdivisionId.toString()
    );
  }, [isExploitationUser, id, isGlobalView, stableSubdivisionId]);

  // Фильтруем персонал по отделению
  const displayedPersonnel = useMemo(() => {
    return filterBySubdivision(personnel);
  }, [personnel, filterBySubdivision]);

  const handleBack = useCallback(() => {
    if (isGlobalView) {
      navigate('/');
    } else {
      if (stableSubdivisionId) {
        navigate(`/divisions/${id}?subdivision=${stableSubdivisionId}`);
      } else {
        navigate(`/divisions/${id}`);
      }
    }
  }, [isGlobalView, navigate, id, stableSubdivisionId]);

  const onCreateEmployee = useCallback(() => {
    const state = {
      from: 'personnel-section',
      divisionId: id,
      subdivisionId: stableSubdivisionId,
    };
  
    navigate(`/personnel/create`, { state });
  }, [navigate, id, stableSubdivisionId]);

  const getHeaderTitle = () => {
    if (isExploitationUser && !id) {
      const divisionName = stableCurrentUser?.division_info?.name || 'Ваше подразделение';
      // Для всех эксплуатационных пользователей показываем только подразделение
      return `Личный состав: ${divisionName}`;
    }

    if (isGlobalView) {
      return 'Личный состав: Все подразделения';
    }

    // Для режима конкретного подразделения
    return `Личный состав: ${division?.name || ''} ${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  };

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Проверка прав доступа для кнопки "Добавить сотрудника"
  const canCreateEmployee = useMemo(() => {
    const permissions = getPermissions();
    if (permissions && permissions.employees) {
      return permissions.employees.can_edit;
    }
    return false;
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
            <button onClick={handleBack} className="back-button">
              <ArrowLeft className="back-button-icon" />
            </button>
          )}
          {getHeaderTitle()}
        </h3>
        {canCreateEmployee && (<button
          onClick={onCreateEmployee}
          className="create-employee-button"
        >
          <Plus size={16} />
          <span>Создать сотрудника</span>
        </button>
        )}
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
            name: stableCurrentUser?.division_info?.name
          } : division}
          personnel={displayedPersonnel}
          loading={loading}
          divisionId={id} // Добавляем пропсы для навигации
          subdivisionId={stableSubdivisionId}
        />
      </div>
    </>
  );
}