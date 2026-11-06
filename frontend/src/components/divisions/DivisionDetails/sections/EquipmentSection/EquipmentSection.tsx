// EquipmentSection.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Filter, Plus, List, FolderTree, Package, Box, KeyRound, Database } from 'lucide-react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { EquipmentList } from '../../../../equipment/EquipmentList';
import { divisionsApi, equipmentApi } from '../../../../../api';
import { SearchBar } from '../../../../common/SearchBar';
import { StatusButtons } from '../../../../equipment';
import {
  AdvancedSearchModal,
  AdvancedSearchFilters,
} from '../../../../equipment/forms/AdvancedSearchModal/AdvancedSearchModal';
import { CATEGORY_ICON_COMPONENTS } from '../../../../equipment/categoryIcons';
import './EquipmentSection.css';
import { useDispatch } from 'react-redux';
import { setEquipment, deleteEquipment } from '../../../../../store/slices/equipmentSlice';
import { ExportButton } from '../../../../common/ExportButton';
import { exportEquipmentToExcel } from '../../../../../utils/exportToExcel';

// ============================================================
// Единый "пустой" объект фильтров (все 20 полей)
// ============================================================
const EMPTY_ADVANCED_FILTERS: AdvancedSearchFilters = {
  // Идентификация
  names: [],
  serialNumbers: [],
  inventoryNumbers: [],
  // Классификация
  categories: [],
  deviceTypes: [],
  statuses: [],
  secretLevels: [],
  // Принадлежность
  divisions: [],
  subdivisions: [],
  facilities: [],
  assignedTo: [],
  interestOrgans: [],
  // Флаги
  isNetwork: false,
  isClosed: false,
  isFreeUse: false,
  // Даты
  manufacturingDateFrom: '',
  manufacturingDateTo: '',
  exploitationDateFrom: '',
  exploitationDateTo: '',
};

// ============================================================
// Человекочитаемые лейблы для тегов
// ============================================================
const DEVICE_TYPE_LABELS: Record<string, string> = {
  switch: 'Коммутатор',
  router: 'Маршрутизатор',
  firewall: 'МСЭ / Firewall',
  server: 'Сервер',
  workstation: 'АРМ / ПК',
  'patch-panel': 'Патч-панель',
  'media-converter': 'Медиаконвертер',
  pbx: 'УАТС / АТС',
  modem: 'Модем',
  szi: 'СЗИ',
  other: 'Другое',
};

const STATUS_LABELS: Record<string, string> = {
  'in-operation': 'Эксплуатируется',
  'in-storage': 'На складе',
  defective: 'Неисправно',
  'for-disposal': 'На списание',
  disposed: 'Списано',
};

const SECRET_LABELS: Record<string, string> = {
  OV: 'ОВ',
  SS: 'СС',
  SECRET: 'Секретно',
  DSP: 'ДСП',
};

// Утилита: «есть ли хоть один активный фильтр»
function hasAnyActiveFilter(f: AdvancedSearchFilters): boolean {
  return (
    f.names.length > 0 ||
    f.serialNumbers.length > 0 ||
    f.inventoryNumbers.length > 0 ||
    f.categories.length > 0 ||
    f.deviceTypes.length > 0 ||
    f.statuses.length > 0 ||
    f.secretLevels.length > 0 ||
    f.divisions.length > 0 ||
    f.subdivisions.length > 0 ||
    f.facilities.length > 0 ||
    f.assignedTo.length > 0 ||
    f.interestOrgans.length > 0 ||
    f.isNetwork ||
    f.isClosed ||
    f.isFreeUse ||
    f.manufacturingDateFrom !== '' ||
    f.manufacturingDateTo !== '' ||
    f.exploitationDateFrom !== '' ||
    f.exploitationDateTo !== ''
  );
}

// ============================================================
// Метаданные вкладок
// ============================================================
interface EquipmentTab {
  id: string;
  name: string;
  count: number;
  order: number;
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

