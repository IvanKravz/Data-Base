// PersonnelList.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { List, FolderTree, Users, UserCog, Shield, Briefcase, User, Package, Key, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Division, Employee } from '../../../types';
import { TableView } from './views/TableView';
import { ConfirmationModal } from '../../modals/ConfirmationModal';
import { ExportButton } from '../../common/ExportButton';
import { SearchBar } from '../../common/SearchBar';
import { exportPersonnelToExcel } from '../../../utils/exportToExcel';
import { deletePersonAsync } from '../../../store/slices/personnelSlice';
import { employeesApi, divisionsApi } from '../../../api';
import { setEmployee } from '../../../store/slices/personnelSlice';
import { PersonnelAdvancedSearchModal } from '../../personnel/forms/PersonnelAdvancedSearchModal/PersonnelAdvancedSearchModal';
import './style.css';

interface PersonnelListProps {
  selectedDivision?: string;
  selectedCategory?: 'all' | 'mol' | 'sha';
  selectedAccessClass?: 'all' | '1' | '2';
  division?: Division;
  personnel?: Employee[];
  loading?: boolean;
  divisionId?: string;
  subdivisionId?: string;
  onDeleteSuccess?: (deletedId: string) => void;
}

interface PersonnelAdvancedSearchFilters {
  ranks: string[];
  positions: string[];
  divisions: string[];
  subdivisions: string[];
  networkClasses: string[];
  gtForms: string[];
}

interface StaffCounts {
  all: number;
  management: number;
  officers: number;
  warrant_officers: number;
  civilian: number;
}

