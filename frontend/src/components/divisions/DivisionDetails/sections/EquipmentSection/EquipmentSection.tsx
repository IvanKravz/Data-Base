// EquipmentSection.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Filter, Plus, List, FolderTree, Package } from 'lucide-react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { EquipmentList } from '../../../../equipment/EquipmentList';
import { divisionsApi, equipmentApi } from '../../../../../api';
import { SearchBar } from '../../../../common/SearchBar';
import { StatusButtons } from '../../../../equipment';
import { AdvancedSearchModal } from '../../../../equipment/forms/AdvancedSearchModal/AdvancedSearchModal';
import './EquipmentSection.css';
import {
  Server,
  RadioTower,
  Monitor,
  BatteryCharging,
  Antenna,
  Zap,
  Box,
  KeyRound
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setEquipment, deleteEquipment } from '../../../../../store/slices/equipmentSlice';
import { ExportButton } from '../../../../common/ExportButton';
import { exportEquipmentToExcel } from '../../../../../utils/exportToExcel';

const CATEGORY_ICONS = {
  'tko': <Server className="equipment-tab-icon" size={16} />,
  'radio': <RadioTower className="equipment-tab-icon" size={16} />,
  'computer': <Monitor className="equipment-tab-icon" size={16} />,
  'battery': <BatteryCharging className="equipment-tab-icon" size={16} />,
  'antenna': <Antenna className="equipment-tab-icon" size={16} />,
  'power': <Zap className="equipment-tab-icon" size={16} />,
  'material': <Box className="equipment-tab-icon" size={16} />,
  'closed': <KeyRound className="equipment-tab-icon" size={16} />
};

interface AdvancedSearchFilters {
  names: string[];
  serialNumbers: string[];
  inventoryNumbers: string[];
  manufacturingDateFrom: string;
  manufacturingDateTo: string;
  exploitationDateFrom: string;
  exploitationDateTo: string;
  assignedTo: string[];
  interestOrgans: Array<{ id: string; name: string }>;
}

