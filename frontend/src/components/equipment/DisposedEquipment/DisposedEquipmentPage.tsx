// components/equipment/DisposedEquipment/DisposedEquipmentPage.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../../../store/store';
import { Equipment } from '../../../types';
import { deleteEquipment, setEquipment, setError } from '../../../store/slices/equipmentSlice';
import { equipmentApi } from '../../../api';
import { DisposedEquipmentList } from './DisposedEquipmentList';
import { DisposedEquipmentAdvancedFilters, DisposalAdvancedFilters } from './DisposedEquipmentAdvancedFilters';
import DisposedEquipmentHeader from './DisposedEquipmentHeader';
import { Search, FileSpreadsheet, Filter, Box, KeyRound } from 'lucide-react';
import { CATEGORY_ICON_COMPONENTS } from '../categoryIcons';
import { format } from 'date-fns';
import { utils, writeFile } from 'xlsx';
import './styles/DisposedEquipmentPage.css';

const safeFormatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'dd.MM.yyyy');
  } catch {
    return '-';
  }
};

const initialFilters: DisposalAdvancedFilters = {
  names: [],
  serialNumbers: [],
  inventoryNumbers: [],
  manufacturingDateFrom: '',
  manufacturingDateTo: '',
  exploitationDateFrom: '',
  exploitationDateTo: '',
  assignedTo: [],
  interestOrgans: [],
  actNumber: '',
  actDateFrom: '',
  actDateTo: '',
  certNumber: '',
  certDateFrom: '',
  certDateTo: '',
};

interface DisposedNavigationState {
  from?: 'division-overview' | 'equipment-section' | 'global-equipment' | string;
  divisionId?: number | string;
  divisionName?: string;
  subdivisionId?: string;
  activeTab?: string;
}