export function PersonnelList({
  selectedDivision = 'all',
  selectedCategory = 'all',
  division,
  personnel: externalPersonnel,
  loading = false,
  divisionId,
  subdivisionId,
  onDeleteSuccess,
}: PersonnelListProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [allPersonnel, setAllPersonnel] = useState<Employee[]>([]);
  const [allDivisions, setAllDivisions] = useState<Division[]>([]);
  const [globalStaffCounts, setGlobalStaffCounts] = useState<StaffCounts>({
    all: 0,
    management: 0,
    officers: 0,
    warrant_officers: 0,
    civilian: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha'>('all');
  const [showShaFilters, setShowShaFilters] = useState(false);
  const [showOfficerFilters, setShowOfficerFilters] = useState(false);
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<'all' | 'with_management' | 'without_management'>('all');
  const [selectedAccessClass, setSelectedAccessClass] = useState<'all' | '1' | '2'>('all');
  const [searchParams] = useSearchParams();
  const collapsedStorageKey = `personnel_collapsed_${division?.id || 'global'}_${subdivisionId || 'none'}`;

  // Состояния для поиска и расширенных фильтров
  const [searchTerm, setSearchTerm] = useState('');
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

  // Право на редактирование (change) — управляет колонкой «Действия» и кнопкой удаления
  const hasEditPermission = useMemo(() =>
    permissions?.models?.Employee?.includes('change') ?? false, [permissions]);

  // Право на просмотр (view) — управляет переходом на детальную страницу по клику
  const hasViewPermission = useMemo(() =>
    permissions?.models?.Employee?.includes('view') ?? false, [permissions]);

  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const isGlobalView = !division;

  // Склонение для слова "сотрудник"
  const getPersonnelDeclension = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'сотрудников';
    if (lastDigit === 1) return 'сотрудник';
    if (lastDigit >= 2 && lastDigit <= 4) return 'сотрудника';
    return 'сотрудников';
  };

  const getActiveFilterLabel = (): string => {
    switch (activeFilter) {
      case 'all': return 'Все сотрудники';
      case 'management': return 'Руководство';
      case 'officers': {
        if (selectedOfficerFilter === 'with_management') return 'Офицеры с руководством';
        if (selectedOfficerFilter === 'without_management') return 'Офицеры без руководства';
        return 'Офицеры';
      }
      case 'warrantOfficers': return 'Прапорщики';
      case 'civilian': return 'Гражданские';
      case 'mol': return 'МОЛ';
      case 'sha': {
        if (selectedAccessClass === '1') return 'ШАработники 1 класс';
        if (selectedAccessClass === '2') return 'ШАработники 2 класс';
        return 'ШАработники';
      }
      default: return 'Сотрудники';
    }
  };

  const getFilterIcon = (filterType: string) => {
    switch (filterType) {
      case 'all': return <Users size={16} />;
      case 'management': return <UserCog size={16} />;
      case 'officers': return <Shield size={16} />;
      case 'warrantOfficers': return <Briefcase size={16} />;
      case 'civilian': return <User size={16} />;
      case 'mol': return <Package size={16} />;
      case 'sha': return <Key size={16} />;
      default: return null;
    }
  };

  const handleViewModeChange = (mode: 'flat' | 'grouped') => {
    setViewMode(mode);
    localStorage.setItem('personnel_view_mode', mode);
  };

  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>(() => {
    const saved = localStorage.getItem('personnel_view_mode');
    return (saved === 'flat' || saved === 'grouped') ? saved : 'flat';
  });

  const sortEmployeesByPriority = (employees: Employee[]): Employee[] => {
    return [...employees].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.full_name.localeCompare(b.full_name);
    });
  };

  const basePersonnel = useMemo(() => {
    if (externalPersonnel) return sortEmployeesByPriority(externalPersonnel);
    return sortEmployeesByPriority(allPersonnel);
  }, [externalPersonnel, allPersonnel]);

  const calculateGlobalStaffCounts = (divisions: Division[]): StaffCounts => {
    return divisions.reduce((acc, d) => ({
      all: acc.all + (d.staff_planned_total || 0),
      management: acc.management + (d.staff_planned_management || 0),
      officers: acc.officers + (d.staff_planned_officers || 0),
      warrant_officers: acc.warrant_officers + (d.staff_planned_warrant_officers || 0),
      civilian: acc.civilian + (d.staff_planned_civilian || 0)
    }), { all: 0, management: 0, officers: 0, warrant_officers: 0, civilian: 0 });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInternalLoading(true);
        if (!division && !externalPersonnel) {
          const [personnelData, divisionsData] = await Promise.all([
            employeesApi.getPersonnel(token, {}),
            divisionsApi.getDivisions(token)
          ]);
          const sortedData = sortEmployeesByPriority(personnelData);
          setAllPersonnel(sortedData);
          setAllDivisions(divisionsData);
          dispatch(setEmployee(sortedData));
          setGlobalStaffCounts(calculateGlobalStaffCounts(divisionsData));
        } else if (!division && externalPersonnel) {
          const divisionsData = await divisionsApi.getDivisions(token);
          setAllDivisions(divisionsData);
          setGlobalStaffCounts(calculateGlobalStaffCounts(divisionsData));
        } else {
          setInternalLoading(false);
        }
      } catch (err) {
        setError('Не удалось загрузить данные');
        console.error(err);
      } finally {
        setInternalLoading(false);
      }
    };
    fetchData();
  }, [division, token, externalPersonnel, dispatch]);

  // Фильтрация по категориям и дополнительным фильтрам (офицеры/ША)
  const categoryFilteredPersonnel = useMemo(() => {
    const filtered = basePersonnel.filter(person => {
      let matchesCategory = true;
      switch (activeFilter) {
        case 'management': matchesCategory = person.category === 'management'; break;
        case 'officers':
          if (selectedOfficerFilter === 'with_management') matchesCategory = person.category === 'officer' || person.category === 'management';
          else if (selectedOfficerFilter === 'without_management') matchesCategory = person.category === 'officer';
          else matchesCategory = person.category === 'officer' || person.category === 'management';
          break;
        case 'warrantOfficers': matchesCategory = person.category === 'warrant_officer'; break;
        case 'civilian': matchesCategory = person.category === 'civilian'; break;
        case 'mol': matchesCategory = person.is_material_responsible; break;
        case 'sha':
          matchesCategory = person.is_sha_worker;
          if (matchesCategory && selectedAccessClass !== 'all') matchesCategory = person.sha_details?.access_level === selectedAccessClass;
          break;
        default: break;
      }
      return matchesCategory;
    });
    return sortEmployeesByPriority(filtered);
  }, [basePersonnel, activeFilter, selectedOfficerFilter, selectedAccessClass]);

  // Фильтрация по поисковому запросу и расширенным фильтрам
  const filteredPersonnel = useMemo(() => {
    let filtered = categoryFilteredPersonnel;

    // Поиск по тексту
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(person =>
        person.full_name.toLowerCase().includes(searchLower) ||
        (person.position && person.position.toLowerCase().includes(searchLower)) ||
        (person.division?.name && person.division.name.toLowerCase().includes(searchLower)) ||
        (person.subdivision?.name && person.subdivision.name.toLowerCase().includes(searchLower)) ||
        (person.rank && person.rank.toLowerCase().includes(searchLower)) ||
        (person.personal_phone && person.personal_phone.includes(searchLower)) ||
        (person.work_phone && person.work_phone.includes(searchLower))
      );
    }

    // Расширенные фильтры
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
  }, [categoryFilteredPersonnel, searchTerm, advancedFilters]);

  const getStaffCount = (staffType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha') => {
    if (isGlobalView) {
      const counts = {
        all: { staffCount: globalStaffCounts.all, actualCount: basePersonnel.length },
        management: { staffCount: globalStaffCounts.management, actualCount: basePersonnel.filter(p => p.category === 'management').length },
        officers: { staffCount: globalStaffCounts.officers, actualCount: basePersonnel.filter(p => p.category === 'officer' || p.category === 'management').length },
        warrantOfficers: { staffCount: globalStaffCounts.warrant_officers, actualCount: basePersonnel.filter(p => p.category === 'warrant_officer').length },
        civilian: { staffCount: globalStaffCounts.civilian, actualCount: basePersonnel.filter(p => p.category === 'civilian').length },
        mol: { staffCount: 0, actualCount: basePersonnel.filter(p => p.is_material_responsible).length },
        sha: { staffCount: 0, actualCount: basePersonnel.filter(p => p.is_sha_worker).length }
      };
      return counts[staffType];
    }
    if (!division) return { staffCount: 0, actualCount: 0 };
    const filtered = subdivisionId ? basePersonnel.filter(p => p.subdivision?.id == subdivisionId) : basePersonnel;
    const selectedSub = subdivisionId && division.subdivisions ? division.subdivisions.find(s => s.id == subdivisionId) : null;
    const counts = {
      all: { staffCount: selectedSub?.staff_planned_total || division.staff_planned_total || 0, actualCount: filtered.length },
      management: { staffCount: selectedSub?.staff_planned_management || division.staff_planned_management || 0, actualCount: filtered.filter(p => p.category === 'management').length },
      officers: { staffCount: selectedSub?.staff_planned_officers || division.staff_planned_officers || 0, actualCount: filtered.filter(p => p.category === 'officer' || p.category === 'management').length },
      warrantOfficers: { staffCount: selectedSub?.staff_planned_warrant_officers || division.staff_planned_warrant_officers || 0, actualCount: filtered.filter(p => p.category === 'warrant_officer').length },
      civilian: { staffCount: selectedSub?.staff_planned_civilian || division.staff_planned_civilian || 0, actualCount: filtered.filter(p => p.category === 'civilian').length },
      mol: { staffCount: 0, actualCount: filtered.filter(p => p.is_material_responsible).length },
      sha: { staffCount: 0, actualCount: filtered.filter(p => p.is_sha_worker).length }
    };
    return counts[staffType];
  };

  const renderMainFilter = (
    filterType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha',
    label: string
  ) => {
    const { staffCount, actualCount } = getStaffCount(filterType);
    return (
      <button
        className={`personnel-list-filter-button ${activeFilter === filterType ? 'active' : ''}`}
        onClick={() => {
          setActiveFilter(filterType);
          if (filterType === 'sha') { setShowShaFilters(true); setShowOfficerFilters(false); }
          else if (filterType === 'officers') { setShowOfficerFilters(true); setShowShaFilters(false); }
          else { setShowShaFilters(false); setShowOfficerFilters(false); }
        }}
      >
        <div className="personnel-list-filter-content">
          <div className="personnel-list-filter-label">
            {getFilterIcon(filterType)}
            <span>{label}</span>
          </div>
          <div className="personnel-list-filter-stats">
            {filterType === 'mol' || filterType === 'sha' ? actualCount : `${staffCount} / ${actualCount}`}
          </div>
        </div>
      </button>
    );
  };

  const handleDelete = (id: string) => {
    setPersonToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (personToDelete && token) {
      dispatch(deletePersonAsync({ token, id: personToDelete }))
        .unwrap()
        .then(() => {
          // обновляем локальное состояние
          setAllPersonnel(prev => sortEmployeesByPriority(prev.filter(p => p.id !== personToDelete)));
          // если передан колбэк – вызываем его, чтобы родитель обновил свои данные
          if (onDeleteSuccess) {
            onDeleteSuccess(personToDelete);
          }
          setShowDeleteModal(false);
          setPersonToDelete(null);
        })
        .catch(err => { setError('Не удалось удалить сотрудника'); console.error(err); });
    }
  };

  const handlePersonClick = (person: Employee) => {
    navigate(`/personnel/${person.id}`, {
      state: { from: location.pathname + location.search, divisionId, subdivisionId, activeFilter, searchTerm }
    });
  };

  const handleShaFilterClick = (accessClass: 'all' | '1' | '2') => {
    setSelectedAccessClass(accessClass);
    setActiveFilter('sha');
  };

  const handleOfficerFilterClick = (filter: 'all' | 'with_management' | 'without_management') => {
    setSelectedOfficerFilter(filter);
    setActiveFilter('officers');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setAdvancedFilters({
      ranks: [],
      positions: [],
      divisions: [],
      subdivisions: [],
      networkClasses: [],
      gtForms: []
    });
  };

  const handleAdvancedFilterChange = (filterType: keyof PersonnelAdvancedSearchFilters, values: any) => {
    setAdvancedFilters(prev => ({ ...prev, [filterType]: values }));
  };

  const hasActiveAdvancedFilters = useMemo(() =>
    Object.values(advancedFilters).some(filters => filters.length > 0),
    [advancedFilters]
  );

  const staffData = getStaffCount(activeFilter);
  const isFiltersVisible = showOfficerFilters || showShaFilters;
  // Фиксированная максимальная высота, достаточная для двух групп фильтров (горизонтальное расположение)
  const maxFilterHeight = isFiltersVisible ? '160px' : '0';

  if (internalLoading) return <div className="personnel-list-loading">Загрузка сотрудников...</div>;
  if (error) return <div className="personnel-list-error">{error}</div>;

  return (
    <div className="personnel-list-wrapper">
      <div className="personnel-list-header">
        {/* Первая строка: основные фильтры */}
        <div className="personnel-list-actions-row1">
          <div className="personnel-list-main-filters">
            {renderMainFilter('all', 'Все сотрудники')}
            {renderMainFilter('management', 'Руководство')}
            {renderMainFilter('officers', 'Офицеры')}
            {renderMainFilter('warrantOfficers', 'Прапорщики')}
            {renderMainFilter('civilian', 'Гражданские')}
            {renderMainFilter('mol', 'МОЛ')}
            {renderMainFilter('sha', 'ШАработники')}
          </div>
        </div>

        {/* Дополнительные фильтры (офицеры / ША) с плавной анимацией высоты */}
        <div
          className="personnel-list-additional-filters"
          style={{
            maxHeight: maxFilterHeight,
            opacity: isFiltersVisible ? 1 : 0,
            transform: isFiltersVisible ? 'translateY(0)' : 'translateY(-10px)',
            padding: isFiltersVisible ? '0.5rem 1rem' : '0 1rem',
            marginBottom: isFiltersVisible ? '1rem' : '0',
          }}
        >
          {showOfficerFilters && (
            <div className="personnel-list-filter-group">
              <div className="personnel-list-filter-group-label">Тип отображения офицеров:</div>
              <div className="personnel-list-officer-filters">
                <button className={`personnel-list-officer-filter-btn ${selectedOfficerFilter === 'with_management' ? 'active' : ''}`} onClick={() => handleOfficerFilterClick('with_management')}>
                  С руководством
                </button>
                <button className={`personnel-list-officer-filter-btn ${selectedOfficerFilter === 'without_management' ? 'active' : ''}`} onClick={() => handleOfficerFilterClick('without_management')}>
                  Без руководства
                </button>
              </div>
            </div>
          )}
          {showShaFilters && (
            <div className="personnel-list-filter-group">
              <div className="personnel-list-filter-group-label">Класс доступа ША:</div>
              <div className="personnel-list-sha-filters">
                <button className={`personnel-list-sha-filter-btn ${selectedAccessClass === 'all' ? 'active' : ''}`} onClick={() => handleShaFilterClick('all')}>
                  Все ШАработники
                </button>
                <button className={`personnel-list-sha-filter-btn ${selectedAccessClass === '1' ? 'active' : ''}`} onClick={() => handleShaFilterClick('1')}>
                  1 класс доступа
                </button>
                <button className={`personnel-list-sha-filter-btn ${selectedAccessClass === '2' ? 'active' : ''}`} onClick={() => handleShaFilterClick('2')}>
                  2 класс доступа
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Поиск и расширенные фильтры */}
        <div className="personnel-list-search-container">
          <div className="personnel-list-search-bar-wrapper">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Поиск по ФИО, званию, должности, подразделению, отделению, телефону..." />
            <button className={`personnel-list-advanced-filter-btn ${showAdvancedSearch ? 'active' : ''}`} onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}>
              <Filter size={18} />
              {hasActiveAdvancedFilters && <span className="personnel-list-filter-indicator"></span>}
            </button>
            <div className="export-button-wrapper">
              <ExportButton onClick={() => exportPersonnelToExcel(filteredPersonnel)} label="Экспорт сотрудников" />
            </div>
          </div>

          {showAdvancedSearch && (
            <PersonnelAdvancedSearchModal
              isOpen={showAdvancedSearch}
              filters={advancedFilters}
              onFilterChange={handleAdvancedFilterChange}
              onClose={() => setShowAdvancedSearch(false)}
              onClearFilters={handleClearFilters}
              personnel={basePersonnel}
            />
          )}
        </div>

        {/* Активные теги расширенных фильтров */}
        {hasActiveAdvancedFilters && (
          <div className="personnel-list-active-filters">
            <div className="personnel-list-active-filters-tags">
              {advancedFilters.ranks.map((rank, idx) => (
                <span key={`rank-${idx}`} className="personnel-list-filter-tag">
                  Звание: {rank}
                  <button onClick={() => {
                    const newRanks = [...advancedFilters.ranks];
                    newRanks.splice(idx, 1);
                    handleAdvancedFilterChange('ranks', newRanks);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.positions.map((pos, idx) => (
                <span key={`pos-${idx}`} className="personnel-list-filter-tag">
                  Должность: {pos}
                  <button onClick={() => {
                    const newPositions = [...advancedFilters.positions];
                    newPositions.splice(idx, 1);
                    handleAdvancedFilterChange('positions', newPositions);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.divisions.map((div, idx) => (
                <span key={`div-${idx}`} className="personnel-list-filter-tag">
                  Подразделение: {div}
                  <button onClick={() => {
                    const newDivisions = [...advancedFilters.divisions];
                    newDivisions.splice(idx, 1);
                    handleAdvancedFilterChange('divisions', newDivisions);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.subdivisions.map((sub, idx) => (
                <span key={`sub-${idx}`} className="personnel-list-filter-tag">
                  Отделение: {sub}
                  <button onClick={() => {
                    const newSubdivisions = [...advancedFilters.subdivisions];
                    newSubdivisions.splice(idx, 1);
                    handleAdvancedFilterChange('subdivisions', newSubdivisions);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.networkClasses.map((nc, idx) => (
                <span key={`nc-${idx}`} className="personnel-list-filter-tag">
                  Класс сети: {nc}
                  <button onClick={() => {
                    const newNetworkClasses = [...advancedFilters.networkClasses];
                    newNetworkClasses.splice(idx, 1);
                    handleAdvancedFilterChange('networkClasses', newNetworkClasses);
                  }}>×</button>
                </span>
              ))}
              {advancedFilters.gtForms.map((gf, idx) => (
                <span key={`gf-${idx}`} className="personnel-list-filter-tag">
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

        {/* Блок счётчика с переключателем режимов в виде вкладок */}
        <div className="personnel-list-count-chip">
          <div className="personnel-list-view-mode-toggle">
            <button className={`personnel-list-view-mode-btn ${viewMode === 'flat' ? 'active' : ''}`} onClick={() => handleViewModeChange('flat')}>
              <List size={16} /> Список
            </button>
            <button className={`personnel-list-view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`} onClick={() => handleViewModeChange('grouped')}>
              <FolderTree size={16} /> По подразделениям
            </button>
          </div>

          <div className="personnel-list-count-left">
            <Users size={16} className="personnel-list-count-icon" />
            <span>{getActiveFilterLabel()}:</span>
            <span>{filteredPersonnel.length}</span>
            <span className="personnel-list-count-label">{getPersonnelDeclension(filteredPersonnel.length)}</span>
          </div>

          <div className="personnel-list-count-right">
            {activeFilter !== 'mol' && activeFilter !== 'sha' && (
              <span>По штату: {staffData.staffCount}</span>
            )}
            <span>По списку: {staffData.actualCount}</span>
          </div>
        </div>

        <TableView
          divisionName={selectedDivision}
          personnel={filteredPersonnel}
          onPersonClick={handlePersonClick}
          onDelete={handleDelete}
          hasEditPermission={hasEditPermission}
          hasViewPermission={hasViewPermission}
          viewMode={viewMode}
          storageKey={collapsedStorageKey}
          searchTerm={searchTerm}
        />

        {filteredPersonnel.length === 0 && (
          <div className="personnel-list-empty-message">
            {activeFilter !== 'all' ? `Нет сотрудников в категории` : 'Нет сотрудников для отображения'}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <ConfirmationModal
          type="delete"
          title="Удаление сотрудника"
          message="Вы уверены, что хотите удалить этого сотрудника? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => { setShowDeleteModal(false); setPersonToDelete(null); }}
        />
      )}
    </div>
  );
}