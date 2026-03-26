// FacilitiesSection.tsx
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import {
  ArrowLeft,
  Plus,
  FolderOpen,
  FolderClosed,
  SatelliteDish,
  Map
} from 'lucide-react';
import { facilitiesApi, communicationPostsApi, authApi } from '../../../../../api';
import { FacilityList } from '../../../../facilities/FacilityList';
import { CommunicationPostsList } from '../CommunicationPosts/CommunicationPostsList';
import { SearchBar } from '../../../../common/SearchBar';
import { FacilityTypeFilter } from '../../../../facilities/FacilityTypeFilter';
import { divisionsApi } from '../../../../../api';
import { Facility, CommunicationPost } from '../../../../../types';
import './FacilitiesSection.css';
import { normalizeSearchString } from '../../../../../utils/normalizeSearchString';
import { useDebounce } from '../../../../../utils/useDebounce';
import { DeleteConfirmationModal } from '../../../../modals/DeleteConfirmationModal';
import { isExploitationChief, isExploitationEmployee } from '../../../../../api/utils/permissions';

// Ленивая загрузка карты
const LazyMapView = lazy(() => import('../../../../map/MapView/MapView'));

const TAB_ICONS = {
  'all': <Map className="facilities-tab-icon" size={16} />,
  'open': <FolderOpen className="facilities-tab-icon" size={16} />,
  'closed': <FolderClosed className="facilities-tab-icon" size={16} />,
  'posts': <SatelliteDish className="facilities-tab-icon" size={16} />
};

