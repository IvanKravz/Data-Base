// FacilitiesSection.tsx
import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import {
  ArrowLeft,
  Plus,
  FolderOpen,
  FolderClosed,
  SatelliteDish,
  Map as MapIcon,
  List,
  FolderTree,
  Building2
} from 'lucide-react';
import { facilitiesApi, authApi, divisionsApi } from '../../../../../api';
import { FacilityList } from '../../../../facilities/FacilityList';
import { FacilityTypeFilter } from '../../../../facilities/FacilityTypeFilter';
import { Facility } from '../../../../../types';
import { ExportButton } from '../../../../common/ExportButton';
import { SearchBar } from '../../../../common/SearchBar';
import { exportFacilitiesToExcel } from '../../../../../utils/exportToExcel';
import './FacilitiesSection.css';
import { ConfirmationModal } from '../../../../modals/ConfirmationModal';
import { isExploitationChief, isExploitationEmployee } from '../../../../../api/utils/permissions';

import { FacilityCommunicationPostsPanel } from '../CommunicationPosts/FacilityCommunicationPostsPanel';

const LazyMapView = lazy(() => import('../../../../map/MapView/MapView'));

const TAB_ICONS = {
  'all': <MapIcon className="facilities-tab-icon" size={16} />,
  'open': <FolderOpen className="facilities-tab-icon" size={16} />,
  'closed': <FolderClosed className="facilities-tab-icon" size={16} />,
  'posts': <SatelliteDish className="facilities-tab-icon" size={16} />
};

interface DivisionTab {
  id: string;
  name: string;
  count: number;
  order: number;
}

