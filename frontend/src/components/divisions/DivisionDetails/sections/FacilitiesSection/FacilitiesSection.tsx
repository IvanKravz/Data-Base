// FacilitiesSection.tsx
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
import { isExploitationChief, isExploitationEmployee, getCurrentUser, getPermissions } from '../../../../../api/utils/permissions';

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
  const [searchParams] = useSearchParams();
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

  // Стабилизированные значения
  const stableToken = useMemo(() => token, [token]);
  const stableSubdivisionId = useMemo(() => searchParams.get('subdivision'), [searchParams]);
  const stableCurrentUser = useMemo(() => currentUser, [JSON.stringify(currentUser)]);

  // Определяем тип пользователя
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
    if (!stableToken) return;

    try {
      setLoading(true);
      setError(null);

      if (isGlobalView) {
        // Глобальный режим - загружаем все объекты и посты связи
        const [allFacilities, posts] = await Promise.all([
          facilitiesApi.getFacilities({ token: stableToken }),
          communicationPostsApi.getCommunicationPosts({ token: stableToken })
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

        const targetSubdivisionId = stableSubdivisionId || userSubdivisionId;

        const [allFacilities, posts, div] = await Promise.all([
          facilitiesApi.getFacilities({ token: stableToken, division: userDivisionId }),
          communicationPostsApi.getCommunicationPosts({
            token: stableToken,
            division: userDivisionId,
            subdivision: targetSubdivisionId || undefined
          }),
          divisionsApi.getDivisionById(userDivisionId, stableToken)
        ]);

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
          facilitiesApi.getFacilities({ token: stableToken, division: id }),
          communicationPostsApi.getCommunicationPosts({
            token: stableToken,
            division: id,
            subdivision: stableSubdivisionId || undefined
          }),
          divisionsApi.getDivisionById(id, stableToken)
        ]);

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
  }, [stableToken, isGlobalView, isExploitationUser, userDivisionId, userSubdivisionId, id, stableSubdivisionId]);

  // Основной эффект загрузки данных
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Логика фильтрации для отделения
  const filterBySubdivision = useCallback((items: any[]) => {
    // Для сотрудника эксплуатации не фильтруем по отделению - показываем все объекты подразделения
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

  // Фильтрация объектов по отделению
  const filteredBySubdivisionFacilities = useMemo(() => {
    return filterBySubdivision(facilities);
  }, [facilities, filterBySubdivision]);

  // Фильтрация постов связи по отделению
  const filteredBySubdivisionPosts = useMemo(() => {
    return filterBySubdivision(communicationPosts);
  }, [communicationPosts, filterBySubdivision]);

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
    filteredBySubdivisionFacilities.length > 0,
    [filteredBySubdivisionFacilities]
  );

  const hasOpenFacilities = useMemo(() =>
    filteredBySubdivisionFacilities.some(f => !f.is_closed),
    [filteredBySubdivisionFacilities]
  );

  const hasClosedFacilities = useMemo(() =>
    filteredBySubdivisionFacilities.some(f => f.is_closed),
    [filteredBySubdivisionFacilities]
  );

  const hasCommunicationPosts = filteredBySubdivisionPosts.length > 0;

  // Фильтрация facilities для списка
  const filteredFacilities = useMemo(() =>
    filteredBySubdivisionFacilities.filter(facility => {
      const matchesType = filterType === 'all' || facility.type.id === filterType;
      const matchesClass = facilityClassFilter === 'all' || facility.facility_class === facilityClassFilter;

      if (activeTab === 'all') {
        return matchesType && matchesClass;
      }

      const isOpenTab = activeTab === 'open';
      const matchesStatus = isOpenTab ? !facility.is_closed : facility.is_closed;

      return matchesStatus && matchesType && matchesClass;
    }),
    [filteredBySubdivisionFacilities, filterType, facilityClassFilter, activeTab]
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
    filteredBySubdivisionFacilities.filter(facility => {
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
    [filteredBySubdivisionFacilities, filterType, facilityClassFilter, activeTab]
  );

  // Обработчики с useCallback
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
    setFilterType('all');
    setFacilityClassFilter('all');
    setMapSearchTerm('');
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    navigate({ search: newSearchParams.toString() }, { replace: true });
  }, [searchParams, navigate]);

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
      if (stableSubdivisionId) {
        navigate(`/divisions/${id}?subdivision=${stableSubdivisionId}`);
      } else {
        navigate(`/divisions/${id}`);
      }
    }
  }, [isGlobalView, navigate, id, stableSubdivisionId]);

  const handleAddFacility = useCallback(() => {
    if (isGlobalView || isExploitationUser) {
      navigate(`/facilities/new`, {
        state: {
          divisionId: isExploitationUser ? userDivisionId : undefined,
          subdivisionId: isExploitationUser ? (stableSubdivisionId || userSubdivisionId) : undefined
        }
      });
    } else {
      navigate(`/divisions/${id}/facilities/new${stableSubdivisionId ? `?subdivision=${stableSubdivisionId}` : ''}`);
    }
  }, [isGlobalView, isExploitationUser, navigate, userDivisionId, userSubdivisionId, id, stableSubdivisionId]);

  const handleAddPost = useCallback(() => {
    if (isGlobalView || isExploitationUser) {
      navigate(`/communication-posts/new`, {
        state: {
          divisionId: isExploitationUser ? userDivisionId : undefined,
          subdivisionId: isExploitationUser ? (stableSubdivisionId || userSubdivisionId) : undefined
        }
      });
    } else {
      navigate(`/divisions/${id}/communication-posts/new${stableSubdivisionId ? `?subdivision=${stableSubdivisionId}` : ''}`);
    }
  }, [isGlobalView, isExploitationUser, navigate, userDivisionId, userSubdivisionId, id, stableSubdivisionId]);

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
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('tab', newTab);
        navigate({ search: newSearchParams.toString() }, { replace: true });
      }
    }
  }, [loading, hasAllFacilities, hasOpenFacilities, hasClosedFacilities, hasCommunicationPosts, activeTab, searchParams, navigate]);

  const getHeaderTitle = () => {
    if (isExploitationUser && !id) {
      const divisionName = stableCurrentUser?.division_info?.name || 'Ваше подразделение';
      return `Объекты: ${divisionName}`;
    }
  
    if (isGlobalView) {
      return 'Объекты: Все подразделения';
    }
  
    // Для начальника эксплуатации показываем и подразделение, и отделение (если есть)
    if (isChief && subdivisionName) {
      return `Объекты: ${division?.name || ''} / ${subdivisionName}`;
    }
    
    // Для сотрудника эксплуатации или начальника без отделения показываем только подразделение
    if (isExploitationUser) {
      return `Объекты: ${division?.name || ''}`;
    }
    
    // Для обычных пользователей
    return `Объекты: ${division?.name || ''}${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  };

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Проверка прав доступа для кнопки "Добавить объект"
  const canCreateFacilities = useMemo(() => {
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

          {canCreateFacilities && (<div className="facilities-add-buttons">
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
          </div>
          )}
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
                facilities={filteredBySubdivisionFacilities.filter(f =>
                  (activeTab === 'all' ? true : (activeTab === 'open' ? !f.is_closed : f.is_closed))
                )}
                selectedType={filterType}
                onTypeChange={handleTypeChange}
                selectedClass={facilityClassFilter}
                onClassChange={handleClassChange}
              />
            )}

            {activeTab === 'posts' ? (
              <CommunicationPostsList
                posts={filteredBySubdivisionPosts}
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