export function EquipmentSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');
  const token = localStorage.getItem('accessToken');
  const dispatch = useDispatch();
  const equipment = useSelector((state: RootState) => state.equipment.equipment);
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  // Режим отображения
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>(() => {
    const saved = localStorage.getItem('equipment_view_mode');
    return (saved === 'flat' || saved === 'grouped') ? saved : 'flat';
  });

  // Ключ для сохранения состояния свёрнутых блоков в sessionStorage
  const storageKey = useMemo(() => {
    const base = id ? `division_${id}` : 'global';
    const sub = subdivisionId ? `_sub_${subdivisionId}` : '';
    return `equipment_${base}${sub}`;
  }, [id, subdivisionId]);

  const getEquipmentDeclension = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'единиц техники';
    if (lastDigit === 1) return 'единица техники';
    if (lastDigit >= 2 && lastDigit <= 4) return 'единицы техники';
    return 'единиц техники';
  };

  const stableToken = useMemo(() => token, [token]);
  const stableSubdivisionId = useMemo(() => subdivisionId, [subdivisionId]);

  const isExploitationUser = useMemo(() =>
    user?.roles?.includes('exploitation_chief') || user?.roles?.includes('exploitation_employee'), [user]);
  const isChief = useMemo(() => user?.roles?.includes('exploitation_chief'), [user]);
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);
  const userDivisionId = useMemo(() => user?.division_info?.id ?? null, [user]);
  const userSubdivisionId = useMemo(() => {
    if (!user?.division_info || isChief) return null;
    return user.division_info.subdivision?.id ?? null;
  }, [user, isChief]);

  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const [division, setDivision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState<'all' | 'closed' | string>(location.state?.activeTab || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [subdivisionName, setSubdivisionName] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>({
    names: [],
    serialNumbers: [],
    inventoryNumbers: [],
    manufacturingDateFrom: '',
    manufacturingDateTo: '',
    exploitationDateFrom: '',
    exploitationDateTo: '',
    assignedTo: [],
    interestOrgans: []
  });

  const handleViewModeChange = (mode: 'flat' | 'grouped') => {
    setViewMode(mode);
    localStorage.setItem('equipment_view_mode', mode);
  };

  const canCreateEquipment = useMemo(() =>
    permissions?.models?.Equipment?.includes('add') ?? false, [permissions]);

  const updateIndicator = () => {
    if (!tabsRef.current || !indicatorRef.current) return;
    const activeTabElement = tabsRef.current.querySelector('.equipment-tab-button.active') as HTMLElement;
    if (!activeTabElement) return;
    const tabRect = activeTabElement.getBoundingClientRect();
    const containerRect = tabsRef.current.getBoundingClientRect();
    setIndicatorStyle({
      left: tabRect.left - containerRect.left,
      width: tabRect.width,
      opacity: 1
    });
  };

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => updateIndicator(), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const fetchData = useCallback(async () => {
    if (!stableToken) return;
    try {
      setLoading(true);
      setError(null);
      if (isExploitationUser && !id) {
        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }
        const params = isChief
          ? { division: userDivisionId }
          : { division: userDivisionId, subdivision: userSubdivisionId };
        const [div, equip, cats] = await Promise.all([
          divisionsApi.getDivisionById(userDivisionId, stableToken),
          equipmentApi.getEquipment(stableToken, params),
          equipmentApi.getEquipmentCategories(stableToken)
        ]);
        setDivision(div);
        dispatch(setEquipment(equip));
        setCategories(cats);
        if (userSubdivisionId) {
          const subdivision = div.subdivisions?.find(s => s.id.toString() === userSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }
      } else if (isGlobalView) {
        const [equip, cats] = await Promise.all([
          equipmentApi.getEquipment(stableToken, {}),
          equipmentApi.getEquipmentCategories(stableToken)
        ]);
        dispatch(setEquipment(equip));
        setCategories(cats);
      } else {
        const [div, equip, cats] = await Promise.all([
          divisionsApi.getDivisionById(id!, stableToken),
          equipmentApi.getEquipment(stableToken, { division: id }),
          equipmentApi.getEquipmentCategories(stableToken)
        ]);
        setDivision(div);
        dispatch(setEquipment(equip));
        setCategories(cats);
        if (stableSubdivisionId) {
          const subdivision = div.subdivisions?.find(s => s.id.toString() === stableSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }
      }
    } catch (err) {
      setError('Не удалось загрузить данные');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, stableToken, stableSubdivisionId, dispatch, isGlobalView, isExploitationUser, isChief, userDivisionId, userSubdivisionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterBySubdivision = useCallback((items: any[]) => {
    if (isExploitationUser && !id) return items;
    if (isGlobalView) return items;
    if (!stableSubdivisionId) return items;
    return items.filter(item => item.subdivision?.id?.toString() === stableSubdivisionId.toString());
  }, [isExploitationUser, id, isGlobalView, stableSubdivisionId]);

  const openEquipment = useMemo(() => filterBySubdivision(equipment.filter(item => !item.is_closed)), [equipment, filterBySubdivision]);
  const closedEquipment = useMemo(() => filterBySubdivision(equipment.filter(item => item.is_closed)), [equipment, filterBySubdivision]);

  const availableCategories = useMemo(() => {
    const openCategories = categories.filter(cat => !cat.is_closed);
    return openCategories.filter(cat => openEquipment.some(item => item.category?.value === cat.value));
  }, [categories, openEquipment]);

  const statusButtonsEquipment = useMemo(() => {
    if (activeTab === 'closed') return closedEquipment;
    if (activeTab === 'all') return [...openEquipment, ...closedEquipment];
    return openEquipment.filter(item => item.category?.value === activeTab);
  }, [activeTab, openEquipment, closedEquipment]);

  const filteredEquipment = useMemo(() => {
    return statusButtonsEquipment.filter(item => {
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesBasicSearch = searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assigned_to?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subdivision?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.interest_organ?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAdvancedSearch =
        (advancedFilters.names.length === 0 || advancedFilters.names.some(name => item.name.toLowerCase().includes(name.toLowerCase()))) &&
        (advancedFilters.serialNumbers.length === 0 || advancedFilters.serialNumbers.some(sn => item.serial_number.toLowerCase().includes(sn.toLowerCase()))) &&
        (advancedFilters.inventoryNumbers.length === 0 || advancedFilters.inventoryNumbers.some(inv => item.inventory_number?.toLowerCase().includes(inv.toLowerCase()))) &&
        (advancedFilters.assignedTo.length === 0 || advancedFilters.assignedTo.some(assigned => item.assigned_to?.full_name?.toLowerCase().includes(assigned.toLowerCase()))) &&
        (advancedFilters.interestOrgans.length === 0 || advancedFilters.interestOrgans.some(organ => item.interest_organ?.id === organ.id)) &&
        (!advancedFilters.manufacturingDateFrom || item.manufacturing_date >= advancedFilters.manufacturingDateFrom) &&
        (!advancedFilters.manufacturingDateTo || item.manufacturing_date <= advancedFilters.manufacturingDateTo) &&
        (!advancedFilters.exploitationDateFrom || item.exploitation_date >= advancedFilters.exploitationDateFrom) &&
        (!advancedFilters.exploitationDateTo || item.exploitation_date <= advancedFilters.exploitationDateTo);
      return matchesStatus && matchesBasicSearch && matchesAdvancedSearch;
    });
  }, [statusButtonsEquipment, selectedStatus, searchTerm, advancedFilters]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(location.pathname + location.search, {
      state: { ...location.state, activeTab: tab },
      replace: true
    });
    setTimeout(() => {
      const activeTabElement = document.querySelector('.equipment-tab-button.active');
      if (activeTabElement) activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 10);
  };

  const handleAdvancedFilterChange = (filterType: keyof AdvancedSearchFilters, values: any) => {
    setAdvancedFilters(prev => ({ ...prev, [filterType]: values }));
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      names: [],
      serialNumbers: [],
      inventoryNumbers: [],
      manufacturingDateFrom: '',
      manufacturingDateTo: '',
      exploitationDateFrom: '',
      exploitationDateTo: '',
      assignedTo: [],
      interestOrgans: []
    });
  };

  const hasActiveAdvancedFilters = useMemo(() =>
    advancedFilters.names.length > 0 ||
    advancedFilters.serialNumbers.length > 0 ||
    advancedFilters.inventoryNumbers.length > 0 ||
    advancedFilters.manufacturingDateFrom !== '' ||
    advancedFilters.manufacturingDateTo !== '' ||
    advancedFilters.exploitationDateFrom !== '' ||
    advancedFilters.exploitationDateTo !== '' ||
    advancedFilters.assignedTo.length > 0 ||
    advancedFilters.interestOrgans.length > 0,
    [advancedFilters]
  );

  const handleCreateEquipment = () => {
    if (isGlobalView) {
      navigate(`/equipment/create`, { state: { isClosed: activeTab === 'closed' } });
    } else {
      const isFromSubdivision = !!(location.state as any)?.fromSubdivision;
      navigate(`/divisions/${id}/equipment/create`, {
        state: {
          divisionId: id,
          subdivisionId: stableSubdivisionId,
          divisionName: division?.name,
          subdivisionName: subdivisionName,
          isClosed: activeTab === 'closed',
          fromSubdivision: isFromSubdivision
        }
      });
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      await equipmentApi.deleteEquipment(id);
      dispatch(deleteEquipment(id));
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

  const handleBack = () => {
    // Если перешли из списка подразделений (DivisionList) — возвращаемся на главную
    if (location.state?.fromDivisionList) {
      navigate('/');
      return;
    }
    // Иначе стандартная логика
    if (isGlobalView) navigate('/');
    else if (stableSubdivisionId) navigate(`/divisions/${id}?subdivision=${stableSubdivisionId}`);
    else navigate(`/divisions/${id}`);
  };

  const getHeaderTitle = () => {
    if (isExploitationUser && !id) {
      const divisionName = user?.division_info?.name || 'Ваше подразделение';
      return `Техника связи и информатизации: ${divisionName}`;
    }
    if (isGlobalView) return 'Техника связи и информатизации: Все подразделения';
    return `Техника связи и информатизации: ${division?.name || ''} ${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  };

  const getSelectedStatusLabel = (): string => {
    switch (selectedStatus) {
      case 'all': return 'Итого';
      case 'in-operation': return 'В эксплуатации';
      case 'in-storage': return 'На складе';
      case 'defective': return 'Неисправно';
      case 'for-disposal': return 'На списание';
      default: return 'Техники';
    }
  };

  if (loading) return <div className="flex justify-center py-12">Загрузка данных о технике...</div>;
  if (error) return <div className="equipment-error-message">{error}</div>;

  return (
    <>
      <div className="equipment-header">
        <div className="equipment-title-container">
          {id && (
            <button onClick={handleBack} className="back-button">
              <ArrowLeft className="back-button-icon" />
            </button>
          )}
          <h2 className="equipment-title">{getHeaderTitle()}</h2>
        </div>
        {canCreateEquipment && (
          <button onClick={handleCreateEquipment} className="add-equipment-btn">
            <Plus size={16} />
            Добавить технику
          </button>
        )}
      </div>

      <div className="equipment-content-wrapper">
        <div className="equipment-tabs-container">
          <div className="equipment-tabs" ref={tabsRef}>
            <div className="equipment-tab-indicator" ref={indicatorRef} style={indicatorStyle} />
            <button className={`equipment-tab-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => handleTabChange('all')}>
              <div className="equipment-tab-icon"><Box size={16} /></div>
              Вся техника
            </button>
            {availableCategories.map(category => (
              <button key={category.value} className={`equipment-tab-button ${activeTab === category.value ? 'active' : ''}`} onClick={() => handleTabChange(category.value)}>
                {CATEGORY_ICONS[category.value] || <Box className="equipment-tab-icon" size={16} />}
                {category.name}
              </button>
            ))}
            {closedEquipment.length > 0 && (
              <button className={`equipment-tab-button ${activeTab === 'closed' ? 'active' : ''}`} onClick={() => handleTabChange('closed')}>
                {CATEGORY_ICONS.closed}
                Закрытая техника
              </button>
            )}
          </div>
        </div>

        <div className="equipment-content">
          {hasActiveAdvancedFilters && (
            <div className="active-filters">
              {advancedFilters.interestOrgans.length > 0 && (
                <div className="filter-tags">
                  {advancedFilters.interestOrgans.map((organ, index) => (
                    <span key={organ.id} className="filter-tag">
                      В чьих интересах: {organ.name}
                      <button onClick={() => {
                        const newOrgans = [...advancedFilters.interestOrgans];
                        newOrgans.splice(index, 1);
                        handleAdvancedFilterChange('interestOrgans', newOrgans);
                      }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="equipment-actions-row1">
            <div className="equipment-status-buttons-wrapper">
              <StatusButtons
                equipment={statusButtonsEquipment}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
              />
            </div>
          </div>

          <div className="equipment-search-container">
            <div className="search-bar-with-filters">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Поиск по наименованию, серийному номеру, инвентарному номеру, за кем закреплено, в чьих интересах..." />
              <button className={`advanced-filter-button ${hasActiveAdvancedFilters ? 'active' : ''}`} onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}>
                <Filter size={18} />
                {hasActiveAdvancedFilters && <span className="filter-indicator"></span>}
              </button>
              <div className="export-button-wrapper">
                <ExportButton
                  onClick={() => exportEquipmentToExcel(filteredEquipment)}
                  label="Экспорт техники"
                />
              </div>
            </div>

            <AdvancedSearchModal isOpen={showAdvancedSearch} filters={advancedFilters} onFilterChange={handleAdvancedFilterChange} onClose={() => setShowAdvancedSearch(false)} onClearFilters={clearAdvancedFilters} equipment={equipment} />
          </div>

          {/* Блок счётчика с переключателем режимов */}
          <div className="equipment-count-chip">
            <div className="equipment-view-mode-toggle">
              <button className={`equipment-view-mode-btn ${viewMode === 'flat' ? 'active' : ''}`} onClick={() => handleViewModeChange('flat')}>
                <List size={16} /> Список
              </button>
              <button className={`equipment-view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`} onClick={() => handleViewModeChange('grouped')}>
                <FolderTree size={16} /> По подразделениям
              </button>
            </div>

            <div className="equipment-count-left">
              <Package size={16} className="count-chip-icon" />
              <span>{getSelectedStatusLabel()}:</span>
              <span>{filteredEquipment.length}</span>
              <span className="count-chip-label">{getEquipmentDeclension(filteredEquipment.length)}</span>
            </div>

            {/* Пустой элемент для симметрии и центрирования */}
            <div className="equipment-count-right"></div>
          </div>

          <EquipmentList
            equipment={filteredEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            divisionId={id}
            subdivisionId={stableSubdivisionId}
            activeTab={activeTab}
            viewMode={viewMode}
            searchTerm={searchTerm}
            storageKey={storageKey}
          />
        </div>
      </div>
    </>
  );
}