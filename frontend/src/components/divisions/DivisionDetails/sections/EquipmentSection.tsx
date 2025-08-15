import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { EquipmentList } from '../../../equipment/EquipmentList';
import { divisionsApi, equipmentApi } from '../../../../api';
import { SearchBar } from '../../../common/SearchBar';
import { StatusButtons } from '../../../equipment';
import './EquipmentSection.css';
import { 
  Server, 
  RadioTower, 
  Monitor, 
  BatteryCharging, 
  Antenna, 
  Zap, 
  Box,
  Trash2
} from 'lucide-react';

const CATEGORY_ICONS = {
  'ТКО': <Server className="equipment-tab-icon" size={16} />,
  'Радио': <RadioTower className="equipment-tab-icon" size={16} />,
  'СВТ': <Monitor className="equipment-tab-icon" size={16} />,
  'АКБ': <BatteryCharging className="equipment-tab-icon" size={16} />,
  'Антенны, мачты': <Antenna className="equipment-tab-icon" size={16} />,
  'Источники питания': <Zap className="equipment-tab-icon" size={16} />,
  'Материалы': <Box className="equipment-tab-icon" size={16} />,
  'closed': <Trash2 className="equipment-tab-icon" size={16} />
};

const MAIN_CATEGORIES = [
  'ТКО',
  'Радио',
  'СВТ',
  'АКБ',
  'Антенны, мачты',
  'Источники питания',
  'Материалы'
];

export function EquipmentSection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');
  const token = localStorage.getItem('accessToken');
  
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  
  const [division, setDivision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState<'all' | 'closed' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subdivisionName, setSubdivisionName] = useState('');

  // Эффект для обновления позиции индикатора
  useEffect(() => {
    const updateIndicator = () => {
      if (!tabsRef.current || !indicatorRef.current) return;
      
      const activeTabElement = tabsRef.current.querySelector('.equipment-tab-button.active') as HTMLElement;
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
    const fetchData = async () => {
      try {
        const div = await divisionsApi.getDivisionById(id, token);
        const equip = await equipmentApi.getEquipment(token, { division: div.id });
        
        if (subdivisionId) {
          const subdivision = div.subdivisions?.find(s => s.id.toString() === subdivisionId.toString());
          setSubdivisionName(subdivision?.name || '');
        }

        setDivision(div);
        setEquipment(equip);
      } catch (err) {
        setError('Не удалось загрузить данные');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, subdivisionId]);

  const filterBySubdivision = (items) => {
    if (!subdivisionId) return items;
    return items.filter(item => 
      item.subdivision?.id?.toString() === subdivisionId.toString()
    );
  };

  const openEquipment = useMemo(() =>
    filterBySubdivision(equipment.filter(item => !item.is_closed)),
    [equipment, subdivisionId]
  );

  const closedEquipment = useMemo(() =>
    filterBySubdivision(equipment.filter(item => item.is_closed)),
    [equipment, subdivisionId]
  );

  const availableCategories = useMemo(() => {
    const categoriesWithEquipment = [...new Set(openEquipment.map(item => item.category_display))];
    return MAIN_CATEGORIES.filter(category =>
      categoriesWithEquipment.includes(category)
    );
  }, [openEquipment]);

  const statusButtonsEquipment = useMemo(() => {
    if (activeTab === 'closed') {
      return closedEquipment;
    } else if (activeTab === 'all') {
      return [...openEquipment, ...closedEquipment];
    } else {
      return openEquipment.filter(item => item.category_display === activeTab);
    }
  }, [activeTab, openEquipment, closedEquipment]);

  const filteredEquipment = useMemo(() => {
    return statusButtonsEquipment.filter(item => {
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesSearch = searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assigned_to?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subdivision?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === null || item.category_display === selectedCategory;

      return matchesStatus && matchesSearch && matchesCategory;
    });
  }, [statusButtonsEquipment, selectedStatus, searchTerm, selectedCategory]);

  const uniqueClosedCategories = [...new Set(closedEquipment.map(item => item.category_display))];

  const activeCategories = useMemo(() => {
    const filteredByStatus = statusButtonsEquipment.filter(item =>
      selectedStatus === 'all' || item.status === selectedStatus
    );
    return [...new Set(filteredByStatus.map(item => item.category_display))];
  }, [statusButtonsEquipment, selectedStatus]);

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedCategory(null);
    
    // Прокрутка к активной вкладке
    setTimeout(() => {
      const activeTabElement = document.querySelector('.equipment-tab-button.active');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 10);
  };

  if (loading) {
    return <div className="flex justify-center py-12">Загрузка данных о технике...</div>;
  }

  if (error) {
    return <div className="equipment-error-message">{error}</div>;
  }

  console.log('filteredEquipment',filteredEquipment)

  return (
    <div className="equipment-container">
      <div className="equipment-header">
        <h2 className="equipment-title">
          <button onClick={() => navigate(`/divisions/${id}`)} className="back-button">
            <ArrowLeft className="back-button-icon" />
          </button>
          Техника связи и информатизации: {division?.name ? ` ${division?.name}` : ''} {subdivisionName ? ` / ${subdivisionName}` : ''}
        </h2>
      </div>

      <div className="equipment-content-wrapper">
        <div className="equipment-tabs-container">
          <div 
            className="equipment-tabs"
            ref={tabsRef}
          >
            {/* Индикатор активной вкладки */}
            <div 
              className="equipment-tab-indicator"
              ref={indicatorRef}
              style={{
                ...indicatorStyle,
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
            
            <button
              className={`equipment-tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <div className="equipment-tab-icon">
                <Box size={16} />
              </div>
              Вся техника
            </button>

            {availableCategories.map(category => (
              <button
                key={category}
                className={`equipment-tab-button ${activeTab === category ? 'active' : ''}`}
                onClick={() => handleTabChange(category)}
              >
                {CATEGORY_ICONS[category]}
                {category}
              </button>
            ))}

            {closedEquipment.length > 0 && (
              <button
                className={`equipment-tab-button ${activeTab === 'closed' ? 'active' : ''}`}
                onClick={() => handleTabChange('closed')}
              >
                {CATEGORY_ICONS.closed}
                Шатехника
              </button>
            )}
          </div>
        </div>

        <div className="equipment-content">
          <div className="equipment-search-container">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Поиск по наименованию, серийному номеру, инвентарному номеру, за кем закреплено..."
            />
          </div>

          {statusButtonsEquipment.length > 0 && (
            <StatusButtons
              equipment={statusButtonsEquipment}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          )}

          {activeTab === 'closed' && closedEquipment.length > 0 && (
            <div className="equipment-filters">
              <div className="equipment-category-filters">
                {uniqueClosedCategories.map(category => (
                  category && (
                    <button
                      key={category}
                      className={`equipment-category-filter-button 
                        ${selectedCategory === category ? 'active' : ''}
                        ${!activeCategories.includes(category) ? 'inactive' : ''}
                      `}
                      onClick={() => handleCategoryClick(category)}
                      disabled={!activeCategories.includes(category)}
                    >
                      {category}
                      <span className="equipment-category-badge">
                        {closedEquipment.filter(item =>
                          item.category_display === category &&
                          (selectedStatus === 'all' || item.status === selectedStatus)
                        ).length}
                      </span>
                    </button>
                  )
                ))}
              </div>
            </div>
          )}

          <EquipmentList 
            equipment={filteredEquipment} 
            onUpdateEquipment={() => {}} 
            onDeleteEquipment={() => {}} 
          />
        </div>
      </div>
    </div>
  );
}