import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { facilitiesApi, communicationPostsApi } from '../../../../api';
import { FacilityList } from '../../../facilities/FacilityList';
import { CommunicationPostsList } from './CommunicationPosts/CommunicationPostsList';
import { SearchBar } from '../../../common/SearchBar';
import { FacilityTypeFilter } from '../../../facilities/FacilityTypeFilter';
import { divisionsApi } from '../../../../api';
import { Facility, CommunicationPost } from '../../../../types';
import './style.css';
import MapView from '../../../map/MapView';

export function FacilitiesSection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');
  const token = localStorage.getItem('accessToken');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | number>('all');
  const [facilityClassFilter, setFacilityClassFilter] = useState<'all' | '1' | '2'>('all');
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'posts'>('open');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [communicationPosts, setCommunicationPosts] = useState<CommunicationPost[]>([]);
  const [division, setDivision] = useState(null);
  const [subdivisionName, setSubdivisionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'table' | 'grid'>(() => {
    const viewFromUrl = searchParams.get('view');
    return viewFromUrl === 'table' ? 'table' : 'grid';
  });

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const viewFromUrl = searchParams.get('view');

    if (tabFromUrl === 'open' || tabFromUrl === 'closed' || tabFromUrl === 'posts') {
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

  const matchesSubdivision = (facility: Facility) => {
    if (!subdivisionId) return true;
    const facilitySubdivision = facility.subdivision?.toString() || '';
    const targetSubdivision = subdivisionId.toString();
    return facilitySubdivision === targetSubdivision;
  };

  const hasOpenFacilities = facilities.some(f => !f.is_closed && matchesSubdivision(f));
  const hasClosedFacilities = facilities.some(f => f.is_closed && matchesSubdivision(f));
  const hasCommunicationPosts = communicationPosts.length > 0;
  const addCommunicationPosts = communicationPosts.length === 0;

  useEffect(() => {
    if (!loading) {
      const currentTabHasData =
        (activeTab === 'open' && hasOpenFacilities) ||
        (activeTab === 'closed' && hasClosedFacilities) ||
        (activeTab === 'posts' && hasCommunicationPosts);

      if (!currentTabHasData) {
        let newTab = 'open';
        if (hasOpenFacilities) newTab = 'open';
        else if (hasClosedFacilities) newTab = 'closed';
        else if (hasCommunicationPosts) newTab = 'posts';

        setActiveTab(newTab);
        searchParams.set('tab', newTab);
        setSearchParams(searchParams);
      }
    }
  }, [loading, hasOpenFacilities, hasClosedFacilities, hasCommunicationPosts, activeTab, searchParams, setSearchParams]);

  const handleTabChange = (tab: 'open' | 'closed' | 'posts') => {
    setActiveTab(tab);
    setFilterType('all');
    setFacilityClassFilter('all');
    searchParams.set('tab', tab);
    setSearchParams(searchParams);
  };

  const handleFacilityDeleted = (deletedId: string) => {
    setFacilities(prev => prev.filter(f => f.id !== deletedId));
  };

  const handlePostDeleted = (deletedId: string) => {
    setCommunicationPosts(prev => prev.filter(p => p.id !== deletedId));
  };

  const filteredFacilities = facilities.filter(facility => {
    if (!matchesSubdivision(facility)) return false;

    const isOpenTab = activeTab === 'open';
    const matchesStatus = isOpenTab ? !facility.is_closed : facility.is_closed;

    const matchesSearch = !searchTerm ||
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (facility.type === 'station' ? 'станция' : 'шд').includes(searchTerm.toLowerCase()) ||
      (facility.facility_class && `${facility.facility_class} класс`.includes(searchTerm.toLowerCase())) ||
      (facility.communication_posts && facility.communication_posts.some(post =>
        post.name.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesType = isOpenTab ? true :
      filterType === 'all' || facility.type.id === filterType;
    const matchesClass = isOpenTab ? true :
      facilityClassFilter === 'all' || facility.facility_class === facilityClassFilter;

    return matchesStatus && matchesSearch && matchesType && matchesClass;
  });

  const onBack = () => {
    navigate(`/divisions/${id}`);
  };

  if (loading) {
    return <div>Загрузка данных...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const handleAddFacility = () => {
    navigate(`/divisions/${id}/facilities/new`);
  };

  const handleAddPost = () => {
    navigate(`/divisions/${id}/communication-posts/new${subdivisionId ? `?subdivision=${subdivisionId}` : ''}`);
  };

  return (
    <>
    <div className="section-container">
      <h2 className="section-title">
        <button type="button" onClick={onBack} className="back-button">
          <ArrowLeft className="back-button-icon" />
        </button>
        Объекты: {division?.name ? ` ${division?.name}` : ''} {subdivisionName ? ` / ${subdivisionName}` : ''}
      </h2>

      <div className='block-add-facility-button'>
        {activeTab === 'posts' ? (
          <button
            onClick={handleAddPost}
            className="add-facility-button"
          >
            <Plus size={18} />
            <span>Добавить пост связи</span>
          </button>
        ) : (
          <button
            onClick={handleAddFacility}
            className="add-facility-button"
          >
            <Plus size={18} />
            <span>Добавить объект</span>
          </button>
        )}
        {addCommunicationPosts &&
          <button
            onClick={handleAddPost}
            className="add-facility-button"
          >
            <Plus size={18} />
            <span>Добавить пост связи</span>
          </button>}
      </div>

      <div className="tabs">
        {hasOpenFacilities && (
          <button
            className={`tab-button-facilities ${activeTab === 'open' ? 'active' : ''}`}
            onClick={() => handleTabChange('open')}
          >
            Открытые объекты
          </button>
        )}
        {hasClosedFacilities && (
          <button
            className={`tab-button-facilities ${activeTab === 'closed' ? 'active' : ''}`}
            onClick={() => handleTabChange('closed')}
          >
            Закрытые объекты
          </button>
        )}
        {hasCommunicationPosts && (
          <button
            className={`tab-button-facilities ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => handleTabChange('posts')}
          >
            Посты связи
          </button>
        )}
      </div>

      <div className="section-search-container">
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

      {activeTab === 'closed' && hasClosedFacilities && (
        <FacilityTypeFilter
          facilities={facilities.filter(f => f.is_closed && matchesSubdivision(f))}
          selectedType={filterType}
          onTypeChange={setFilterType}
          selectedClass={facilityClassFilter}
          onClassChange={setFacilityClassFilter}
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
          facilities={filteredFacilities}
          onSelectFacility={(facility) => navigate(`/facilities/${facility.id}`)}
          showDifferentFields={true}
          onFacilityDeleted={handleFacilityDeleted}
        />
      )}
     
    </div>
    {division.facilities_count > 0 && (
          <div className="division-map-overlay">
            <MapView divisionId={division.id} />
          </div>
        )}
    </>
  );
}