  // Активные вкладки (grouped)
  const [activeDivisionTab, setActiveDivisionTab] = useState<string>('all');
  const [activeSubdivisionTab, setActiveSubdivisionTab] = useState<string>('all');

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

  const isExploitationUser = useMemo(
    () =>
      user?.roles?.includes('exploitation_chief') ||
      user?.roles?.includes('exploitation_employee'),
    [user],
  );
  const isChief = useMemo(() => user?.roles?.includes('exploitation_chief'), [user]);
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);
  const userDivisionId = useMemo(() => user?.division_info?.id ?? null, [user]);
  const userSubdivisionId = useMemo(() => {
    if (!user?.division_info || isChief) return null;
    return (user.division_info as any).subdivision?.id ?? null;
  }, [user, isChief]);

  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const divisionTabsRef = useRef<HTMLDivElement>(null);
  const subdivisionTabsRef = useRef<HTMLDivElement>(null);
  const [divisionIndicatorStyle, setDivisionIndicatorStyle] = useState({ left: 0, width: 0, top: 0 });
  const [subdivisionIndicatorStyle, setSubdivisionIndicatorStyle] = useState({ left: 0, width: 0, top: 0 });

  const [division, setDivision] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'closed' | string>(location.state?.activeTab || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [subdivisionName, setSubdivisionName] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>(EMPTY_ADVANCED_FILTERS);

  const handleViewModeChange = (mode: 'flat' | 'grouped') => {
    setViewMode(mode);
    localStorage.setItem('equipment_view_mode', mode);
  };

  const canCreateEquipment = useMemo(
    () => permissions?.models?.Equipment?.includes('add') ?? false,
    [permissions],
  );

  const updateIndicator = () => {
    if (!tabsRef.current || !indicatorRef.current) return;
    const activeTabElement = tabsRef.current.querySelector('.equipment-tab-button.active') as HTMLElement;
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
          equipmentApi.getEquipmentCategories(stableToken),
        ]);
        setDivision(div);
        dispatch(setEquipment(equip));
        setCategories(cats);
        if (userSubdivisionId) {
          const subdivision = div.subdivisions?.find(
            (s: any) => s.id.toString() === userSubdivisionId.toString(),
          );
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }
      } else if (isGlobalView) {
        const [equip, cats] = await Promise.all([
          equipmentApi.getEquipment(stableToken, {}),
          equipmentApi.getEquipmentCategories(stableToken),
        ]);
        dispatch(setEquipment(equip));
        setCategories(cats);
      } else {
        const [div, equip, cats] = await Promise.all([
          divisionsApi.getDivisionById(id!, stableToken),
          equipmentApi.getEquipment(stableToken, { division: id }),
          equipmentApi.getEquipmentCategories(stableToken),
        ]);
        setDivision(div);
        dispatch(setEquipment(equip));
        setCategories(cats);
        if (stableSubdivisionId) {
          const subdivision = div.subdivisions?.find(
            (s: any) => s.id.toString() === stableSubdivisionId.toString(),
          );
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
  }, [
    id,
    stableToken,
    stableSubdivisionId,
    dispatch,
    isGlobalView,
    isExploitationUser,
    isChief,
    userDivisionId,
    userSubdivisionId,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterBySubdivision = useCallback(
    (items: any[]) => {
      if (isExploitationUser && !id) return items;
      if (isGlobalView) return items;
      if (!stableSubdivisionId) return items;
      return items.filter(
        (item) => item.subdivision?.id?.toString() === stableSubdivisionId.toString(),
      );
    },
    [isExploitationUser, id, isGlobalView, stableSubdivisionId],
  );

  const openEquipment = useMemo(
    () => filterBySubdivision((equipment as any[]).filter((item: any) => !item.is_closed)),
    [equipment, filterBySubdivision],
  );
  const closedEquipment = useMemo(
    () => filterBySubdivision((equipment as any[]).filter((item: any) => item.is_closed)),
    [equipment, filterBySubdivision],
  );

  const availableCategories = useMemo(() => {
    const openCategories = categories.filter((cat: any) => !cat.is_closed);
    return openCategories.filter((cat: any) =>
      openEquipment.some((item: any) => item.category?.value === cat.value),
    );
  }, [categories, openEquipment]);

  // ===== 1. Набор по активной категории =====
  const statusButtonsEquipment = useMemo(() => {
    if (activeTab === 'closed') return closedEquipment;
    if (activeTab === 'all') return [...openEquipment, ...closedEquipment];
    return openEquipment.filter((item: any) => item.category?.value === activeTab);
  }, [activeTab, openEquipment, closedEquipment]);

  // ===== 2. Поиск + все advanced-фильтры =====
  const searchAndAdvancedFiltered = useMemo(() => {
    return statusButtonsEquipment.filter((item: any) => {
      if (item.status === 'disposed') return false;

      const lowerSearch = searchTerm.toLowerCase();

      // Базовый поиск — null-safe
      const matchesBasicSearch =
        searchTerm === '' ||
        (item.name?.toLowerCase() || '').includes(lowerSearch) ||
        (item.serial_number?.toLowerCase() || '').includes(lowerSearch) ||
        (item.assigned_to?.full_name?.toLowerCase() || '').includes(lowerSearch) ||
        (item.subdivision?.name?.toLowerCase() || '').includes(lowerSearch) ||
        (item.inventory_number?.toLowerCase() || '').includes(lowerSearch) ||
        (item.interest_organ?.name?.toLowerCase() || '').includes(lowerSearch);

      if (!matchesBasicSearch) return false;

      const af = advancedFilters;

      // Идентификация
      if (af.names.length && !af.names.some((n) => (item.name?.toLowerCase() || '').includes(n.toLowerCase()))) return false;
      if (af.serialNumbers.length && !af.serialNumbers.some((sn) => (item.serial_number?.toLowerCase() || '').includes(sn.toLowerCase()))) return false;
      if (af.inventoryNumbers.length && !af.inventoryNumbers.some((inv) => (item.inventory_number?.toLowerCase() || '').includes(inv.toLowerCase()))) return false;

      // Классификация
      if (af.categories.length && !af.categories.includes(item.category?.value ?? '')) return false;
      if (af.deviceTypes.length && !af.deviceTypes.includes(item.device_type ?? '')) return false;
      if (af.statuses.length && !af.statuses.includes(item.status ?? '')) return false;
      if (af.secretLevels.length && !af.secretLevels.includes(item.secret_level ?? '')) return false;

      // Принадлежность
      if (af.divisions.length && !af.divisions.includes(item.division?.name ?? '')) return false;
      if (af.subdivisions.length && !af.subdivisions.includes(item.subdivision?.name ?? '')) return false;
      if (af.facilities.length && !af.facilities.includes(item.facility?.name ?? '')) return false;
      if (af.assignedTo.length && !af.assignedTo.some((a) => (item.assigned_to?.full_name?.toLowerCase() || '').includes(a.toLowerCase()))) return false;
      if (af.interestOrgans.length && !af.interestOrgans.some((organ) => item.interest_organ?.id === organ.id)) return false;

      // Флаги
      if (af.isNetwork && !item.is_network) return false;
      if (af.isClosed && !item.is_closed) return false;
      if (af.isFreeUse && !item.is_free_use) return false;

      // Даты
      if (af.manufacturingDateFrom && item.manufacturing_date < af.manufacturingDateFrom) return false;
      if (af.manufacturingDateTo && item.manufacturing_date > af.manufacturingDateTo) return false;
      if (af.exploitationDateFrom && item.exploitation_date < af.exploitationDateFrom) return false;
      if (af.exploitationDateTo && item.exploitation_date > af.exploitationDateTo) return false;

      return true;
    });
  }, [statusButtonsEquipment, searchTerm, advancedFilters]);

  // ===== 3. Вкладки (без статуса) =====
  const tabsFilteredBase = useMemo(() => {
    if (viewMode !== 'grouped') return searchAndAdvancedFiltered;

    let result = searchAndAdvancedFiltered;

    if (isGlobalView && !stableSubdivisionId && activeDivisionTab !== 'all') {
      result = result.filter((e: any) => String(e.division?.id) === activeDivisionTab);
    }

    if (activeSubdivisionTab === 'no-subdivision') {
      result = result.filter((e: any) => !e.subdivision?.id);
    } else if (activeSubdivisionTab !== 'all') {
      result = result.filter((e: any) => String(e.subdivision?.id) === activeSubdivisionTab);
    }

    return result;
  }, [
    searchAndAdvancedFiltered,
    viewMode,
    isGlobalView,
    stableSubdivisionId,
    activeDivisionTab,
    activeSubdivisionTab,
  ]);

  // ===== 4. Финальный список для таблицы =====
  const filteredEquipment = useMemo(() => {
    if (selectedStatus === 'all') return tabsFilteredBase;
    return tabsFilteredBase.filter((item: any) => item.status === selectedStatus);
  }, [tabsFilteredBase, selectedStatus]);

  // ============ ВКЛАДКИ ПОДРАЗДЕЛЕНИЙ / ОТДЕЛЕНИЙ ============
  const divisionTabs = useMemo<EquipmentTab[]>(() => {
    if (viewMode !== 'grouped') return [];
    if (!isGlobalView) return [];
    if (stableSubdivisionId) return [];

    const map = new Map<string, EquipmentTab>();
    searchAndAdvancedFiltered.forEach((e: any) => {
      if (!e.division?.id) return;
      const divId = String(e.division.id);
      if (!map.has(divId)) {
        map.set(divId, {
          id: divId,
          name: e.division.name,
          count: 0,
          order: e.division.order ?? 9999,
        });
      }
      map.get(divId)!.count++;
    });

    const tabs = Array.from(map.values()).sort((a, b) => a.order - b.order);
    if (tabs.length < 2) return [];
    tabs.unshift({
      id: 'all',
      name: 'Все подразделения',
      count: searchAndAdvancedFiltered.length,
      order: 0,
    });
    return tabs;
  }, [viewMode, isGlobalView, stableSubdivisionId, searchAndAdvancedFiltered]);

  const subdivisionTabs = useMemo<EquipmentTab[]>(() => {
    if (viewMode !== 'grouped') return [];
    if (stableSubdivisionId) return [];

    const scopeDivisionId = id
      ? String(id)
      : isExploitationUser
        ? userDivisionId
          ? String(userDivisionId)
          : null
        : activeDivisionTab !== 'all'
          ? activeDivisionTab
          : null;

    if (!scopeDivisionId) return [];

    const divisionFiltered = searchAndAdvancedFiltered.filter(
      (e: any) => String(e.division?.id) === scopeDivisionId,
    );

    const subsMap = new Map<string, EquipmentTab>();
    divisionFiltered.forEach((e: any) => {
      if (!e.subdivision?.id) return;
      const subId = String(e.subdivision.id);
      if (!subsMap.has(subId)) {
        subsMap.set(subId, {
          id: subId,
          name: e.subdivision.name,
          count: 0,
          order: e.subdivision.order ?? 9999,
        });
      }
      subsMap.get(subId)!.count++;
    });

    const subs = Array.from(subsMap.values()).sort((a, b) => a.order - b.order);

    const noSubCount = divisionFiltered.filter((e: any) => !e.subdivision?.id).length;
    if (noSubCount > 0) {
      subs.push({
        id: 'no-subdivision',
        name: 'Без отделения',
        count: noSubCount,
        order: 99999,
      });
    }

    if (subs.length < 2) return [];

    return [
      { id: 'all', name: 'Все отделения', count: divisionFiltered.length, order: 0 },
      ...subs,
    ];
  }, [
    viewMode,
    stableSubdivisionId,
    id,
    isExploitationUser,
    userDivisionId,
    activeDivisionTab,
    searchAndAdvancedFiltered,
  ]);

  const showDivisionTabs = viewMode === 'grouped' && divisionTabs.length > 1;
  const showSubdivisionTabs = viewMode === 'grouped' && subdivisionTabs.length > 1;

  // Синхронизация вкладки отделения с URL
  useEffect(() => {
    if (subdivisionId) setActiveSubdivisionTab(String(subdivisionId));
  }, [subdivisionId]);

  // Защита вкладок
  useEffect(() => {
    if (viewMode !== 'grouped') return;
    if (activeSubdivisionTab === 'all') return;
    if (!subdivisionTabs.some((t) => t.id === activeSubdivisionTab)) {
      setActiveSubdivisionTab('all');
    }
  }, [viewMode, subdivisionTabs, activeSubdivisionTab]);

  useEffect(() => {
    if (viewMode !== 'grouped') return;
    if (activeDivisionTab === 'all') return;
    if (!divisionTabs.some((t) => t.id === activeDivisionTab)) {
      setActiveDivisionTab('all');
    }
  }, [viewMode, divisionTabs, activeDivisionTab]);

  // Индикаторы вкладок
  useEffect(() => {
    if (!divisionTabsRef.current) return;
    const btn = divisionTabsRef.current.querySelector(
      '.equipment-division-tab.active',
    ) as HTMLElement | null;
    if (btn) {
      setDivisionIndicatorStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        top: btn.offsetTop + btn.offsetHeight - 2,
      });
    } else {
      setDivisionIndicatorStyle({ left: 0, width: 0, top: 0 });
    }
  }, [activeDivisionTab, divisionTabs, showDivisionTabs]);

  useEffect(() => {
    if (!subdivisionTabsRef.current) return;
    const btn = subdivisionTabsRef.current.querySelector(
      '.equipment-subdivision-tab.active',
    ) as HTMLElement | null;
    if (btn) {
      setSubdivisionIndicatorStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        top: btn.offsetTop + btn.offsetHeight - 2,
      });
    } else {
      setSubdivisionIndicatorStyle({ left: 0, width: 0, top: 0 });
    }
  }, [activeSubdivisionTab, subdivisionTabs, showSubdivisionTabs]);

  useEffect(() => {
    const onResize = () => {
      if (divisionTabsRef.current) {
        const btn = divisionTabsRef.current.querySelector(
          '.equipment-division-tab.active',
        ) as HTMLElement | null;
        if (btn) {
          setDivisionIndicatorStyle({
            left: btn.offsetLeft,
            width: btn.offsetWidth,
            top: btn.offsetTop + btn.offsetHeight - 2,
          });
        }
      }
      if (subdivisionTabsRef.current) {
        const btn = subdivisionTabsRef.current.querySelector(
          '.equipment-subdivision-tab.active',
        ) as HTMLElement | null;
        if (btn) {
          setSubdivisionIndicatorStyle({
            left: btn.offsetLeft,
            width: btn.offsetWidth,
            top: btn.offsetTop + btn.offsetHeight - 2,
          });
        }
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleDivisionChange = useCallback((divId: string) => {
    setActiveDivisionTab(divId);
    setActiveSubdivisionTab('all');
  }, []);

  const handleSubdivisionChange = useCallback((subId: string) => {
    setActiveSubdivisionTab(subId);
  }, []);

  // ============ ПРОЧИЕ ОБРАБОТЧИКИ ============
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(location.pathname + location.search, {
      state: { ...location.state, activeTab: tab },
      replace: true,
    });
    setTimeout(() => {
      const activeTabElement = document.querySelector('.equipment-tab-button.active');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 10);
  };

  const handleAdvancedFilterChange = (filterType: keyof AdvancedSearchFilters, values: any) => {
    setAdvancedFilters((prev) => ({ ...prev, [filterType]: values }));
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({ ...EMPTY_ADVANCED_FILTERS });
  };

  const hasActiveAdvancedFilters = useMemo(
    () => hasAnyActiveFilter(advancedFilters),
    [advancedFilters],
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
          fromSubdivision: isFromSubdivision,
        },
      });
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    try {
      await equipmentApi.deleteEquipment(equipmentId);
      dispatch(deleteEquipment(equipmentId));
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

  const handleDisposeEquipment = async (equipmentId: string, disposalInfo: any) => {
    if (!stableToken) {
      console.error('Нет токена для списания техники');
      throw new Error('Не авторизован');
    }
    try {
      const updated = await equipmentApi.disposeEquipment(stableToken, equipmentId, disposalInfo);
      const nextList = (equipment as any[]).map((item: any) =>
        item.id === equipmentId ? { ...item, ...updated } : item,
      );
      dispatch(setEquipment(nextList as any));
    } catch (error) {
      console.error('Error disposing equipment:', error);
      throw error;
    }
  };

  const handleBack = () => {
    if ((location.state as any)?.fromDivisionList) {
      navigate('/');
      return;
    }
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
    <div className="page-fade-in">
      <div className="equipment-header">
        <div className="equipment-title-container">
          {id && (
            <button onClick={handleBack} className="back-button">
              <ArrowLeft className="back-button-icon" />
            </button>
          )}
          <h2 className="equipment-title">
            <Database size={28} />
            {getHeaderTitle()}
          </h2>
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
            <button
              className={`equipment-tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <div className="equipment-tab-icon"><Box size={16} /></div>
              Вся техника
            </button>
            {availableCategories.map((category: any) => {
              const Icon = CATEGORY_ICON_COMPONENTS[category.value] ?? Box;
              return (
                <button
                  key={category.value}
                  className={`equipment-tab-button ${activeTab === category.value ? 'active' : ''}`}
                  onClick={() => handleTabChange(category.value)}
                >
                  <Icon className="equipment-tab-icon" size={16} />
                  {category.name}
                </button>
              );
            })}
            {closedEquipment.length > 0 && (
              <button
                className={`equipment-tab-button ${activeTab === 'closed' ? 'active' : ''}`}
                onClick={() => handleTabChange('closed')}
              >
                <KeyRound className="equipment-tab-icon" size={16} />
                Закрытая техника
              </button>
            )}
          </div>
        </div>

        <div className="equipment-content">
          {/* ====== Теги активных advanced-фильтров ====== */}
          {hasActiveAdvancedFilters && (
            <div className="active-filters">
              <div className="filter-tags">
                {/* Идентификация */}
                {advancedFilters.names.map((n, i) => (
                  <span key={`name-${i}`} className="filter-tag">
                    Название: {n}
                    <button onClick={() => {
                      const copy = [...advancedFilters.names]; copy.splice(i, 1);
                      handleAdvancedFilterChange('names', copy);
                    }}>×</button>
                  </span>
                ))}
                {advancedFilters.serialNumbers.map((sn, i) => (
                  <span key={`sn-${i}`} className="filter-tag">
                    Серийный: {sn}
                    <button onClick={() => {
                      const copy = [...advancedFilters.serialNumbers]; copy.splice(i, 1);
                      handleAdvancedFilterChange('serialNumbers', copy);
                    }}>×</button>
                  </span>
                ))}
                {advancedFilters.inventoryNumbers.map((inv, i) => (
                  <span key={`inv-${i}`} className="filter-tag">
                    Инвентарный: {inv}
                    <button onClick={() => {
                      const copy = [...advancedFilters.inventoryNumbers]; copy.splice(i, 1);
                      handleAdvancedFilterChange('inventoryNumbers', copy);
                    }}>×</button>
                  </span>
                ))}

                {/* Классификация */}
                {advancedFilters.categories.map((c, i) => (
                  <span key={`cat-${i}`} className="filter-tag">
                    Категория: {c}
                    <button onClick={() => handleAdvancedFilterChange('categories', [])}>×</button>
                  </span>
                ))}
                {advancedFilters.deviceTypes.map((dt, i) => (
                  <span key={`dt-${i}`} className="filter-tag">
                    Тип: {DEVICE_TYPE_LABELS[dt] || dt}
                    <button onClick={() => handleAdvancedFilterChange('deviceTypes', [])}>×</button>
                  </span>
                ))}
                {advancedFilters.statuses.map((s, i) => (
                  <span key={`st-${i}`} className="filter-tag">
                    Статус: {STATUS_LABELS[s] || s}
                    <button onClick={() => handleAdvancedFilterChange('statuses', [])}>×</button>
                  </span>
                ))}
                {advancedFilters.secretLevels.map((sl, i) => (
                  <span key={`sl-${i}`} className="filter-tag">
                    Секретность: {SECRET_LABELS[sl] || sl}
                    <button onClick={() => handleAdvancedFilterChange('secretLevels', [])}>×</button>
                  </span>
                ))}

                {/* Принадлежность */}
                {advancedFilters.divisions.map((d, i) => (
                  <span key={`div-${i}`} className="filter-tag">
                    Подразделение: {d}
                    <button onClick={() => {
                      handleAdvancedFilterChange('divisions', []);
                      handleAdvancedFilterChange('subdivisions', []);
                      handleAdvancedFilterChange('facilities', []);
                    }}>×</button>
                  </span>
                ))}
                {advancedFilters.subdivisions.map((s, i) => (
                  <span key={`sub-${i}`} className="filter-tag">
                    Отделение: {s}
                    <button onClick={() => handleAdvancedFilterChange('subdivisions', [])}>×</button>
                  </span>
                ))}
                {advancedFilters.facilities.map((f, i) => (
                  <span key={`fac-${i}`} className="filter-tag">
                    Объект: {f}
                    <button onClick={() => handleAdvancedFilterChange('facilities', [])}>×</button>
                  </span>
                ))}
                {advancedFilters.assignedTo.map((a, i) => (
                  <span key={`as-${i}`} className="filter-tag">
                    Закреплено за: {a}
                    <button onClick={() => {
                      const copy = [...advancedFilters.assignedTo]; copy.splice(i, 1);
                      handleAdvancedFilterChange('assignedTo', copy);
                    }}>×</button>
                  </span>
                ))}
                {advancedFilters.interestOrgans.map((organ, i) => (
                  <span key={`org-${organ.id}`} className="filter-tag">
                    В чьих интересах: {organ.name}
                    <button onClick={() => {
                      const copy = [...advancedFilters.interestOrgans]; copy.splice(i, 1);
                      handleAdvancedFilterChange('interestOrgans', copy);
                    }}>×</button>
                  </span>
                ))}

                {/* Флаги */}
                {advancedFilters.isNetwork && (
                  <span className="filter-tag">
                    Только сетевое
                    <button onClick={() => handleAdvancedFilterChange('isNetwork', false)}>×</button>
                  </span>
                )}
                {advancedFilters.isClosed && (
                  <span className="filter-tag">
                    Только закрытое
                    <button onClick={() => handleAdvancedFilterChange('isClosed', false)}>×</button>
                  </span>
                )}
                {advancedFilters.isFreeUse && (
                  <span className="filter-tag">
                    Только безвозмездное
                    <button onClick={() => handleAdvancedFilterChange('isFreeUse', false)}>×</button>
                  </span>
                )}

                {/* Даты */}
                {advancedFilters.manufacturingDateFrom && (
                  <span className="filter-tag">
                    Произв. с: {advancedFilters.manufacturingDateFrom}
                    <button onClick={() => handleAdvancedFilterChange('manufacturingDateFrom', '')}>×</button>
                  </span>
                )}
                {advancedFilters.manufacturingDateTo && (
                  <span className="filter-tag">
                    Произв. по: {advancedFilters.manufacturingDateTo}
                    <button onClick={() => handleAdvancedFilterChange('manufacturingDateTo', '')}>×</button>
                  </span>
                )}
                {advancedFilters.exploitationDateFrom && (
                  <span className="filter-tag">
                    Ввод с: {advancedFilters.exploitationDateFrom}
                    <button onClick={() => handleAdvancedFilterChange('exploitationDateFrom', '')}>×</button>
                  </span>
                )}
                {advancedFilters.exploitationDateTo && (
                  <span className="filter-tag">
                    Ввод по: {advancedFilters.exploitationDateTo}
                    <button onClick={() => handleAdvancedFilterChange('exploitationDateTo', '')}>×</button>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="equipment-actions-row1">
            <div className="equipment-status-buttons-wrapper">
              <StatusButtons
                equipment={tabsFilteredBase}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
              />
            </div>
          </div>

          <div className="equipment-search-container">
            <div className="search-bar-with-filters">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Поиск по наименованию, серийному номеру, инвентарному номеру, за кем закреплено, в чьих интересах..."
              />
              <button
                className={`advanced-filter-button ${hasActiveAdvancedFilters ? 'active' : ''}`}
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
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

            <AdvancedSearchModal
              isOpen={showAdvancedSearch}
              filters={advancedFilters}
              onFilterChange={handleAdvancedFilterChange}
              onClose={() => setShowAdvancedSearch(false)}
              onClearFilters={clearAdvancedFilters}
              equipment={equipment}
            />
          </div>

          {/* ====== Счётчик + переключатель режимов ====== */}
          <div className="equipment-count-chip">
            <div className="equipment-view-mode-toggle">
              <button
                className={`equipment-view-mode-btn ${viewMode === 'flat' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('flat')}
              >
                <List size={16} /> Список
              </button>
              <button
                className={`equipment-view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('grouped')}
              >
                <FolderTree size={16} /> По подразделениям
              </button>
            </div>

            <div className="equipment-count-left">
              <Package size={16} className="count-chip-icon" />
              <span>{getSelectedStatusLabel()}:</span>
              <span>{filteredEquipment.length}</span>
              <span className="count-chip-label">{getEquipmentDeclension(filteredEquipment.length)}</span>
            </div>

            <div className="equipment-count-right"></div>
          </div>

          {/* ====== Вкладки подразделений (grouped) ====== */}
          {showDivisionTabs && (
            <div className="equipment-division-tabs" ref={divisionTabsRef}>
              {divisionTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`equipment-division-tab ${activeDivisionTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleDivisionChange(tab.id)}
                >
                  <span>{tab.name}</span>
                  <span className="equipment-division-tab-count">{tab.count}</span>
                </button>
              ))}
              <div
                className="equipment-division-tabs-indicator"
                style={{
                  left: `${divisionIndicatorStyle.left}px`,
                  width: `${divisionIndicatorStyle.width}px`,
                  top: `${divisionIndicatorStyle.top}px`,
                }}
              />
            </div>
          )}

          {/* ====== Вкладки отделений (grouped) ====== */}
          {showSubdivisionTabs && (
            <div className="equipment-subdivision-tabs" ref={subdivisionTabsRef}>
              {subdivisionTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`equipment-subdivision-tab ${activeSubdivisionTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleSubdivisionChange(tab.id)}
                >
                  <span>{tab.name}</span>
                  <span className="equipment-subdivision-tab-count">{tab.count}</span>
                </button>
              ))}
              <div
                className="equipment-subdivision-tabs-indicator"
                style={{
                  left: `${subdivisionIndicatorStyle.left}px`,
                  width: `${subdivisionIndicatorStyle.width}px`,
                  top: `${subdivisionIndicatorStyle.top}px`,
                }}
              />
            </div>
          )}

          <EquipmentList
            equipment={filteredEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            onDisposeEquipment={handleDisposeEquipment}
            divisionId={id}
            subdivisionId={stableSubdivisionId ?? undefined}
            activeTab={activeTab}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </div>
  );
}