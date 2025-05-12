import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { facilitiesApi } from '../../../../api';
import { FacilityList } from '../../../facilities/FacilityList';
import { SearchBar } from '../../../common/SearchBar';
import { FacilityTypeFilter } from '../../../facilities/FacilityTypeFilter';
import './style.css';

export function FacilitiesSection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'station' | 'shd'>('all');
  const [facilityClassFilter, setFacilityClassFilter] = useState<'all' | '1' | '2'>('all');
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const allFacilities = await facilitiesApi.getFacilities({
          token,
          division: id,
        });
        setFacilities(allFacilities);
      } catch (err) {
        setError('Не удалось загрузить данные об объектах');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [id, token]);

  // Сброс фильтров при переключении вкладок
  const handleTabChange = (tab: 'open' | 'closed') => {
    setActiveTab(tab);
    setFilterType('all');
    setFacilityClassFilter('all');
  };

  const filteredFacilities = facilities.filter(facility => {
    const isOpenTab = activeTab === 'open';
    const matchesStatus = isOpenTab ? !facility.is_closed : facility.is_closed;
    
    // Расширенный поиск по нескольким полям
    const matchesSearch = !searchTerm || 
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (facility.type === 'station' ? 'станция' : 'шд').includes(searchTerm.toLowerCase()) ||
      (facility.facility_class && `${facility.facility_class} класс`.includes(searchTerm.toLowerCase())) ||
      (facility.communication_posts && facility.communication_posts.some(post => 
        post.name.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Применяем фильтры только для закрытых объектов
    const matchesType = isOpenTab ? true : filterType === 'all' || facility.type === filterType;
    const matchesClass = isOpenTab ? true : facilityClassFilter === 'all' || facility.facility_class === facilityClassFilter;
    
    return matchesStatus && matchesSearch && matchesType && matchesClass;
  });

  const onBack = () => {
    navigate(`/divisions/${id}`);
  };

  if (loading) {
    return <div>Загрузка данных об объектах...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="section-container">
      <h2 className="section-title">
        <button type="button" onClick={onBack} className="back-button">
          <ArrowLeft className="back-button-icon" />
        </button>
        Объекты
      </h2>

      <div className="tabs">
        <button
          className={`tab-button-facilities ${activeTab === 'open' ? 'active' : ''}`}
          onClick={() => handleTabChange('open')}
        >
          Открытые объекты
        </button>
        <button
          className={`tab-button-facilities ${activeTab === 'closed' ? 'active' : ''}`}
          onClick={() => handleTabChange('closed')}
        >
          Закрытые объекты
        </button>
      </div>

      <div className="section-search-container">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Поиск по названию, адресу, типу, классу или посту связи..."
        />
      </div>

      {activeTab === 'closed' && (
        <FacilityTypeFilter
          facilities={facilities.filter(f => f.is_closed)}
          selectedType={filterType}
          onTypeChange={setFilterType}
          selectedClass={facilityClassFilter}
          onClassChange={setFacilityClassFilter}
        />
      )}

      <FacilityList
        viewType="table"
        facilities={filteredFacilities}
        onSelectFacility={(facility) => navigate(`/facilities/${facility.id}`)}
        showDifferentFields={true}
      />
    </div>
  );
}