export function FacilitiesSection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('accessToken');
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Получаем пользователя из Redux
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const [filterType, setFilterType] = useState<'all' | number>(() => {
    if (location.state?.filterType) return location.state.filterType;
    const typeFromUrl = searchParams.get('type');
    return typeFromUrl && typeFromUrl !== 'all' ? parseInt(typeFromUrl) : 'all';
  });

  const [facilityClassFilter, setFacilityClassFilter] = useState<'all' | '1' | '2'>(() => {
    if (location.state?.facilityClassFilter) return location.state.facilityClassFilter;
    const classFromUrl = searchParams.get('class');
    return (classFromUrl === '1' || classFromUrl === '2') ? classFromUrl : 'all';
  });

  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed' | 'posts'>(() => {
    if (location.state?.activeTab) return location.state.activeTab;
    const tabFromUrl = searchParams.get('tab');
    return (tabFromUrl === 'all' || tabFromUrl === 'open' || tabFromUrl === 'closed' || tabFromUrl === 'posts')
      ? tabFromUrl
      : 'all';
  });

  const [viewType, setViewType] = useState<'table' | 'grid'>(() => {
    if (location.state?.viewType) return location.state.viewType;
    const viewFromUrl = searchParams.get('view');
    return viewFromUrl === 'grid' ? 'grid' : 'table';
  });

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [communicationPosts, setCommunicationPosts] = useState<CommunicationPost[]>([]);
  const [division, setDivision] = useState(null);
  const [subdivisionName, setSubdivisionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [mapSearchTerm, setMapSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Стабилизированные значения
  const stableToken = useMemo(() => token, [token]);
  const stableSubdivisionId = useMemo(() => searchParams.get('subdivision'), [searchParams]);

  // Определяем тип пользователя
  const isExploitationUser = useMemo(() => isExploitationChief() || isExploitationEmployee(), []);
  const isChief = useMemo(() => isExploitationChief(), []);

  // Для эксплуатационных пользователей отключаем глобальный режим
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  // Получаем ID подразделения пользователя
  const userDivisionId = useMemo(() => user?.division_info?.id ?? null, [user]);

  // Получаем ID отделения пользователя
  const userSubdivisionId = useMemo(() => {
    if (!user?.division_info || isChief) return null;
    return user.division_info.subdivision?.id ?? null;
  }, [user, isChief]);

  // Проверка прав через Redux
  const canViewCommunicationPosts = useMemo(() => {
    return permissions?.models?.CommunicationPost?.includes('view') ?? false;
  }, [permissions]);

  const canCreateFacilities = useMemo(() => {
    return permissions?.models?.Facility?.includes('add') ?? false;
  }, [permissions]);

  const canCreateCommunicationPosts = useMemo(() => {
    return permissions?.models?.CommunicationPost?.includes('add') ?? false;
  }, [permissions]);

  const canDeleteCommunicationPosts = useMemo(() => {
    return permissions?.models?.CommunicationPost?.includes('delete') ?? false;
  }, [permissions]);

  // Отложенная загрузка карты
  useEffect(() => {
    const timer = setTimeout(() => setShowMap(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Инициализация из URL параметров
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const viewFromUrl = searchParams.get('view');
    if (tabFromUrl === 'all' || tabFromUrl === 'open' || tabFromUrl === 'closed' || tabFromUrl === 'posts') {
      setActiveTab(tabFromUrl);
    }
    if (viewFromUrl === 'table' || viewFromUrl === 'grid') {
      setViewType(viewFromUrl);
    }
  }, [searchParams]);

  // Мемоизированная функция загрузки данных
  const fetchData = useCallback(async () => {
    if (!stableToken) return;

    try {
      setLoading(true);
      setError(null);

      if (isGlobalView) {
        // Глобальный режим – объекты всегда, посты только если есть права
        const allFacilities = await facilitiesApi.getFacilities({ token: stableToken });
        setFacilities(allFacilities);
        if (canViewCommunicationPosts) {
          const posts = await communicationPostsApi.getCommunicationPosts({ token: stableToken });
          setCommunicationPosts(posts);
        } else {
          setCommunicationPosts([]);
        }
        authApi.updateGlobalView(true);
      } else if (isExploitationUser) {
        // Режим для эксплуатационных пользователей
        authApi.updateGlobalView(false);

        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }

        const targetSubdivisionId = stableSubdivisionId || userSubdivisionId;

        const [allFacilities, div] = await Promise.all([
          facilitiesApi.getFacilities({ token: stableToken, division: userDivisionId }),
          divisionsApi.getDivisionById(userDivisionId, stableToken)
        ]);

        let posts: CommunicationPost[] = [];
        if (canViewCommunicationPosts) {
          posts = await communicationPostsApi.getCommunicationPosts({
            token: stableToken,
            division: userDivisionId,
            subdivision: targetSubdivisionId || undefined
          });
        }

        if (targetSubdivisionId) {
          const subdivision = div.subdivisions?.find(s => s.id.toString() === targetSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }

        setFacilities(allFacilities);
        setCommunicationPosts(posts);
        setDivision(div);
      } else {
        // Стандартный режим подразделения
        authApi.updateGlobalView(false);
        const [allFacilities, div] = await Promise.all([
          facilitiesApi.getFacilities({ token: stableToken, division: id }),
          divisionsApi.getDivisionById(id, stableToken)
        ]);

        let posts: CommunicationPost[] = [];
        if (canViewCommunicationPosts) {
          posts = await communicationPostsApi.getCommunicationPosts({
            token: stableToken,
            division: id,
            subdivision: stableSubdivisionId || undefined
          });
        }

        if (stableSubdivisionId) {
          const subdivision = div.subdivisions?.find(s => s.id.toString() === stableSubdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        } else {
          setSubdivisionName('');
        }

        setFacilities(allFacilities);
        setCommunicationPosts(posts);
        setDivision(div);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [stableToken, isGlobalView, isExploitationUser, userDivisionId, userSubdivisionId, id, stableSubdivisionId, canViewCommunicationPosts]);

  // Основной эффект загрузки данных
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Логика фильтрации для отделения
  const filterBySubdivision = useCallback((items: any[]) => {
    if (isExploitationUser && !id) return items;
    if (isGlobalView) return items;
    if (!stableSubdivisionId) return items;
    return items.filter(item =>
      item.subdivision?.id?.toString() === stableSubdivisionId.toString()
    );
  }, [isExploitationUser, id, isGlobalView, stableSubdivisionId]);

  // Фильтрация объектов и постов по отделению
  const filteredBySubdivisionFacilities = useMemo(() => filterBySubdivision(facilities), [facilities, filterBySubdivision]);
  const filteredBySubdivisionPosts = useMemo(() => filterBySubdivision(communicationPosts), [communicationPosts, filterBySubdivision]);

  const matchesSearchTerm = useCallback((facility: Facility, part: string) => {
    const normalizedAddress = normalizeSearchString(facility.address);
    const normalizedName = normalizeSearchString(facility.name);
    const facilityType = facility.type.name.toLowerCase().includes('станция') ? 'станция' : 'шд';
    return (
      normalizedAddress.includes(part) ||
      normalizedName.includes(part) ||
      facilityType.includes(part) ||
      (facility.facility_class && `${facility.facility_class} класс`.includes(part)) ||
      (facility.communication_posts?.some(post => normalizeSearchString(post.name).includes(part)))
    );
  }, []);

  const hasAllFacilities = useMemo(() => filteredBySubdivisionFacilities.length > 0, [filteredBySubdivisionFacilities]);
  const hasOpenFacilities = useMemo(() => filteredBySubdivisionFacilities.some(f => !f.is_closed), [filteredBySubdivisionFacilities]);
  const hasClosedFacilities = useMemo(() => filteredBySubdivisionFacilities.some(f => f.is_closed), [filteredBySubdivisionFacilities]);
  const hasCommunicationPosts = filteredBySubdivisionPosts.length > 0;

  const filteredFacilities = useMemo(() => {
    let result = filteredBySubdivisionFacilities;
    if (activeTab === 'open') result = result.filter(f => !f.is_closed);
    else if (activeTab === 'closed') result = result.filter(f => f.is_closed);
    if (filterType !== 'all') result = result.filter(f => f.type.id === filterType);
    if (facilityClassFilter !== 'all') result = result.filter(f => f.facility_class === facilityClassFilter);
    return result;
  }, [filteredBySubdivisionFacilities, activeTab, filterType, facilityClassFilter]);

  const displayFacilities = useMemo(() => {
    if (!debouncedSearchTerm) return filteredFacilities;
    const normalizedSearchTerm = normalizeSearchString(debouncedSearchTerm);
    const searchParts = normalizedSearchTerm.split(' ').filter(part => part.length > 0);
    if (!searchParts.length) return filteredFacilities;
    return filteredFacilities.filter(facility =>
      searchParts.some(part => matchesSearchTerm(facility, part))
    );
  }, [debouncedSearchTerm, filteredFacilities, matchesSearchTerm]);

  const mapFacilities = useMemo(() =>
    filteredBySubdivisionFacilities.filter(facility => {
      const matchesType = filterType === 'all' || facility.type.id === filterType;
      const matchesClass = facilityClassFilter === 'all' || facility.facility_class === facilityClassFilter;
      let matchesStatus = true;
      if (activeTab === 'open') matchesStatus = !facility.is_closed;
      else if (activeTab === 'closed') matchesStatus = facility.is_closed;
      return matchesType && matchesClass && matchesStatus;
    }),
    [filteredBySubdivisionFacilities, filterType, facilityClassFilter, activeTab]
  );

  const handleViewChange = useCallback((type: 'table' | 'grid') => {
    setViewType(type);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('view', type);
    navigate({ search: newSearchParams.toString() }, { replace: true });
  }, [searchParams, navigate]);

  const handleFacilityDeleted = useCallback((deletedId: string) => {
    setFacilities(prev => prev.filter(f => f.id !== deletedId));
  }, []);

  const handlePostDeleted = useCallback((deletedId: string) => {
    setCommunicationPosts(prev => prev.filter(p => p.id !== deletedId));
  }, []);

  const handleTabChange = useCallback((tab: 'all' | 'open' | 'closed' | 'posts') => {
    setActiveTab(tab);
    setMapSearchTerm('');
    if (tab !== 'posts' && activeTab !== 'posts') {
      setFilterType('all');
      setFacilityClassFilter('all');
    }
    const newSearchParams = new URLSearchParams();
    if (stableSubdivisionId) newSearchParams.set('subdivision', stableSubdivisionId);
    newSearchParams.set('tab', tab);
    if (tab !== 'posts') {
      if (filterType !== 'all') newSearchParams.set('type', filterType.toString());
      if (facilityClassFilter !== 'all') newSearchParams.set('class', facilityClassFilter);
    }
    if (viewType !== 'table') newSearchParams.set('view', viewType);
    navigate({ search: newSearchParams.toString() }, { replace: true });
  }, [searchParams, navigate, stableSubdivisionId, viewType, filterType, facilityClassFilter, activeTab]);

  const handleTypeChange = useCallback((type: 'all' | number) => {
    setFilterType(type);
    setMapSearchTerm('');
    const newSearchParams = new URLSearchParams(searchParams);
    if (type === 'all') newSearchParams.delete('type');
    else newSearchParams.set('type', type.toString());
    navigate({ search: newSearchParams.toString() }, { replace: true });
  }, [searchParams, navigate]);

  const handleClassChange = useCallback((classValue: 'all' | '1' | '2') => {
    setFacilityClassFilter(classValue);
    setMapSearchTerm('');
    const newSearchParams = new URLSearchParams(searchParams);
    if (classValue === 'all') newSearchParams.delete('class');
    else newSearchParams.set('class', classValue);
    navigate({ search: newSearchParams.toString() }, { replace: true });
  }, [searchParams, navigate]);

  const handleBack = useCallback(() => {
    if (isGlobalView) navigate('/');
    else if (stableSubdivisionId) navigate(`/divisions/${id}?subdivision=${stableSubdivisionId}`);
    else navigate(`/divisions/${id}`);
  }, [isGlobalView, navigate, id, stableSubdivisionId]);

  const handleAddFacility = useCallback(() => {
    const state = {
      from: 'facilities-section',
      divisionId: id,
      subdivisionId: stableSubdivisionId,
      activeTab: activeTab,
      fromSubdivision: !!stableSubdivisionId
    };
    if (isGlobalView || isExploitationUser) navigate(`/facilities/create`, { state });
    else navigate(`/divisions/${id}/facilities/new${stableSubdivisionId ? `?subdivision=${stableSubdivisionId}` : ''}`, { state });
  }, [isGlobalView, isExploitationUser, navigate, id, stableSubdivisionId, activeTab]);

  const handleAddPost = useCallback(() => {
    const state = {
      from: 'facilities-section',
      divisionId: id,
      subdivisionId: stableSubdivisionId,
      activeTab: activeTab,
      fromSubdivision: !!stableSubdivisionId
    };
    if (isGlobalView || isExploitationUser) navigate(`/communication-posts/new`, { state });
    else navigate(`/divisions/${id}/communication-posts/new${stableSubdivisionId ? `?subdivision=${stableSubdivisionId}` : ''}`, { state });
  }, [isGlobalView, isExploitationUser, navigate, id, stableSubdivisionId, activeTab]);

  const handleLocateFacility = useCallback((facility: Facility) => {
    setMapSearchTerm('');
    setTimeout(() => setMapSearchTerm(facility.name), 10);
    setTimeout(() => {
      const mapElement = document.querySelector('.facilities-map-overlay');
      if (mapElement) mapElement.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleDeleteInitiated = useCallback((id: string) => {
    setFacilityToDelete(id);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (facilityToDelete) {
      try {
        await facilitiesApi.deleteFacility(facilityToDelete);
        handleFacilityDeleted(facilityToDelete);
      } catch (error) {
        console.error('Ошибка при удалении объекта:', error);
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

  // Автоматическое переключение вкладок
  useEffect(() => {
    if (!loading) {
      const hasAnyData = hasAllFacilities || hasOpenFacilities || hasClosedFacilities || hasCommunicationPosts;
      if (!hasAnyData) return;
      if (activeTab === 'posts' && !hasCommunicationPosts) return;
      const currentTabHasData =
        (activeTab === 'all' && hasAllFacilities) ||
        (activeTab === 'open' && hasOpenFacilities) ||
        (activeTab === 'closed' && hasClosedFacilities) ||
        (activeTab === 'posts' && hasCommunicationPosts);
      if (!currentTabHasData) {
        let newTab = 'all';
        if (hasAllFacilities) newTab = 'all';
        else if (hasOpenFacilities) newTab = 'open';
        else if (hasClosedFacilities) newTab = 'closed';
        else if (hasCommunicationPosts) newTab = 'posts';
        setActiveTab(newTab);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('tab', newTab);
        navigate({ search: newSearchParams.toString() }, { replace: true });
      }
    }
  }, [loading, hasAllFacilities, hasOpenFacilities, hasClosedFacilities, hasCommunicationPosts, activeTab, searchParams, navigate]);

  const getHeaderTitle = () => {
    if (isExploitationUser && !id) {
      const divisionName = user?.division_info?.name || 'Ваше подразделение';
      return `Объекты: ${divisionName}`;
    }
    if (isGlobalView) return 'Объекты: Все подразделения';
    if (isChief && subdivisionName) return `Объекты: ${division?.name || ''} / ${subdivisionName}`;
    if (isExploitationUser) return `Объекты: ${division?.name || ''}`;
    return `Объекты: ${division?.name || ''}${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  };

  const handleSearchTermChange = useCallback((term: string) => setSearchTerm(term), []);

  if (loading) return <div className="flex justify-center py-12">Загрузка данных...</div>;
  if (error) return <div className="facilities-error-message">{error}</div>;

  return (
    <>
      <div className="facilities-container">
        <div className="facilities-header">
          <div className="facilities-title-container">
            {id && (
              <button type="button" onClick={handleBack} className="back-button">
                <ArrowLeft className="back-button-icon" />
              </button>
            )}
            <h2 className="facilities-title">{getHeaderTitle()}</h2>
          </div>

          <div className="facilities-add-buttons">
            {activeTab === 'posts' ? (
              canCreateCommunicationPosts && (
                <button onClick={handleAddPost} className="facilities-add-button">
                  <Plus size={18} />
                  <span>Добавить пост связи</span>
                </button>
              )
            ) : (
              canCreateFacilities && (
                <button onClick={handleAddFacility} className="facilities-add-button">
                  <Plus size={18} />
                  <span>Добавить объект</span>
                </button>
              )
            )}
          </div>
        </div>

        <div className="facilities-content-wrapper">
          <div className="facilities-tabs-container">
            <div className="facilities-tabs">
              {hasAllFacilities && (
                <button
                  className={`facilities-tab-button ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => handleTabChange('all')}
                >
                  {TAB_ICONS.all}
                  Все объекты
                </button>
              )}
              {hasOpenFacilities && (
                <button
                  className={`facilities-tab-button ${activeTab === 'open' ? 'active' : ''}`}
                  onClick={() => handleTabChange('open')}
                >
                  {TAB_ICONS.open}
                  Открытые объекты
                </button>
              )}
              {hasClosedFacilities && (
                <button
                  className={`facilities-tab-button ${activeTab === 'closed' ? 'active' : ''}`}
                  onClick={() => handleTabChange('closed')}
                >
                  {TAB_ICONS.closed}
                  Закрытые объекты
                </button>
              )}
              {canViewCommunicationPosts && (
                <button
                  className={`facilities-tab-button ${activeTab === 'posts' ? 'active' : ''}`}
                  onClick={() => handleTabChange('posts')}
                >
                  {TAB_ICONS.posts}
                  Посты связи
                </button>
              )}
            </div>
          </div>

          <div className="facilities-content">
            <div className="facilities-search-container">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={handleSearchTermChange}
                placeholder={
                  activeTab === 'posts'
                    ? "Поиск по названию поста связи..."
                    : "Поиск по названию, адресу, типу, классу или посту связи..."
                }
              />
            </div>

            {(activeTab === 'all' || activeTab === 'open' || activeTab === 'closed') && (
              <FacilityTypeFilter
                facilities={filteredBySubdivisionFacilities}
                selectedType={filterType}
                onTypeChange={handleTypeChange}
                selectedClass={facilityClassFilter}
                onClassChange={handleClassChange}
                activeTab={activeTab}
              />
            )}

            {activeTab === 'posts' ? (
              <CommunicationPostsList
                posts={filteredBySubdivisionPosts}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={fetchData}
                isGlobalView={isGlobalView}
                searchTerm={debouncedSearchTerm}
                canDeletePosts={canDeleteCommunicationPosts}
              />
            ) : (
              <FacilityList
                viewType={viewType}
                onViewChange={handleViewChange}
                facilities={displayFacilities}
                onSelectFacility={(facility) => navigate(`/facilities/${facility.id}`)}
                onLocateFacility={handleLocateFacility}
                showDifferentFields={true}
                onFacilityDeleted={handleFacilityDeleted}
                onDeleteInitiated={handleDeleteInitiated}
                divisionId={id}
                subdivisionId={stableSubdivisionId}
                activeTab={activeTab}
                filterType={filterType}
                facilityClassFilter={facilityClassFilter}
              />
            )}
          </div>
        </div>
      </div>

      {showMap && displayFacilities.length > 0 && activeTab !== 'posts' && (
        <div className="facilities-map-overlay">
          <Suspense fallback={<div className="loading-spinner"></div>}>
            <LazyMapView facilities={mapFacilities} searchTerm={mapSearchTerm} />
          </Suspense>
        </div>
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление объекта"
          message="Вы уверены, что хотите удалить этот объект? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
}