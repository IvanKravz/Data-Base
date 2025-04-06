import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Division } from '../../../../types';
import { FacilityList } from '../../../facilities/FacilityList';
import { SearchBar } from '../../../common/SearchBar';
import { FacilityTypeFilter } from '../../../facilities/FacilityTypeFilter';
import { ArrowLeft } from 'lucide-react';
import { facilitiesApi } from '../../../../api';
import { divisionsApi } from '../../../../api';
import './style.css';

interface FacilitiesSectionProps {
  division: Division;
  activeSubdivision: string | null;
}

export function FacilitiesSection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');

  const [openSearchTerm, setOpenSearchTerm] = useState('');
  const [closedSearchTerm, setClosedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'station' | 'shd'>('all');
  const [facilityClassFilter, setFacilityClassFilter] = useState<'all' | '1' | '2'>('all');
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [division, getDivisions] = useState('')

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const facil = await facilitiesApi.getFacilityById(id);
        const div = await divisionsApi.getDivisionById(id, token);
        getDivisions(div);
        setFacility(facil);
      } catch (err) {
        setError('Не удалось загрузить данные об объекте');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  const onBack = () => {
    navigate(`/divisions/${id}`);
  }


  if (loading) {
    return <div>Загрузка данных об объекте...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!facility) {
    return <div>Объект не найден</div>;
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
          className={`tab-button ${activeTab === 'open' ? 'active' : ''}`}
          onClick={() => setActiveTab('open')}
        >
          Открытые объекты
        </button>
        <button
          className={`tab-button ${activeTab === 'closed' ? 'active' : ''}`}
          onClick={() => setActiveTab('closed')}
        >
          Закрытые объекты
        </button>
      </div>

      {activeTab === 'open' && (
        <>
          <div className="section-search-container">
            <SearchBar
              searchTerm={openSearchTerm}
              setSearchTerm={setOpenSearchTerm}
              placeholder="Поиск по названию или адресу..."
            />
          </div>
          <FacilityList
            viewType="table"
            type="open"
            selectedDivision={facility.name}
            searchTerm={openSearchTerm}
            filterType="station"
            facilityClassFilter="all"
            onSelectFacility={(facility) => navigate(`/facilities/${facility.id}`)}
          />
        </>
      )}

      {activeTab === 'closed' && (
        <>
          <div className="section-search-container">
            <SearchBar
              searchTerm={closedSearchTerm}
              setSearchTerm={setClosedSearchTerm}
              placeholder="Поиск по названию или адресу..."
            />
          </div>
          <FacilityTypeFilter
            facilities={[facility]}
            selectedType={filterType}
            onTypeChange={setFilterType}
            selectedClass={facilityClassFilter}
            onClassChange={setFacilityClassFilter}
            hideTypeFilter={true}
          />
          <FacilityList
            viewType="table"
            type="closed"
            selectedDivision={facility.division}
            searchTerm={closedSearchTerm}
            filterType={filterType}
            facilityClassFilter={facilityClassFilter}
            onSelectFacility={(facility) => navigate(`/facilities/${facility.id}`)}
          />
        </>
      )}
    </div>
  );
}