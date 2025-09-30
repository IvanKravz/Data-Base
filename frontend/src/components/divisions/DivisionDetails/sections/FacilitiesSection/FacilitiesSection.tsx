import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  FolderOpen,
  FolderClosed,
  SatelliteDish,
  Map
} from 'lucide-react';
import { facilitiesApi, communicationPostsApi } from '../../../../../api';
import { FacilityList } from '../../../../facilities/FacilityList';
import { CommunicationPostsList } from '../CommunicationPosts/CommunicationPostsList';
import { SearchBar } from '../../../../common/SearchBar';
import { FacilityTypeFilter } from '../../../../facilities/FacilityTypeFilter';
import { divisionsApi } from '../../../../../api';
import { Facility, CommunicationPost } from '../../../../../types';
import './FacilitiesSection.css';
import MapView from '../../../../map/MapView';
import { normalizeSearchString } from '../../../../../utils/normalizeSearchString';
import { useDebounce } from '../../../../../utils/useDebounce';
import { DeleteConfirmationModal } from '../../../../modals/DeleteConfirmationModal';

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

  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

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

  useEffect(() => {
    const updateIndicator = () => {
      if (!tabsRef.current || !indicatorRef.current) return;

      const activeTabElement = tabsRef.current.querySelector('.facilities-tab-button.active') as HTMLElement;
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
    const tabFromUrl = searchParams.get('tab');
    const viewFromUrl = searchParams.get('view');

    if (tabFromUrl === 'all' || tabFromUrl === 'open' || tabFromUrl === 'closed' || tabFromUrl === 'posts') {
      setActiveTab(tabFromUrl);
    }

    if (viewFromUrl === 'table' || viewFromUrl === 'grid') {
      setViewType(viewFromUrl);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const allFacilities = await facilitiesApi.getFacilities({
          token,
          division: id,
        });
        const posts = await communicationPostsApi.getCommunicationPosts({
          token,
          division: id,
          subdivision: subdivisionId || undefined
        });
        const div = await divisionsApi.getDivisionById(id, token);

        if (subdivisionId) {
          const subdivision = div.subdivisions?.find(s => s.id.toString() === subdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        }

        setFacilities(allFacilities);
        setCommunicationPosts(posts);
        setDivision(div);
      } catch (err) {
        setError('Не удалось загрузить данные');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, subdivisionId]);

  const handleViewChange = (type: 'table' | 'grid') => {
    setViewType(type);
    searchParams.set('view', type);
    setSearchParams(searchParams);
  };

  const handleFacilityDeleted = (deletedId: string) => {
    setFacilities(prev => prev.filter(f => f.id !== deletedId));
  };

  const handlePostDeleted = (deletedId: string) => {
    setCommunicationPosts(prev => prev.filter(p => p.id !== deletedId));
  };

  const matchesSubdivision = (facility: Facility) => {
    if (!subdivisionId) return true;
    const facilitySubdivision = facility.subdivision?.toString() || '';
    const targetSubdivision = subdivisionId.toString();
    return facilitySubdivision === targetSubdivision;
  };

  const hasAllFacilities = facilities.some(f => matchesSubdivision(f));
  const hasOpenFacilities = facilities.some(f => !f.is_closed && matchesSubdivision(f));
  const hasClosedFacilities = facilities.some(f => f.is_closed && matchesSubdivision(f));
  const hasCommunicationPosts = communicationPosts.length > 0;

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

  const handleTabChange = (tab: 'all' | 'open' | 'closed' | 'posts') => {
    setActiveTab(tab);
    setFilterType('all');
    setFacilityClassFilter('all');
    setMapSearchTerm('');
    searchParams.set('tab', tab);
    setSearchParams(searchParams);

    setTimeout(() => {
      const activeTabElement = document.querySelector('.facilities-tab-button.active');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 10);
  };

  const handleTypeChange = (type: 'all' | number) => {
    setFilterType(type);
    setMapSearchTerm('');
  };

  const handleClassChange = (classValue: 'all' | '1' | '2') => {
    setFacilityClassFilter(classValue);
    setMapSearchTerm('');
  };

  const filteredFacilities = facilities.filter(facility => {
    if (!matchesSubdivision(facility)) return false;

    const matchesType = filterType === 'all' || facility.type.id === filterType;
    const matchesClass = facilityClassFilter === 'all' || facility.facility_class === facilityClassFilter;

    if (activeTab === 'all') {
      return matchesType && matchesClass;
    }

    const isOpenTab = activeTab === 'open';
    const matchesStatus = isOpenTab ? !facility.is_closed : facility.is_closed;

    return matchesStatus && matchesType && matchesClass;
  });

  const matchesSearchTerm = (facility: Facility, part: string) => {
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
  };

  const displayFacilities = debouncedSearchTerm
    ? filteredFacilities.filter(facility => {
      const normalizedSearchTerm = normalizeSearchString(searchTerm);
      const searchParts = normalizedSearchTerm.split(' ').filter(part => part.length > 0);
      return searchParts.length === 0 || searchParts.some(part => matchesSearchTerm(facility, part));
    })
    : filteredFacilities;

  const onBack = () => {
    navigate(`/divisions/${id}`);
  };

  if (loading) {
    return <div className="flex justify-center py-12">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="facilities-error-message">{error}</div>;
  }

  const handleAddFacility = () => {
    navigate(`/divisions/${id}/facilities/new`);
  };

  const handleAddPost = () => {
    navigate(`/divisions/${id}/communication-posts/new${subdivisionId ? `?subdivision=${subdivisionId}` : ''}`);
  };

  const handleLocateFacility = (facility: Facility) => {
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
  };

  const getMapFacilities = () => {
    let filtered = facilities.filter(facility => {
      if (!matchesSubdivision(facility)) return false;
      
      // Фильтрация по типу
      const matchesType = filterType === 'all' || facility.type.id === filterType;
      
      // Фильтрация по классу
      const matchesClass = facilityClassFilter === 'all' || facility.facility_class === facilityClassFilter;
      
      // Фильтрация по статусу (вкладке)
      let matchesStatus = true;
      if (activeTab === 'open') {
        matchesStatus = !facility.is_closed;
      } else if (activeTab === 'closed') {
        matchesStatus = facility.is_closed;
      }
      
      return matchesType && matchesClass && matchesStatus;
    });
    
    return filtered;
  };

  const handleDeleteInitiated = (id: string) => {
    setFacilityToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
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
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFacilityToDelete(null);
  };

  return (
    <>
      <div className="facilities-container">
        <div className="facilities-header">
          <div className="flex items-center">
            <button type="button" onClick={onBack} className="back-button">
              <ArrowLeft className="back-button-icon" />
            </button>
            <h2 className="facilities-title">
              Объекты: {division?.name ? ` ${division?.name}` : ''} {subdivisionName ? ` / ${subdivisionName}` : ''}
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
            <div
              className="facilities-tabs"
              ref={tabsRef}
            >
              <div
                className="facilities-tab-indicator"
                ref={indicatorRef}
                style={{
                  ...indicatorStyle,
                  transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
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
                setSearchTerm={setSearchTerm}
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

      {division?.facilities_count > 0 && activeTab !== 'posts' && (
        <div className="facilities-map-overlay">
          <MapView
            facilities={getMapFacilities()}
            searchTerm={mapSearchTerm}
          />
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