export function FacilitiesSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem('accessToken');
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const [filterType, setFilterType] = useState<'all' | number>('all');
  const [facilityClassFilter, setFacilityClassFilter] = useState<'all' | '1' | '2'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed' | 'posts'>('all');

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [division, setDivision] = useState<any>(null);
  const [subdivisionName, setSubdivisionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapSearchTerm, setMapSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>(() => {
    const saved = localStorage.getItem('facility_view_mode');
    return (saved === 'flat' || saved === 'grouped') ? saved : 'flat';
  });

  const [activeDivisionTab, setActiveDivisionTab] = useState<string>('all');
  const [activeSubdivisionTab, setActiveSubdivisionTab] = useState<string>('all');

  const [searchTerm, setSearchTerm] = useState('');

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });

  const divisionTabsRef = useRef<HTMLDivElement | null>(null);
  const subdivisionTabsRef = useRef<HTMLDivElement | null>(null);
  const [divisionIndicatorStyle, setDivisionIndicatorStyle] = useState({ left: 0, width: 0, top: 0 });
  const [subdivisionIndicatorStyle, setSubdivisionIndicatorStyle] = useState({ left: 0, width: 0, top: 0 });

  const stableToken = useMemo(() => token, [token]);
  const stableSubdivisionId = useMemo(() => searchParams.get('subdivision'), [searchParams]);

  const storageKey = useMemo(() => {
    const base = id ? `division_${id}` : 'global';
    const sub = stableSubdivisionId ? `_sub_${stableSubdivisionId}` : '';
    return `facilities_${base}${sub}`;
  }, [id, stableSubdivisionId]);

  const isExploitationUser = useMemo(() => isExploitationChief() || isExploitationEmployee(), []);
  const isChief = useMemo(() => isExploitationChief(), []);
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  const userDivisionId = useMemo(() => (user as any)?.division_info?.id ?? null, [user]);
  const userSubdivisionId = useMemo(() => {
    if (!(user as any)?.division_info || isChief) return null;
    return (user as any).division_info.subdivision?.id ?? null;
  }, [user, isChief]);

  const canViewCommunicationPosts = useMemo(() =>
    permissions?.models?.CommunicationPost?.includes('view') ?? false, [permissions]);
  const canCreateFacilities = useMemo(() =>
    permissions?.models?.Facility?.includes('add') ?? false, [permissions]);
  const canCreateCommunicationPosts = useMemo(() =>
    permissions?.models?.CommunicationPost?.includes('add') ?? false, [permissions]);
  const canEditCommunicationPosts = useMemo(() =>
    permissions?.models?.CommunicationPost?.includes('change') ?? false, [permissions]);
  const canDeleteCommunicationPosts = useMemo(() =>
    permissions?.models?.CommunicationPost?.includes('delete') ?? false, [permissions]);

  const effectiveDivisionId = useMemo<string | undefined>(() => {
    if (id) return id;
    if (isExploitationUser && userDivisionId) return String(userDivisionId);
    return undefined;
  }, [id, isExploitationUser, userDivisionId]);

  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) newParams.delete(key);
        else newParams.set(key, value);
      });
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    let newActiveTab: typeof activeTab = 'all';
    if (tabParam === 'open') newActiveTab = 'open';
    else if (tabParam === 'closed') newActiveTab = 'closed';
    else if (tabParam === 'posts') newActiveTab = 'posts';
    else newActiveTab = 'all';
    if (newActiveTab !== activeTab) setActiveTab(newActiveTab);

    const typeParam = searchParams.get('type');
    let newFilterType: typeof filterType = 'all';
    if (typeParam && typeParam !== 'all') {
      const parsed = parseInt(typeParam, 10);
      if (!isNaN(parsed)) newFilterType = parsed;
    }
    if (newFilterType !== filterType) setFilterType(newFilterType);

    const classParam = searchParams.get('class');
    let newClass: typeof facilityClassFilter = 'all';
    if (classParam === '1' || classParam === '2') newClass = classParam;
    if (newClass !== facilityClassFilter) setFacilityClassFilter(newClass);
  }, [searchParams]);

  const handleTabChange = useCallback((tab: typeof activeTab) => {
    if (tab === 'posts') {
      updateUrlParams({ tab, type: null, class: null });
    } else {
      updateUrlParams({ tab });
    }
    setMapSearchTerm('');
  }, [updateUrlParams]);

  const handleTypeChange = useCallback((type: typeof filterType, resetClass: boolean = false) => {
    const updates: Record<string, string | null> = {};
    if (type === 'all') updates.type = null;
    else updates.type = type.toString();
    if (resetClass) updates.class = null;
    updateUrlParams(updates);
    setMapSearchTerm('');
  }, [updateUrlParams]);

  const handleClassChange = useCallback((cls: typeof facilityClassFilter) => {
    if (cls === 'all') updateUrlParams({ class: null });
    else updateUrlParams({ class: cls });
    setMapSearchTerm('');
  }, [updateUrlParams]);

  const handleViewModeChange = useCallback((mode: 'flat' | 'grouped') => {
    setViewMode(mode);
    localStorage.setItem('facility_view_mode', mode);
  }, []);

  const fetchData = useCallback(async () => {
    if (!stableToken) return;
    try {
      setLoading(true);
      setError(null);
      if (isGlobalView) {
        const allFacilities = await facilitiesApi.getFacilities({ token: stableToken });
        setFacilities(allFacilities);
        authApi.updateGlobalView(true);
      } else if (isExploitationUser) {
        authApi.updateGlobalView(false);
        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }
        const targetSubdivisionId = stableSubdivisionId || userSubdivisionId;
        const [allFacilities, div] = await Promise.all([
          facilitiesApi.getFacilities({ token: stableToken, division: String(userDivisionId) }),
          divisionsApi.getDivisionById(String(userDivisionId), stableToken),
        ]);
        if (targetSubdivisionId) {
          const subdivision = div?.subdivisions?.find(
            (s: any) => s.id.toString() === targetSubdivisionId.toString(),
          );
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }
        setFacilities(allFacilities);
        setDivision(div);
      } else {
        authApi.updateGlobalView(false);
        const [allFacilities, div] = await Promise.all([
          facilitiesApi.getFacilities({ token: stableToken, division: id }),
          divisionsApi.getDivisionById(id!, stableToken),
        ]);
        if (stableSubdivisionId) {
          const subdivision = div?.subdivisions?.find(
            (s: any) => s.id.toString() === stableSubdivisionId.toString(),
          );
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }
        setFacilities(allFacilities);
        setDivision(div);
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
    return items.filter(item => item?.subdivision?.id?.toString() === stableSubdivisionId.toString());
  }, [isExploitationUser, id, isGlobalView, stableSubdivisionId]);

  const filteredBySubdivisionFacilities = useMemo(
    () => filterBySubdivision(facilities),
    [facilities, filterBySubdivision],
  );

  const statusTypeClassFiltered = useMemo(() => {
    let result = filteredBySubdivisionFacilities;
    if (activeTab === 'open') result = result.filter(f => !f.is_closed);
    else if (activeTab === 'closed') result = result.filter(f => f.is_closed);
    if (filterType !== 'all') result = result.filter(f => f.type?.id === filterType);
    if (facilityClassFilter !== 'all') result = result.filter(f => f.facility_class === facilityClassFilter);
    return result;
  }, [filteredBySubdivisionFacilities, activeTab, filterType, facilityClassFilter]);

  const matchesSearch = useCallback((f: Facility): boolean => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (f.name ?? '').toLowerCase().includes(q) ||
      (f.address ?? '').toLowerCase().includes(q) ||
      (f.type?.name ? f.type.name.toLowerCase().includes(q) : false) ||
      (f.facility_class ? `${f.facility_class} класс`.includes(q) : false) ||
      (f.division_name ? f.division_name.toLowerCase().includes(q) : false) ||
      (f.subdivision_name ? f.subdivision_name.toLowerCase().includes(q) : false)
    );
  }, [searchTerm]);

  const filteredWithoutTabs = useMemo(
    () => statusTypeClassFiltered.filter(matchesSearch),
    [statusTypeClassFiltered, matchesSearch],
  );

  const divisionTabs = useMemo<DivisionTab[]>(() => {
    if (viewMode !== 'grouped') return [];
    if (!isGlobalView) return [];
    if (stableSubdivisionId) return [];

    const map = new Map<string, DivisionTab>();
    filteredWithoutTabs.forEach(f => {
      if (!f.division?.id) return;
      const divId = String(f.division.id);
      if (!map.has(divId)) {
        map.set(divId, {
          id: divId,
          name: f.division_name || f.division?.name || 'Подразделение',
          count: 0,
          order: (f.division as any)?.order ?? 9999,
        });
      }
      map.get(divId)!.count++;
    });

    const tabs = Array.from(map.values()).sort((a, b) => a.order - b.order);
    if (tabs.length < 2) return [];
    tabs.unshift({
      id: 'all',
      name: 'Все подразделения',
      count: filteredWithoutTabs.length,
      order: 0,
    });
    return tabs;
  }, [viewMode, isGlobalView, stableSubdivisionId, filteredWithoutTabs]);

  const subdivisionTabs = useMemo<DivisionTab[]>(() => {
    if (viewMode !== 'grouped') return [];
    if (stableSubdivisionId) return [];

    const scopeDivisionId = id
      ? String(id)
      : isExploitationUser
        ? (userDivisionId ? String(userDivisionId) : null)
        : activeDivisionTab !== 'all'
          ? activeDivisionTab
          : null;

    if (!scopeDivisionId) return [];

    const divisionFiltered = filteredWithoutTabs.filter(
      f => String(f.division?.id) === scopeDivisionId,
    );

    const subsMap = new Map<string, DivisionTab>();
    divisionFiltered.forEach(f => {
      if (!f.subdivision?.id) return;
      const subId = String(f.subdivision.id);
      if (!subsMap.has(subId)) {
        subsMap.set(subId, {
          id: subId,
          name: f.subdivision_name || f.subdivision?.name || 'Отделение',
          count: 0,
          order: (f.subdivision as any)?.order ?? 9999,
        });
      }
      subsMap.get(subId)!.count++;
    });

    const subs = Array.from(subsMap.values()).sort((a, b) => a.order - b.order);

    const noSubCount = divisionFiltered.filter(f => !f.subdivision?.id).length;
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
      {
        id: 'all',
        name: 'Все отделения',
        count: divisionFiltered.length,
        order: 0,
      },
      ...subs,
    ];
  }, [viewMode, stableSubdivisionId, id, isExploitationUser, userDivisionId, activeDivisionTab, filteredWithoutTabs]);

  const showDivisionTabs = viewMode === 'grouped' && divisionTabs.length > 1;
  const showSubdivisionTabs = viewMode === 'grouped' && subdivisionTabs.length > 1;

  useEffect(() => {
    if (stableSubdivisionId) setActiveSubdivisionTab(String(stableSubdivisionId));
  }, [stableSubdivisionId]);

  useEffect(() => {
    if (viewMode !== 'grouped') return;
    if (activeSubdivisionTab === 'all') return;
    if (!subdivisionTabs.some(t => t.id === activeSubdivisionTab)) {
      setActiveSubdivisionTab('all');
    }
  }, [viewMode, subdivisionTabs, activeSubdivisionTab]);

  useEffect(() => {
    if (viewMode !== 'grouped') return;
    if (activeDivisionTab === 'all') return;
    if (!divisionTabs.some(t => t.id === activeDivisionTab)) {
      setActiveDivisionTab('all');
    }
  }, [viewMode, divisionTabs, activeDivisionTab]);

  const filteredBySearch = useMemo(() => {
    if (viewMode !== 'grouped') return filteredWithoutTabs;

    let result = filteredWithoutTabs;

    if (isGlobalView && !stableSubdivisionId && activeDivisionTab !== 'all') {
      result = result.filter(f => String(f.division?.id) === activeDivisionTab);
    }

    if (activeSubdivisionTab === 'no-subdivision') {
      result = result.filter(f => !f.subdivision?.id);
    } else if (activeSubdivisionTab !== 'all') {
      result = result.filter(f => String(f.subdivision?.id) === activeSubdivisionTab);
    }

    return result;
  }, [filteredWithoutTabs, viewMode, isGlobalView, stableSubdivisionId, activeDivisionTab, activeSubdivisionTab]);

  const typeFilterSource = useMemo(() => {
    let result = filteredBySubdivisionFacilities;
    if (activeTab === 'open') result = result.filter(f => !f.is_closed);
    else if (activeTab === 'closed') result = result.filter(f => f.is_closed);

    result = result.filter(matchesSearch);

    if (viewMode === 'grouped') {
      if (isGlobalView && !stableSubdivisionId && activeDivisionTab !== 'all') {
        result = result.filter(f => String(f.division?.id) === activeDivisionTab);
      }
      if (activeSubdivisionTab === 'no-subdivision') {
        result = result.filter(f => !f.subdivision?.id);
      } else if (activeSubdivisionTab !== 'all') {
        result = result.filter(f => String(f.subdivision?.id) === activeSubdivisionTab);
      }
    }

    return result;
  }, [filteredBySubdivisionFacilities, activeTab, matchesSearch, viewMode, isGlobalView, stableSubdivisionId, activeDivisionTab, activeSubdivisionTab]);

  const mapFacilities = useMemo(() => {
    if (viewMode !== 'grouped') return statusTypeClassFiltered;

    let result = statusTypeClassFiltered;
    if (isGlobalView && !stableSubdivisionId && activeDivisionTab !== 'all') {
      result = result.filter(f => String(f.division?.id) === activeDivisionTab);
    }
    if (activeSubdivisionTab === 'no-subdivision') {
      result = result.filter(f => !f.subdivision?.id);
    } else if (activeSubdivisionTab !== 'all') {
      result = result.filter(f => String(f.subdivision?.id) === activeSubdivisionTab);
    }
    return result;
  }, [statusTypeClassFiltered, viewMode, isGlobalView, stableSubdivisionId, activeDivisionTab, activeSubdivisionTab]);

  const allFacilityTypes = useMemo(() => {
    const uniqueTypeIds = Array.from(
      new Set(filteredBySubdivisionFacilities.map(f => f.type?.id).filter(v => v != null)),
    );
    return uniqueTypeIds
      .map(typeId => filteredBySubdivisionFacilities.find(f => f.type?.id === typeId)?.type)
      .filter(Boolean) as any[];
  }, [filteredBySubdivisionFacilities]);

  const selectedTypeName = useMemo(() => {
    if (filterType === 'all') return null;
    const type = allFacilityTypes.find(t => t.id === filterType);
    if (!type) return null;
    const isShd = (type.name || '').toLowerCase().includes('шд');
    if (isShd && facilityClassFilter !== 'all') {
      return `ШД (${facilityClassFilter} класс)`;
    }
    return type.name;
  }, [filterType, facilityClassFilter, allFacilityTypes]);

  const hasAllFacilities = filteredBySubdivisionFacilities.length > 0;
  const hasOpenFacilities = filteredBySubdivisionFacilities.some(f => !f.is_closed);
  const hasClosedFacilities = filteredBySubdivisionFacilities.some(f => f.is_closed);

  const visibleTabsKey = useMemo(() => {
    const tabs: string[] = [];
    if (hasAllFacilities) tabs.push('all');
    if (hasOpenFacilities) tabs.push('open');
    if (hasClosedFacilities) tabs.push('closed');
    if (canViewCommunicationPosts) tabs.push('posts');
    return tabs.join(',');
  }, [hasAllFacilities, hasOpenFacilities, hasClosedFacilities, canViewCommunicationPosts]);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const container = tabsRef.current;
      const activeBtn = tabRefs.current[activeTab];

      if (!container || !activeBtn) {
        setIndicatorStyle(prev => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      if (btnRect.width === 0 && containerRect.width === 0) return;

      setIndicatorStyle({
        left: btnRect.left - containerRect.left + container.scrollLeft,
        width: btnRect.width,
        visible: true,
      });
    };

    updateIndicator();
    const raf = requestAnimationFrame(updateIndicator);

    const container = tabsRef.current;
    if (!container) {
      return () => cancelAnimationFrame(raf);
    }

    const ro = new ResizeObserver(() => updateIndicator());
    ro.observe(container);
    Object.values(tabRefs.current).forEach(btn => {
      if (btn) ro.observe(btn);
    });

    container.addEventListener('scroll', updateIndicator, { passive: true });
    window.addEventListener('resize', updateIndicator);

    const t1 = window.setTimeout(updateIndicator, 50);
    const t2 = window.setTimeout(updateIndicator, 200);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      container.removeEventListener('scroll', updateIndicator);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab, visibleTabsKey, loading]);

  useLayoutEffect(() => {
    if (!divisionTabsRef.current) return;
    const btn = divisionTabsRef.current.querySelector('.facilities-division-tab.active') as HTMLElement | null;
    if (btn) setDivisionIndicatorStyle({
      left: btn.offsetLeft,
      width: btn.offsetWidth,
      top: btn.offsetTop + btn.offsetHeight - 2,
    });
    else setDivisionIndicatorStyle({ left: 0, width: 0, top: 0 });
  }, [activeDivisionTab, divisionTabs, showDivisionTabs]);

  useLayoutEffect(() => {
    if (!subdivisionTabsRef.current) return;
    const btn = subdivisionTabsRef.current.querySelector('.facilities-subdivision-tab.active') as HTMLElement | null;
    if (btn) setSubdivisionIndicatorStyle({
      left: btn.offsetLeft,
      width: btn.offsetWidth,
      top: btn.offsetTop + btn.offsetHeight - 2,
    });
    else setSubdivisionIndicatorStyle({ left: 0, width: 0, top: 0 });
  }, [activeSubdivisionTab, subdivisionTabs, showSubdivisionTabs]);

  useEffect(() => {
    const onResize = () => {
      if (divisionTabsRef.current) {
        const btn = divisionTabsRef.current.querySelector('.facilities-division-tab.active') as HTMLElement | null;
        if (btn) setDivisionIndicatorStyle({
          left: btn.offsetLeft,
          width: btn.offsetWidth,
          top: btn.offsetTop + btn.offsetHeight - 2,
        });
      }
      if (subdivisionTabsRef.current) {
        const btn = subdivisionTabsRef.current.querySelector('.facilities-subdivision-tab.active') as HTMLElement | null;
        if (btn) setSubdivisionIndicatorStyle({
          left: btn.offsetLeft,
          width: btn.offsetWidth,
          top: btn.offsetTop + btn.offsetHeight - 2,
        });
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

  const getDeclension = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'объектов';
    if (lastDigit === 1) return 'объект';
    if (lastDigit >= 2 && lastDigit <= 4) return 'объекта';
    return 'объектов';
  };

  const handleFacilityDeleted = useCallback((deletedId: string) => {
    setFacilities(prev => prev.filter(f => f.id !== deletedId));
  }, []);

  const handleBack = useCallback(() => {
    if (location.state?.fromDivisionList) {
      navigate('/');
      return;
    }
    if (isGlobalView) navigate('/');
    else if (stableSubdivisionId) navigate(`/divisions/${id}?subdivision=${stableSubdivisionId}`);
    else navigate(`/divisions/${id}`);
  }, [isGlobalView, navigate, id, stableSubdivisionId, location.state]);

  const handleAddFacility = useCallback(() => {
    const state = {
      from: 'facilities-section',
      divisionId: id,
      subdivisionId: stableSubdivisionId,
      activeTab,
      fromSubdivision: !!stableSubdivisionId
    };
    if (isGlobalView || isExploitationUser) navigate(`/facilities/create`, { state });
    else navigate(`/divisions/${id}/facilities/new${stableSubdivisionId ? `?subdivision=${stableSubdivisionId}` : ''}`, { state });
  }, [isGlobalView, isExploitationUser, navigate, id, stableSubdivisionId, activeTab]);

  const handleLocateFacility = useCallback((facility: Facility) => {
    setMapSearchTerm('');
    setTimeout(() => setMapSearchTerm(facility.name), 10);
    setTimeout(() => {
      const mapElement = document.querySelector('.facilities-map-overlay');
      if (mapElement) mapElement.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleDeleteInitiated = useCallback((facilityId: string) => {
    setFacilityToDelete(facilityId);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (facilityToDelete) {
      try {
        await facilitiesApi.deleteFacility(facilityToDelete);
        handleFacilityDeleted(facilityToDelete);
      } catch (deleteError) {
        console.error('Ошибка при удалении объекта:', deleteError);
      } finally {
        setShowDeleteModal(false);
        setFacilityToDelete(null);
      }
    }
  }, [facilityToDelete, handleFacilityDeleted]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setFacilityToDelete(null);
  }, []);

  const handleExport = useCallback(() => {
    exportFacilitiesToExcel(filteredBySearch);
  }, [filteredBySearch]);

  const getHeaderTitle = () => {
    if (isExploitationUser && !id) {
      const divisionName = (user as any)?.division_info?.name || 'Ваше подразделение';
      return `Объекты: ${divisionName}`;
    }
    if (isGlobalView) return 'Объекты: Все подразделения';
    if (isChief && subdivisionName) return `Объекты: ${division?.name || ''} / ${subdivisionName}`;
    if (isExploitationUser) return `Объекты: ${division?.name || ''}`;
    return `Объекты: ${division?.name || ''}${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowMap(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div className="flex justify-center py-12">Загрузка данных...</div>;
  if (error) return <div className="facilities-error-message">{error}</div>;

  return (
    <div className="facilities-container page-fade-in">
      <div className="facilities-header">
        <div className="facilities-title-container">
          {id && (
            <button type="button" onClick={handleBack} className="back-button">
              <ArrowLeft className="back-button-icon" />
            </button>
          )}
          <h2 className="facilities-title">
            <Building2 size={28} />
            {getHeaderTitle()}
          </h2>
        </div>

        <div className="facilities-add-buttons">
          {activeTab !== 'posts' && canCreateFacilities && (
            <button onClick={handleAddFacility} className="facilities-add-button">
              <Plus size={18} />
              <span>Добавить объект</span>
            </button>
          )}
        </div>
      </div>

      <div className="facilities-content-wrapper">
        <div className="facilities-tabs-container">
          <div className="facilities-tabs" ref={tabsRef}>
            {hasAllFacilities && (
              <button
                ref={(el) => { tabRefs.current['all'] = el; }}
                className={`facilities-tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => handleTabChange('all')}
              >
                {TAB_ICONS.all}
                Все объекты
              </button>
            )}
            {hasOpenFacilities && (
              <button
                ref={(el) => { tabRefs.current['open'] = el; }}
                className={`facilities-tab-button ${activeTab === 'open' ? 'active' : ''}`}
                onClick={() => handleTabChange('open')}
              >
                {TAB_ICONS.open}
                Открытые объекты
              </button>
            )}
            {hasClosedFacilities && (
              <button
                ref={(el) => { tabRefs.current['closed'] = el; }}
                className={`facilities-tab-button ${activeTab === 'closed' ? 'active' : ''}`}
                onClick={() => handleTabChange('closed')}
              >
                {TAB_ICONS.closed}
                Закрытые объекты
              </button>
            )}
            {canViewCommunicationPosts && (
              <button
                ref={(el) => { tabRefs.current['posts'] = el; }}
                className={`facilities-tab-button ${activeTab === 'posts' ? 'active' : ''}`}
                onClick={() => handleTabChange('posts')}
              >
                {TAB_ICONS.posts}
                Посты связи
              </button>
            )}

            <span
              className={`facilities-tab-indicator${indicatorStyle.visible ? ' visible' : ''}`}
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          </div>
        </div>

        <div className="facilities-content">
          {activeTab === 'posts' ? (
            <FacilityCommunicationPostsPanel
              token={token!}
              divisionId={effectiveDivisionId}
              subdivisionId={stableSubdivisionId || undefined}
              canAdd={canCreateCommunicationPosts}
              canEdit={canEditCommunicationPosts}
              canDelete={canDeleteCommunicationPosts}
              onChanged={fetchData}
              title="Посты связи"
            />
          ) : (
            <>
              <div className="facilities-actions-row1">
                <FacilityTypeFilter
                  facilities={typeFilterSource}
                  selectedType={filterType}
                  onTypeChange={handleTypeChange}
                  selectedClass={facilityClassFilter}
                  onClassChange={handleClassChange}
                  activeTab={activeTab}
                  compact={true}
                />
              </div>

              <div className="facilities-search-container">
                <SearchBar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  placeholder="Поиск по названию, адресу, типу, классу, подразделению..."
                />
                <div className="export-button-wrapper">
                  <ExportButton onClick={handleExport} label="Экспорт объектов" />
                </div>
              </div>

              <div className="facilities-count-chip">
                <div className="facilities-view-mode-toggle">
                  <button
                    className={`facilities-view-mode-btn ${viewMode === 'flat' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('flat')}
                  >
                    <List size={16} /> Список
                  </button>
                  <button
                    className={`facilities-view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('grouped')}
                  >
                    <FolderTree size={16} /> По подразделениям
                  </button>
                </div>

                <div className="facilities-count-center">
                  <Building2 size={16} className="count-chip-icon" />
                  <span>{selectedTypeName ? selectedTypeName : 'Показано'}:</span>
                  <span>{filteredBySearch.length}</span>
                  <span className="count-chip-label">{getDeclension(filteredBySearch.length)}</span>
                </div>

                <div className="facilities-count-right"></div>
              </div>

              {showDivisionTabs && (
                <div className="facilities-division-tabs" ref={divisionTabsRef}>
                  {divisionTabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`facilities-division-tab ${activeDivisionTab === tab.id ? 'active' : ''}`}
                      onClick={() => handleDivisionChange(tab.id)}
                    >
                      <span>{tab.name}</span>
                      <span className="facilities-division-tab-count">{tab.count}</span>
                    </button>
                  ))}
                  <div
                    className="facilities-division-tabs-indicator"
                    style={{
                      left: `${divisionIndicatorStyle.left}px`,
                      width: `${divisionIndicatorStyle.width}px`,
                      top: `${divisionIndicatorStyle.top}px`,
                    }}
                  />
                </div>
              )}

              {showSubdivisionTabs && (
                <div className="facilities-subdivision-tabs" ref={subdivisionTabsRef}>
                  {subdivisionTabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`facilities-subdivision-tab ${activeSubdivisionTab === tab.id ? 'active' : ''}`}
                      onClick={() => handleSubdivisionChange(tab.id)}
                    >
                      <span>{tab.name}</span>
                      <span className="facilities-subdivision-tab-count">{tab.count}</span>
                    </button>
                  ))}
                  <div
                    className="facilities-subdivision-tabs-indicator"
                    style={{
                      left: `${subdivisionIndicatorStyle.left}px`,
                      width: `${subdivisionIndicatorStyle.width}px`,
                      top: `${subdivisionIndicatorStyle.top}px`,
                    }}
                  />
                </div>
              )}

              <div className="facilities-two-columns">
                <div className="facilities-left-column">
                  <FacilityList
                    facilities={filteredBySearch}
                    viewMode="flat"
                    onDelete={handleDeleteInitiated}
                    onLocate={handleLocateFacility}
                    divisionId={id}
                    subdivisionId={stableSubdivisionId}
                    activeTab={activeTab}
                    filterType={filterType?.toString() || null}
                    facilityClassFilter={facilityClassFilter !== 'all' ? facilityClassFilter : null}
                    searchTerm={searchTerm}
                    storageKey={storageKey}
                  />
                </div>
                {filteredBySearch.length > 0 && (
                  <div className="facilities-right-column">
                    {showMap && (
                      <div className="facilities-map-overlay">
                        <Suspense fallback={<div className="loading-spinner"></div>}>
                          <LazyMapView facilities={mapFacilities} searchTerm={mapSearchTerm} />
                        </Suspense>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmationModal
          type="delete"
          title="Удаление объекта"
          message="Вы уверены, что хотите удалить этот объект? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}