export function DisposedEquipmentPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const navState = location.state as DisposedNavigationState | undefined;
  const divisionId = navState?.divisionId ?? null;
  const divisionName = navState?.divisionName ?? null;

  const token = localStorage.getItem('accessToken') || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DisposalAdvancedFilters>(initialFilters);
  const [loading, setLoadingState] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const equipment = useSelector((state: RootState) =>
    state.equipment.equipment.filter(
      (e) => e.status === 'disposed' && (!divisionId || e.division?.id === divisionId),
    ),
  );

  useEffect(() => {
    const fetchDisposedEquipment = async () => {
      try {
        setLoadingState(true);
        const params: { status: string; division?: string } = { status: 'disposed' };
        if (divisionId) {
          params.division = String(divisionId);
        }
        const data = await equipmentApi.getEquipment(token, params);
        dispatch(setEquipment(data));
      } catch (error) {
        console.error('Ошибка загрузки списанной техники:', error);
        dispatch(setError('Не удалось загрузить списанную технику'));
      } finally {
        setLoadingState(false);
      }
    };

    if (token) {
      fetchDisposedEquipment();
    }
  }, [token, dispatch, divisionId]);

  const availableCategories = useMemo(() => {
    const openCategories = new Set<string>();
    const closedCategories = new Set<string>();

    equipment.forEach((item) => {
      if (item.category) {
        if (item.category.is_closed) {
          closedCategories.add(item.category.value);
        } else {
          openCategories.add(item.category.value);
        }
      }
    });

    return {
      open: Array.from(openCategories).sort(),
      closed: Array.from(closedCategories).sort(),
    };
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    let categoryFiltered = equipment;
    if (activeCategoryTab === 'all') {
      // Вся техника
    } else if (activeCategoryTab === 'closed') {
      categoryFiltered = equipment.filter((item) => item.category?.is_closed === true);
    } else {
      categoryFiltered = equipment.filter((item) => item.category?.value === activeCategoryTab);
    }

    return categoryFiltered.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchLower) ||
        (item.serial_number?.toLowerCase().includes(searchLower) ?? false) ||
        (item.inventory_number?.toLowerCase().includes(searchLower) ?? false) ||
        (item.disposal_info?.actNumber?.toLowerCase().includes(searchLower) ?? false) ||
        (item.disposal_info?.disposalCertNumber?.toLowerCase().includes(searchLower) ?? false);

      if (!matchesSearch) return false;

      const matchesNames = filters.names.length === 0 || filters.names.includes(item.name);
      const matchesSerial =
        filters.serialNumbers.length === 0 || filters.serialNumbers.includes(item.serial_number);
      const matchesInventory =
        filters.inventoryNumbers.length === 0 || filters.inventoryNumbers.includes(item.inventory_number);

      let matchesManufacturing = true;
      if (filters.manufacturingDateFrom) {
        const dateFrom = new Date(filters.manufacturingDateFrom);
        const manufDate = item.manufacturing_date ? new Date(item.manufacturing_date) : null;
        if (manufDate && manufDate < dateFrom) matchesManufacturing = false;
      }
      if (filters.manufacturingDateTo) {
        const dateTo = new Date(filters.manufacturingDateTo);
        const manufDate = item.manufacturing_date ? new Date(item.manufacturing_date) : null;
        if (manufDate && manufDate > dateTo) matchesManufacturing = false;
      }

      let matchesExploitation = true;
      if (filters.exploitationDateFrom) {
        const dateFrom = new Date(filters.exploitationDateFrom);
        const explDate = item.exploitation_date ? new Date(item.exploitation_date) : null;
        if (explDate && explDate < dateFrom) matchesExploitation = false;
      }
      if (filters.exploitationDateTo) {
        const dateTo = new Date(filters.exploitationDateTo);
        const explDate = item.exploitation_date ? new Date(item.exploitation_date) : null;
        if (explDate && explDate > dateTo) matchesExploitation = false;
      }

      const matchesAssigned =
        filters.assignedTo.length === 0 ||
        (item.assigned_to?.full_name && filters.assignedTo.includes(item.assigned_to.full_name));

      const matchesInterest =
        filters.interestOrgans.length === 0 ||
        (item.interest_organ?.name &&
          filters.interestOrgans.some((o) => o.name === item.interest_organ?.name));

      const matchesActNumber =
        !filters.actNumber ||
        (item.disposal_info?.actNumber &&
          item.disposal_info.actNumber.includes(filters.actNumber));

      let matchesActDate = true;
      if (filters.actDateFrom) {
        const from = new Date(filters.actDateFrom);
        const actDate = item.disposal_info?.actDate
          ? new Date(item.disposal_info.actDate)
          : null;
        if (actDate && actDate < from) matchesActDate = false;
      }
      if (filters.actDateTo) {
        const to = new Date(filters.actDateTo);
        const actDate = item.disposal_info?.actDate
          ? new Date(item.disposal_info.actDate)
          : null;
        if (actDate && actDate > to) matchesActDate = false;
      }

      const matchesCertNumber =
        !filters.certNumber ||
        (item.disposal_info?.disposalCertNumber &&
          item.disposal_info.disposalCertNumber.includes(filters.certNumber));

      let matchesCertDate = true;
      if (filters.certDateFrom) {
        const from = new Date(filters.certDateFrom);
        const certDate = item.disposal_info?.disposalCertDate
          ? new Date(item.disposal_info.disposalCertDate)
          : null;
        if (certDate && certDate < from) matchesCertDate = false;
      }
      if (filters.certDateTo) {
        const to = new Date(filters.certDateTo);
        const certDate = item.disposal_info?.disposalCertDate
          ? new Date(item.disposal_info.disposalCertDate)
          : null;
        if (certDate && certDate > to) matchesCertDate = false;
      }

      return (
        matchesNames &&
        matchesSerial &&
        matchesInventory &&
        matchesManufacturing &&
        matchesExploitation &&
        matchesAssigned &&
        matchesInterest &&
        matchesActNumber &&
        matchesActDate &&
        matchesCertNumber &&
        matchesCertDate
      );
    });
  }, [equipment, searchTerm, filters, activeCategoryTab]);

  const handleRestore = async (id: string) => {
    try {
      await equipmentApi.restoreEquipment(token, id);
      dispatch(deleteEquipment(id));
      const params: { status: string; division?: string } = { status: 'disposed' };
      if (divisionId) {
        params.division = String(divisionId);
      }
      const data = await equipmentApi.getEquipment(token, params);
      dispatch(setEquipment(data));
    } catch (error) {
      console.error('Ошибка восстановления техники:', error);
    }
  };

  const updateIndicator = () => {
    if (!tabsRef.current || !indicatorRef.current) return;
    const activeTabElement = tabsRef.current.querySelector(
      '.dep-tab-button.active',
    ) as HTMLElement;
    if (!activeTabElement) return;
    const tabRect = activeTabElement.getBoundingClientRect();
    const containerRect = tabsRef.current.getBoundingClientRect();
    setIndicatorStyle({
      left: tabRect.left - containerRect.left,
      width: tabRect.width,
      opacity: 1,
    });
  };

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeCategoryTab]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => updateIndicator(), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleTabChange = (tab: string) => {
    setActiveCategoryTab(tab);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteEquipment(id));
  };

  const handleViewDetails = (equipment: Equipment) => {
    navigate(`/equipment/${equipment.id}`, {
      state: {
        from: 'equipment-disposed',
        fromState: navState,
      },
    });
  };

  const handleFilterChange = <K extends keyof DisposalAdvancedFilters>(
    filterType: K,
    values: DisposalAdvancedFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [filterType]: values }));
  };

  const handleBack = () => {
    const state = navState;

    if (state?.from === 'division-overview' && divisionId) {
      navigate(`/divisions/${divisionId}`);
      return;
    }

    if (state?.from === 'equipment-section') {
      let backUrl = state.divisionId
        ? `/divisions/${state.divisionId}/equipment`
        : `/equipment`;
      const params = new URLSearchParams();
      if (state.subdivisionId) params.append('subdivision', state.subdivisionId);
      const queryString = params.toString();
      if (queryString) backUrl += `?${queryString}`;
      navigate(backUrl, { state: { activeTab: state.activeTab || 'all' } });
      return;
    }

    if (state?.from === 'global-equipment') {
      navigate('/equipment', { state: { activeTab: state.activeTab || 'all' } });
      return;
    }

    if (divisionId) {
      navigate(`/divisions/${divisionId}`);
      return;
    }
    navigate(-1);
  };

  const handleExport = () => {
    const data = filteredEquipment.map((item) => ({
      'Название': item.name,
      'Тип': item.type,
      'Серийный номер': item.serial_number,
      'Инвентарный номер': item.inventory_number,
      'Подразделение': `${item.division?.name || ''}${
        item.subdivision?.name ? ` - ${item.subdivision.name}` : ''
      }`,
      '№ акта списания': item.disposal_info?.actNumber,
      'Дата акта': safeFormatDate(item.disposal_info?.actDate),
      '№ справки о ликвидации': item.disposal_info?.disposalCertNumber,
      'Дата справки': safeFormatDate(item.disposal_info?.disposalCertDate),
      'Комментарии': item.disposal_info?.comments || '',
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Списанная техника');
    const colWidths = Object.keys(data[0]).map((key) => ({
      wch: Math.max(20, key.length * 1.2),
    }));
    ws['!cols'] = colWidths;
    writeFile(wb, `disposed_equipment_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const toggleFilters = () => setShowFilters((prev) => !prev);

  if (loading) {
    return <div className="dep-loading">Загрузка списанной техники...</div>;
  }

  const hasClosedEquipment = equipment.some((item) => item.category?.is_closed === true);

  const pageTitle = divisionName ? `Списанная техника: ${divisionName}` : 'Списанная техника';

  return (
    <div className="dep-container page-fade-in">
      <DisposedEquipmentHeader onBack={handleBack} title={pageTitle}>
        <button onClick={handleExport} className="export-btn">
          <FileSpreadsheet size={18} />
          <span>Экспорт в Excel</span>
        </button>
      </DisposedEquipmentHeader>

      <div className="dep-card">
        <div className="dep-tabs-container">
          <div className="dep-tabs" ref={tabsRef}>
            <div className="dep-tab-indicator" ref={indicatorRef} style={indicatorStyle} />
            <button
              className={`dep-tab-button ${activeCategoryTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <Box size={16} className="dep-tab-icon" />
              Вся техника
            </button>
            {availableCategories.open.map((categoryValue) => {
              const category = equipment.find((item) => item.category?.value === categoryValue)
                ?.category;
              const Icon = CATEGORY_ICON_COMPONENTS[categoryValue] ?? Box;
              return (
                <button
                  key={categoryValue}
                  className={`dep-tab-button ${
                    activeCategoryTab === categoryValue ? 'active' : ''
                  }`}
                  onClick={() => handleTabChange(categoryValue)}
                >
                  <Icon size={16} className="dep-tab-icon" />
                  {category?.name || categoryValue}
                </button>
              );
            })}
            {hasClosedEquipment && (
              <button
                className={`dep-tab-button ${activeCategoryTab === 'closed' ? 'active' : ''}`}
                onClick={() => handleTabChange('closed')}
              >
                <KeyRound size={16} className="dep-tab-icon" />
                Закрытая техника
              </button>
            )}
          </div>
        </div>

        <div className="dep-search-wrapper">
          <div className="dep-search">
            <Search size={20} className="dep-search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по названию, номерам актов, серийному или инвентарному номеру..."
              className="dep-search-input"
            />
          </div>
          <button
            onClick={toggleFilters}
            className={`dep-filter-toggle ${showFilters ? 'active' : ''}`}
            title={showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          >
            <Filter size={20} />
          </button>
        </div>

        {showFilters && (
          <DisposedEquipmentAdvancedFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            equipment={equipment}
          />
        )}

        <div className="dep-results-info">
          <span>
            Найдено: <strong>{filteredEquipment.length}</strong>
          </span>
          {(searchTerm ||
            Object.values(filters).some(
              (v) =>
                (Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v !== ''),
            )) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters(initialFilters);
              }}
              className="dep-reset-filters"
            >
              Сбросить все
            </button>
          )}
        </div>

        <DisposedEquipmentList
          equipment={filteredEquipment}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  );
}