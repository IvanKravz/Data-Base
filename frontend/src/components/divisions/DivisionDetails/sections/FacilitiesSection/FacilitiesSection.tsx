import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { isExploitationChief, isExploitationEmployee, getCurrentUser } from '../../../../../api/utils/permissions';

// Ленивая загрузка карты
const LazyMapView = lazy(() => import('../../../../map/MapView'));

const TAB_ICONS = {
  'all': <Map className="facilities-tab-icon" size={16} />,
  'open': <FolderOpen className="facilities-tab-icon" size={16} />,
  'closed': <FolderClosed className="facilities-tab-icon" size={16} />,
  'posts': <SatelliteDish className="facilities-tab-icon" size={16} />
};

export function FacilitiesSection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');
  const token = localStorage.getItem('accessToken');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | number>('all');
  const [facilityClassFilter, setFacilityClassFilter] = useState<'all' | '1' | '2'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed' | 'posts'>('all');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [communicationPosts, setCommunicationPosts] = useState<CommunicationPost[]>([]);
  const [division, setDivision] = useState(null);
  const [subdivisionName, setSubdivisionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'table' | 'grid'>(() => {
    const viewFromUrl = searchParams.get('view');
    return viewFromUrl === 'grid' ? 'grid' : 'table';
  });
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [mapSearchTerm, setMapSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Получаем данные текущего пользователя
  const currentUser = getCurrentUser();

  // Определяем тип пользователя
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

  // Отложенная загрузка карты
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMap(true);
    }, 500);

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
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      if (isGlobalView) {
        // Глобальный режим - загружаем все объекты и посты связи
        const [allFacilities, posts] = await Promise.all([
          facilitiesApi.getFacilities({ token }),
          communicationPostsApi.getCommunicationPosts({ token })
        ]);
        setFacilities(allFacilities);
        setCommunicationPosts(posts);
        authApi.updateGlobalView(true);
      } else if (isExploitationUser) {
        // Режим для эксплуатационных пользователей
        authApi.updateGlobalView(false);

        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }

        const [allFacilities, posts, div] = await Promise.all([
          facilitiesApi.getFacilities({ token, division: userDivisionId }),
          communicationPostsApi.getCommunicationPosts({
            token,
            division: userDivisionId,
            subdivision: urlSubdivisionId || userSubdivisionId || undefined
          }),
          divisionsApi.getDivisionById(userDivisionId, token)
        ]);

        // Определяем какое отделение использовать: из URL или из данных пользователя
        const targetSubdivisionId = urlSubdivisionId || userSubdivisionId;

        // Устанавливаем название отделения если есть
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
        const [allFacilities, posts, div] = await Promise.all([
          facilitiesApi.getFacilities({ token, division: id }),
          communicationPostsApi.getCommunicationPosts({
            token,
            division: id,
            subdivision: subdivisionId || undefined
          }),
          divisionsApi.getDivisionById(id, token)
        ]);

        if (subdivisionId) {
          const subdivision = div.subdivisions?.find(s => s.id.toString() === subdivisionId.toString());
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
  }, [token, isGlobalView, isExploitationUser, userDivisionId, userSubdivisionId, id, subdivisionId, urlSubdivisionId]);

  // Основной эффект загрузки данных
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Мемоизированные функции фильтрации
  const matchesSubdivision = useCallback((facility: Facility) => {
    if (isGlobalView) return true;

    if (isExploitationUser) {
      // Для эксплуатационных пользователей используем subdivision из URL или пользовательский
      const targetSubdivisionId = urlSubdivisionId || userSubdivisionId;
      if (targetSubdivisionId) {
        const facilitySubdivision = facility.subdivision?.toString() || '';
        const targetSubdivision = targetSubdivisionId.toString();
        return facilitySubdivision === targetSubdivision;
      }
      // Для начальника без subdivision в URL не фильтруем по отделению (показывает все отделения)
      return true;
    }

    // Стандартная логика для обычных пользователей
    if (!subdivisionId) return true;
    const facilitySubdivision = facility.subdivision?.toString() || '';
    const targetSubdivision = subdivisionId.toString();
    return facilitySubdivision === targetSubdivision;
  }, [isGlobalView, isExploitationUser, userSubdivisionId, subdivisionId, urlSubdivisionId]);

  const matchesSearchTerm = useCallback((facility: Facility, part: string) => {
    const normalizedAddress = normalizeSearchString(facility.address);
    const normalizedName = normalizeSearchString(facility.name);
    const facilityType = facility.type.name.toLowerCase().includes('станция') ? 'станция' : 'шд';

    return (
      normalizedAddress.includes(part) ||
      normalizedName.includes(part) ||
      facilityType.includes(part) ||
      (facility.facility_class && `${facility.facility_class} класс`.includes(part)) ||
      (facility.communication_posts?.some(post =>
        normalizeSearchString(post.name).includes(part)
      ))
    );
  }, []);

  // Мемоизированные данные для отображения
  const hasAllFacilities = useMemo(() =>
    facilities.some(f => matchesSubdivision(f)),
    [facilities, matchesSubdivision]
  );

  const hasOpenFacilities = useMemo(() =>
    facilities.some(f => !f.is_closed && matchesSubdivision(f)),
    [facilities, matchesSubdivision]
  );

  const hasClosedFacilities = useMemo(() =>
    facilities.some(f => f.is_closed && matchesSubdivision(f)),
    [facilities, matchesSubdivision]
  );

  const hasCommunicationPosts = communicationPosts.length > 0;

  // Фильтрация facilities для списка
  const filteredFacilities = useMemo(() =>
    facilities.filter(facility => {
      if (!matchesSubdivision(facility)) return false;

      const matchesType = filterType === 'all' || facility.type.id === filterType;
      const matchesClass = facilityClassFilter === 'all' || facility.facility_class === facilityClassFilter;

      if (activeTab === 'all') {
        return matchesType && matchesClass;
      }

      const isOpenTab = activeTab === 'open';
      const matchesStatus = isOpenTab ? !facility.is_closed : facility.is_closed;

      return matchesStatus && matchesType && matchesClass;
    }),
    [facilities, matchesSubdivision, filterType, facilityClassFilter, activeTab]
  );

  // Facilities для отображения с поиском
  const displayFacilities = useMemo(() => {
    if (!debouncedSearchTerm) return filteredFacilities;

    const normalizedSearchTerm = normalizeSearchString(debouncedSearchTerm);
    const searchParts = normalizedSearchTerm.split(' ').filter(part => part.length > 0);

    if (searchParts.length === 0) return filteredFacilities;

    return filteredFacilities.filter(facility =>
      searchParts.some(part => matchesSearchTerm(facility, part))
    );
  }, [debouncedSearchTerm, filteredFacilities, matchesSearchTerm]);

  // Facilities для карты
  const mapFacilities = useMemo(() =>
    facilities.filter(facility => {
      if (!matchesSubdivision(facility)) return false;

      const matchesType = filterType === 'all' || facility.type.id === filterType;
      const matchesClass = facilityClassFilter === 'all' || facility.facility_class === facilityClassFilter;

      let matchesStatus = true;
      if (activeTab === 'open') {
        matchesStatus = !facility.is_closed;
      } else if (activeTab === 'closed') {
        matchesStatus = facility.is_closed;
      }

      return matchesType && matchesClass && matchesStatus;
    }),
    [facilities, matchesSubdivision, filterType, facilityClassFilter, activeTab]
  );

  // Обработчики с useCallback
  const handleViewChange = useCallback((type: 'table' | 'grid') => {
    setViewType(type);
    searchParams.set('view', type);
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const handleFacilityDeleted = useCallback((deletedId: string) => {
    setFacilities(prev => prev.filter(f => f.id !== deletedId));
  }, []);

  const handlePostDeleted = useCallback((deletedId: string) => {
    setCommunicationPosts(prev => prev.filter(p => p.id !== deletedId));
  }, []);

  const handleTabChange = useCallback((tab: 'all' | 'open' | 'closed' | 'posts') => {
    setActiveTab(tab);
    setFilterType('all');
    setFacilityClassFilter('all');
    setMapSearchTerm('');
    searchParams.set('tab', tab);
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const handleTypeChange = useCallback((type: 'all' | number) => {
    setFilterType(type);
    setMapSearchTerm('');
  }, []);

  const handleClassChange = useCallback((classValue: 'all' | '1' | '2') => {
    setFacilityClassFilter(classValue);
    setMapSearchTerm('');
  }, []);

  const handleBack = useCallback(() => {
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

  const handleAddFacility = useCallback(() => {
    if (isGlobalView || isExploitationUser) {
      navigate(`/facilities/new`, {
        state: {
          divisionId: isExploitationUser ? userDivisionId : undefined,
          subdivisionId: isExploitationUser ? (urlSubdivisionId || userSubdivisionId) : undefined
        }
      });
    } else {
      navigate(`/divisions/${id}/facilities/new${subdivisionId ? `?subdivision=${subdivisionId}` : ''}`);
    }
  }, [isGlobalView, isExploitationUser, navigate, userDivisionId, userSubdivisionId, id, subdivisionId, urlSubdivisionId]);

  const handleAddPost = useCallback(() => {
    if (isGlobalView || isExploitationUser) {
      navigate(`/communication-posts/new`, {
        state: {
          divisionId: isExploitationUser ? userDivisionId : undefined,
          subdivisionId: isExploitationUser ? (urlSubdivisionId || userSubdivisionId) : undefined
        }
      });
    } else {
      navigate(`/divisions/${id}/communication-posts/new${subdivisionId ? `?subdivision=${subdivisionId}` : ''}`);
    }
  }, [isGlobalView, isExploitationUser, navigate, userDivisionId, userSubdivisionId, id, subdivisionId, urlSubdivisionId]);

  const handleLocateFacility = useCallback((facility: Facility) => {
    setMapSearchTerm('');
    setTimeout(() => {
      setMapSearchTerm(facility.name);
    }, 10);

    setTimeout(() => {
      const mapElement = document.querySelector('.facilities-map-overlay');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth' });
      }
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

  // Автоматическое переключение вкладок при отсутствии данных
  useEffect(() => {
    if (!loading) {
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
        searchParams.set('tab', newTab);
        setSearchParams(searchParams);
      }
    }
  }, [loading, hasAllFacilities, hasOpenFacilities, hasClosedFacilities, hasCommunicationPosts, activeTab, searchParams, setSearchParams]);

  const getHeaderTitle = useCallback(() => {
    if (isGlobalView) {
      return 'Объекты: Все подразделения';
    }

    if (isExploitationUser) {
      const divisionName = currentUser?.division_info?.name || 'Ваше подразделение';
      // Для эксплуатационных пользователей учитываем subdivision из URL
      if (urlSubdivisionId) {
        return `Объекты: ${divisionName}${subdivisionName ? ` / ${subdivisionName}` : ''}`;
      } else if (isChief) {
        return `Объекты: ${divisionName}`;
      } else {
        const userSubdivisionName = currentUser?.division_info?.subdivision?.name || '';
        return `Объекты: ${divisionName}${userSubdivisionName ? ` / ${userSubdivisionName}` : ''}`;
      }
    }

    return `Объекты: ${division?.name || ''} ${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  }, [isGlobalView, isExploitationUser, isChief, currentUser, division, subdivisionName, urlSubdivisionId]);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="facilities-error-message">{error}</div>;
  }

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
            <h2 className="facilities-title">
              {getHeaderTitle()}
            </h2>
          </div>

          <div className="facilities-add-buttons">
            {activeTab === 'posts' ? (
              <button
                onClick={handleAddPost}
                className="facilities-add-button"
              >
                <Plus size={18} />
                <span>Добавить пост связи</span>
              </button>
            ) : (
              <button
                onClick={handleAddFacility}
                className="facilities-add-button"
              >
                <Plus size={18} />
                <span>Добавить объект</span>
              </button>
            )}
            {communicationPosts.length === 0 && (
              <button
                onClick={handleAddPost}
                className="facilities-add-button"
              >
                <Plus size={18} />
                <span>Добавить пост связи</span>
              </button>
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
              {hasCommunicationPosts && (
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
                facilities={facilities.filter(f =>
                  (activeTab === 'all' ? true : (activeTab === 'open' ? !f.is_closed : f.is_closed)) &&
                  matchesSubdivision(f)
                )}
                selectedType={filterType}
                onTypeChange={handleTypeChange}
                selectedClass={facilityClassFilter}
                onClassChange={handleClassChange}
              />
            )}

            {activeTab === 'posts' ? (
              <CommunicationPostsList
                posts={communicationPosts}
                onPostDeleted={handlePostDeleted}
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
              />
            )}
          </div>
        </div>
      </div>

      {showMap && facilities.length > 0 && activeTab !== 'posts' && (
        <div className="facilities-map-overlay">
          <Suspense fallback={<div className="loading-spinner">Загрузка карты...</div>}>
            <LazyMapView
              facilities={mapFacilities}
              searchTerm={mapSearchTerm}
            />
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