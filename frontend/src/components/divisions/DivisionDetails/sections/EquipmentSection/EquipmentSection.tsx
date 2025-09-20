import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Filter, Plus } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
}

export function EquipmentSection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');
  const token = localStorage.getItem('accessToken');

  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const [division, setDivision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState<'all' | 'closed' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [equipment, setEquipment] = useState([]);
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
    assignedTo: []
  });

  useEffect(() => {
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

    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [div, equip, cats] = await Promise.all([
          divisionsApi.getDivisionById(id, token),
          equipmentApi.getEquipment(token, { division: id }),
          equipmentApi.getEquipmentCategories(token)
        ]);

        if (subdivisionId) {
          const subdivision = div.subdivisions?.find(s => s.id.toString() === subdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        }

        setDivision(div);
        setEquipment(equip);
        setCategories(cats);
      } catch (err) {
        setError('Не удалось загрузить данные');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, subdivisionId]);

  const filterBySubdivision = (items) => {
    if (!subdivisionId) return items;
    return items.filter(item =>
      item.subdivision?.id?.toString() === subdivisionId.toString()
    );
  };

  const openEquipment = useMemo(() =>
    filterBySubdivision(equipment.filter(item => !item.is_closed)),
    [equipment, subdivisionId]
  );

  const closedEquipment = useMemo(() =>
    filterBySubdivision(equipment.filter(item => item.is_closed)),
    [equipment, subdivisionId]
  );

  const availableCategories = useMemo(() => {
    const openCategories = categories.filter(cat => !cat.is_closed);
    return openCategories.filter(cat =>
      openEquipment.some(item => item.category?.value === cat.value)
    );
  }, [categories, openEquipment]);

  const statusButtonsEquipment = useMemo(() => {
    if (activeTab === 'closed') {
      return closedEquipment;
    } else if (activeTab === 'all') {
      return [...openEquipment, ...closedEquipment];
    } else {
      return openEquipment.filter(item => item.category?.value === activeTab);
    }
  }, [activeTab, openEquipment, closedEquipment]);

  const filteredEquipment = useMemo(() => {
    return statusButtonsEquipment.filter(item => {
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      // Базовый поиск
      const matchesBasicSearch = searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assigned_to?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subdivision?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase());

      // Расширенный поиск
      const matchesAdvancedSearch =
        (advancedFilters.names.length === 0 || advancedFilters.names.some(name =>
          item.name.toLowerCase().includes(name.toLowerCase()))) &&
        (advancedFilters.serialNumbers.length === 0 || advancedFilters.serialNumbers.some(sn =>
          item.serial_number.toLowerCase().includes(sn.toLowerCase()))) &&
        (advancedFilters.inventoryNumbers.length === 0 || advancedFilters.inventoryNumbers.some(inv =>
          item.inventory_number?.toLowerCase().includes(inv.toLowerCase()))) &&
        (advancedFilters.assignedTo.length === 0 || advancedFilters.assignedTo.some(assigned =>
          item.assigned_to?.full_name?.toLowerCase().includes(assigned.toLowerCase()))) &&
        (!advancedFilters.manufacturingDateFrom || item.manufacturing_date >= advancedFilters.manufacturingDateFrom) &&
        (!advancedFilters.manufacturingDateTo || item.manufacturing_date <= advancedFilters.manufacturingDateTo) &&
        (!advancedFilters.exploitationDateFrom || item.exploitation_date >= advancedFilters.exploitationDateFrom) &&
        (!advancedFilters.exploitationDateTo || item.exploitation_date <= advancedFilters.exploitationDateTo);

      return matchesStatus && matchesBasicSearch && matchesAdvancedSearch;
    });
  }, [statusButtonsEquipment, selectedStatus, searchTerm, advancedFilters]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    setTimeout(() => {
      const activeTabElement = document.querySelector('.equipment-tab-button.active');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 10);
  };

  const handleAdvancedFilterChange = (filterType: keyof AdvancedSearchFilters, values: string[]) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
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
      assignedTo: []
    });
  };

  const hasActiveAdvancedFilters =
    advancedFilters.names.length > 0 ||
    advancedFilters.serialNumbers.length > 0 ||
    advancedFilters.inventoryNumbers.length > 0 ||
    advancedFilters.manufacturingDateFrom !== '' ||
    advancedFilters.manufacturingDateTo !== '' ||
    advancedFilters.exploitationDateFrom !== '' ||
    advancedFilters.exploitationDateTo !== '' ||
    advancedFilters.assignedTo.length > 0;

  const handleCreateEquipment = () => {
    navigate(`/divisions/${id}/equipment/create`, {
      state: {
        subdivisionId: subdivisionId,
        isClosed: activeTab === 'closed'
      }
    });
  };

  if (loading) {
    return <div className="flex justify-center py-12">Загрузка данных о технике...</div>;
  }

  if (error) {
    return <div className="equipment-error-message">{error}</div>;
  }

  return (
    <>
      <div className="equipment-header">
        <div className="equipment-title-container">
          <button onClick={() => navigate(`/divisions/${id}`)} className="back-button">
            <ArrowLeft className="back-button-icon" />
          </button>
          <h2 className="equipment-title">
            Техника связи и информатизации: {division?.name ? ` ${division?.name}` : ''} {subdivisionName ? ` / ${subdivisionName}` : ''}
          </h2>
        </div>

        <button
          onClick={handleCreateEquipment}
          className="add-equipment-btn"
        >
          <Plus size={16} />
          Добавить технику
        </button>
      </div>

      <div className="equipment-content-wrapper">
        <div className="equipment-tabs-container">
          <div
            className="equipment-tabs"
            ref={tabsRef}
          >
            <div
              className="equipment-tab-indicator"
              ref={indicatorRef}
              style={{
                ...indicatorStyle,
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />

            <button
              className={`equipment-tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <div className="equipment-tab-icon">
                <Box size={16} />
              </div>
              Вся техника
            </button>

            {availableCategories.map(category => (
              <button
                key={category.value}
                className={`equipment-tab-button ${activeTab === category.value ? 'active' : ''}`}
                onClick={() => handleTabChange(category.value)}
              >
                {CATEGORY_ICONS[category.value] || <Box className="equipment-tab-icon" size={16} />}
                {category.name}
              </button>
            ))}

            {closedEquipment.length > 0 && (
              <button
                className={`equipment-tab-button ${activeTab === 'closed' ? 'active' : ''}`}
                onClick={() => handleTabChange('closed')}
              >
                {CATEGORY_ICONS.closed}
                Закрытая техника
              </button>
            )}
          </div>
        </div>

        <div className="equipment-content">
          <div className="equipment-search-container">
            <div className="search-bar-with-filters">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Поиск по наименованию, серийному номеру, инвентарному номеру, за кем закреплено..."
              />
              <button
                className={`advanced-filter-button ${hasActiveAdvancedFilters ? 'active' : ''}`}
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <Filter size={18} />
                {hasActiveAdvancedFilters && <span className="filter-indicator"></span>}
              </button>
            </div>

            <AdvancedSearchModal
              isOpen={showAdvancedSearch}
              filters={advancedFilters}
              onFilterChange={handleAdvancedFilterChange}
              onClose={() => setShowAdvancedSearch(false)}
              onClearFilters={clearAdvancedFilters}
              equipment={equipment}
            />
          </div>

          {hasActiveAdvancedFilters && (
            <div className="active-filters">
              {advancedFilters.names.length > 0 && (
                <span className="filter-tag">
                  Названия: {advancedFilters.names.join(', ')}
                  <button onClick={() => handleAdvancedFilterChange('names', [])}>×</button>
                </span>
              )}
              {advancedFilters.serialNumbers.length > 0 && (
                <span className="filter-tag">
                  Серийные номера: {advancedFilters.serialNumbers.join(', ')}
                  <button onClick={() => handleAdvancedFilterChange('serialNumbers', [])}>×</button>
                </span>
              )}
              {advancedFilters.inventoryNumbers.length > 0 && (
                <span className="filter-tag">
                  Инвентарные номера: {advancedFilters.inventoryNumbers.join(', ')}
                  <button onClick={() => handleAdvancedFilterChange('inventoryNumbers', [])}>×</button>
                </span>
              )}
              {advancedFilters.assignedTo.length > 0 && (
                <span className="filter-tag">
                  Закреплено за: {advancedFilters.assignedTo.join(', ')}
                  <button onClick={() => handleAdvancedFilterChange('assignedTo', [])}>×</button>
                </span>
              )}
              {advancedFilters.manufacturingDateFrom && (
                <span className="filter-tag">
                  Дата производства от: {advancedFilters.manufacturingDateFrom}
                  <button onClick={() => handleAdvancedFilterChange('manufacturingDateFrom', '')}>×</button>
                </span>
              )}
              {advancedFilters.manufacturingDateTo && (
                <span className="filter-tag">
                  Дата производства до: {advancedFilters.manufacturingDateTo}
                  <button onClick={() => handleAdvancedFilterChange('manufacturingDateTo', '')}>×</button>
                </span>
              )}
              {advancedFilters.exploitationDateFrom && (
                <span className="filter-tag">
                  Дата ввода от: {advancedFilters.exploitationDateFrom}
                  <button onClick={() => handleAdvancedFilterChange('exploitationDateFrom', '')}>×</button>
                </span>
              )}
              {advancedFilters.exploitationDateTo && (
                <span className="filter-tag">
                  Дата ввода до: {advancedFilters.exploitationDateTo}
                  <button onClick={() => handleAdvancedFilterChange('exploitationDateTo', '')}>×</button>
                </span>
              )}
            </div>
          )}

          {statusButtonsEquipment.length > 0 && (
            <StatusButtons
              equipment={statusButtonsEquipment}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          )}

          <EquipmentList
            equipment={filteredEquipment}
            onUpdateEquipment={() => { }}
            onDeleteEquipment={() => { }}
          />
        </div>
      </div>
    </>
  );
}