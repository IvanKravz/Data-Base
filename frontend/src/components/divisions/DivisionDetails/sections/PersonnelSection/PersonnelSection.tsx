// PersonnelSection.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Plus, Filter } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { PersonnelList } from '../../../../personnel/PersonnelList/PersonnelList';
import { SearchBar } from '../../../../common/SearchBar';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { authApi, divisionsApi, employeesApi } from '../../../../../api';
import './PersonnelSection.css';
import { PersonnelAdvancedSearchModal } from '../../../../personnel/forms/PersonnelAdvancedSearchModal/PersonnelAdvancedSearchModal';

interface PersonnelAdvancedSearchFilters {
  ranks: string[];
  positions: string[];
  divisions: string[];
  subdivisions: string[];
  networkClasses: string[];
  gtForms: string[];
}

export function PersonnelSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [division, setDivision] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subdivisionName, setSubdivisionName] = useState('');
  const [personnel, setPersonnel] = useState([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<PersonnelAdvancedSearchFilters>({
    ranks: [],
    positions: [],
    divisions: [],
    subdivisions: [],
    networkClasses: [],
    gtForms: []
  });

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const stableToken = useMemo(() => token, [token]);
  const stableSubdivisionId = useMemo(() => searchParams.get('subdivision'), [searchParams]);

  const isExploitationUser = useMemo(() => user?.roles?.includes('exploitation_chief') || user?.roles?.includes('exploitation_employee'), [user]);
  const isChief = useMemo(() => user?.roles?.includes('exploitation_chief'), [user]);
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  const userDivisionId = useMemo(() => user?.division_info?.id ?? null, [user]);
  const userSubdivisionId = useMemo(() => {
    if (!user?.division_info || isChief) return null;
    return user.division_info.subdivision?.id ?? null;
  }, [user, isChief]);

  const canCreateEmployee = useMemo(() => permissions?.models?.Employee?.includes('add') ?? false, [permissions]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setAdvancedFilters({ ranks: [], positions: [], divisions: [], subdivisions: [], networkClasses: [], gtForms: [] });
  }, []);

  const handleAdvancedFilterChange = useCallback((filterType: keyof PersonnelAdvancedSearchFilters, values: any) => {
    setAdvancedFilters(prev => ({ ...prev, [filterType]: values }));
  }, []);

  const fetchData = useCallback(async () => {
    if (!stableToken) return;
    try {
      setLoading(true);
      setError(null);

      if (isGlobalView) {
        const allPersonnel = await employeesApi.getPersonnel(stableToken, {});
        setPersonnel(allPersonnel);
        authApi.updateGlobalView(true);
      } else if (isExploitationUser) {
        authApi.updateGlobalView(false);
        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }
        const targetSubdivisionId = stableSubdivisionId || userSubdivisionId;
        const data = await divisionsApi.getDivisionById(userDivisionId, stableToken);
        setDivision(data);
        if (targetSubdivisionId) {
          const subdivision = data.subdivisions?.find((s: any) => s.id.toString() === targetSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }
        const allPersonnel = await employeesApi.getPersonnel(stableToken, {});
        const filtered = allPersonnel.filter(person => {
          const matchesDivision = person.division?.id?.toString() === userDivisionId.toString();
          if (targetSubdivisionId) return matchesDivision && person.subdivision?.id?.toString() === targetSubdivisionId.toString();
          return matchesDivision;
        });
        setPersonnel(filtered);
      } else {
        if (!id) return;
        authApi.updateGlobalView(false);
        const data = await divisionsApi.getDivisionById(id, stableToken);
        setDivision(data);
        if (stableSubdivisionId) {
          const subdivision = data.subdivisions?.find((s: any) => s.id.toString() === stableSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }
        const allPersonnel = await employeesApi.getPersonnel(stableToken, {});
        const filtered = allPersonnel.filter(person => {
          const matchesDivision = person.division?.id?.toString() === id.toString();
          if (stableSubdivisionId) return matchesDivision && person.subdivision?.id?.toString() === stableSubdivisionId.toString();
          return matchesDivision;
        });
        setPersonnel(filtered);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [stableToken, isGlobalView, isExploitationUser, userDivisionId, userSubdivisionId, id, stableSubdivisionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterBySubdivision = useCallback((items: any[]) => {
    if (isExploitationUser && !id) return items;
    if (isGlobalView) return items;
    if (!stableSubdivisionId) return items;
    return items.filter(item => item.subdivision?.id?.toString() === stableSubdivisionId.toString());
  }, [isExploitationUser, id, isGlobalView, stableSubdivisionId]);

  const filterPersonnel = useCallback((items: any[]) => {
    let filtered = items;
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(person => {
        const fullName = (person.full_name || '').toLowerCase().trim();
        const personalNumber = (person.personal_number?.toString() || '').toLowerCase().trim();
        const phoneWork = (person.work_phone || '').toLowerCase().trim();
        const phonePersonal = (person.personal_phone || '').toLowerCase().trim();
        const rank = (person.rank || '').toLowerCase().trim();
        const position = (person.position || '').toLowerCase().trim();
        const divisionName = (person.division?.name || '').toLowerCase().trim();
        const subdivisionName = (person.subdivision?.name || '').toLowerCase().trim();
        return fullName.includes(term) || personalNumber.includes(term) || phoneWork.includes(term) ||
          phonePersonal.includes(term) || rank.includes(term) || position.includes(term) ||
          divisionName.includes(term) || subdivisionName.includes(term);
      });
    }
    if (advancedFilters.ranks.length) {
      filtered = filtered.filter(person => advancedFilters.ranks.some(r => person.rank?.toLowerCase().includes(r.toLowerCase())));
    }
    if (advancedFilters.positions.length) {
      filtered = filtered.filter(person => advancedFilters.positions.some(p => person.position?.toLowerCase().includes(p.toLowerCase())));
    }
    if (advancedFilters.divisions.length) {
      filtered = filtered.filter(person => advancedFilters.divisions.some(d => person.division?.name?.toLowerCase().includes(d.toLowerCase())));
    }
    if (advancedFilters.subdivisions.length) {
      filtered = filtered.filter(person => advancedFilters.subdivisions.some(s => person.subdivision?.name?.toLowerCase().includes(s.toLowerCase())));
    }
    if (advancedFilters.networkClasses.length) {
      filtered = filtered.filter(person => advancedFilters.networkClasses.some(nc => person.sha_details?.access_level?.toString() === nc));
    }
    if (advancedFilters.gtForms.length) {
      filtered = filtered.filter(person => advancedFilters.gtForms.some(gf => person.form_state_secrets === gf));
    }
    return filtered;
  }, [searchTerm, advancedFilters]);

  const displayedPersonnel = useMemo(() => {
    const bySubdivision = filterBySubdivision(personnel);
    return filterPersonnel(bySubdivision);
  }, [personnel, filterBySubdivision, filterPersonnel]);

  const handleBack = useCallback(() => {
    if (isGlobalView) navigate('/');
    else if (stableSubdivisionId) navigate(`/divisions/${id}?subdivision=${stableSubdivisionId}`);
    else navigate(`/divisions/${id}`);
  }, [isGlobalView, navigate, id, stableSubdivisionId]);

  const onCreateEmployee = useCallback(() => {
    const state = {
      from: location.pathname + location.search,
      divisionId: id,
      subdivisionId: stableSubdivisionId,
      divisionName: division?.name,
      subdivisionName: subdivisionName,
      fromSubdivision: !!stableSubdivisionId 
    };
    navigate(`/personnel/create`, { state });
  }, [navigate, id, stableSubdivisionId, location.pathname, location.search, division?.name, subdivisionName]);

  const getHeaderTitle = () => {
    if (isExploitationUser && !id) {
      const divisionName = user?.division_info?.name || 'Ваше подразделение';
      return `Личный состав: ${divisionName}`;
    }
    if (isGlobalView) return 'Личный состав: Все подразделения';
    return `Личный состав: ${division?.name || ''} ${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  };

  const handleSearchTermChange = useCallback((term: string) => setSearchTerm(term), []);

  const hasActiveAdvancedFilters = useMemo(() => Object.values(advancedFilters).some(filters => filters.length > 0), [advancedFilters]);

  if (loading) return <div className="flex justify-center py-12">Загрузка данных...</div>;
  if (error) return <div className="error-message">{error}</div>;

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
        {canCreateEmployee && (
          <button onClick={onCreateEmployee} className="create-employee-button">
            <Plus size={16} />
            <span>Создать сотрудника</span>
          </button>
        )}
      </div>

      <div className="personnel-container">
        <div className="personnel-search-container">
          <div className="search-bar-with-filters">
            <SearchBar searchTerm={searchTerm} setSearchTerm={handleSearchTermChange} placeholder="Поиск по ФИО, званию, должности, подразделению, отделению, личному номеру..." />
            <button className={`advanced-filter-button ${showAdvancedSearch ? 'active' : ''}`} onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}>
              <Filter size={18} />
              {hasActiveAdvancedFilters && <span className="filter-indicator"></span>}
            </button>
          </div>
          {showAdvancedSearch && (
            <PersonnelAdvancedSearchModal isOpen={showAdvancedSearch} filters={advancedFilters} onFilterChange={handleAdvancedFilterChange} onClose={() => setShowAdvancedSearch(false)} onClearFilters={handleClearFilters} personnel={personnel} />
          )}
        </div>

        {hasActiveAdvancedFilters && (
          <div className="active-filters">
            <div className="active-filters-tags">
              {advancedFilters.ranks.map((rank, idx) => (
                <span key={`rank-${idx}`} className="filter-tag">
                  Звание: {rank}
                  <button onClick={() => {
                    const newRanks = [...advancedFilters.ranks];
                    newRanks.splice(idx, 1);
                    handleAdvancedFilterChange('ranks', newRanks);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.positions.map((pos, idx) => (
                <span key={`pos-${idx}`} className="filter-tag">
                  Должность: {pos}
                  <button onClick={() => {
                    const newPositions = [...advancedFilters.positions];
                    newPositions.splice(idx, 1);
                    handleAdvancedFilterChange('positions', newPositions);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.divisions.map((div, idx) => (
                <span key={`div-${idx}`} className="filter-tag">
                  Подразделение: {div}
                  <button onClick={() => {
                    const newDivisions = [...advancedFilters.divisions];
                    newDivisions.splice(idx, 1);
                    handleAdvancedFilterChange('divisions', newDivisions);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.subdivisions.map((sub, idx) => (
                <span key={`sub-${idx}`} className="filter-tag">
                  Отделение: {sub}
                  <button onClick={() => {
                    const newSubdivisions = [...advancedFilters.subdivisions];
                    newSubdivisions.splice(idx, 1);
                    handleAdvancedFilterChange('subdivisions', newSubdivisions);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.networkClasses.map((nc, idx) => (
                <span key={`nc-${idx}`} className="filter-tag">
                  Класс сети: {nc}
                  <button onClick={() => {
                    const newNetworkClasses = [...advancedFilters.networkClasses];
                    newNetworkClasses.splice(idx, 1);
                    handleAdvancedFilterChange('networkClasses', newNetworkClasses);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.gtForms.map((gf, idx) => (
                <span key={`gf-${idx}`} className="filter-tag">
                  Форма ГТ: {gf}
                  <button onClick={() => {
                    const newGtForms = [...advancedFilters.gtForms];
                    newGtForms.splice(idx, 1);
                    handleAdvancedFilterChange('gtForms', newGtForms);
                  }}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <PersonnelList
          selectedDivision={isGlobalView ? 'Все подразделения' : division?.name}
          selectedCategory="all"
          selectedAccessClass="all"
          searchTerm={searchTerm}
          division={isExploitationUser ? { id: userDivisionId, name: user?.division_info?.name } : division}
          personnel={displayedPersonnel}
          loading={loading}
          divisionId={id}
          subdivisionId={stableSubdivisionId}
          advancedFilters={advancedFilters}
        />
      </div>
    </>
  );
}