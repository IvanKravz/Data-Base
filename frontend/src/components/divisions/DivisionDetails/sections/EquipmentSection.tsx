import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Division } from '../../../../types';
import { EquipmentList } from '../../../equipment/EquipmentList';
import { divisionsApi, equipmentApi } from '../../../../api';
import { SearchBar } from '../../../common/SearchBar';
import { Equipment, EquipmentCategory } from '../../../../types';
import './style.css';
import { StatusButtons } from '../../../equipment';

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

  const [division, setDivision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState<'all' | 'closed' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subdivisionName, setSubdivisionName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const div = await divisionsApi.getDivisionById(id, token);
        const equip = await equipmentApi.getEquipment(token, { division: div.id });
        
        // Находим имя отделения по ID
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

  // Функция для фильтрации оборудования по subdivision
  const filterBySubdivision = (items) => {
    if (!subdivisionId) return items;
    return items.filter(item => 
      item.subdivision?.id?.toString() === subdivisionId.toString()
    );
  };

  // Разделяем технику на открытую и закрытую с учетом subdivision
  const openEquipment = useMemo(() =>
    filterBySubdivision(equipment.filter(item => !item.is_closed)),
    [equipment, subdivisionId]
  );

  const closedEquipment = useMemo(() =>
    filterBySubdivision(equipment.filter(item => item.is_closed)),
    [equipment, subdivisionId]
  );

  // Получаем категории для вкладок (только те, для которых есть техника)
  const availableCategories = useMemo(() => {
    const categoriesWithEquipment = [...new Set(openEquipment.map(item => item.category_display))];
    return MAIN_CATEGORIES.filter(category =>
      categoriesWithEquipment.includes(category)
    );
  }, [openEquipment]);

  // Техника для StatusButtons с учетом активной вкладки и subdivision
  const statusButtonsEquipment = useMemo(() => {
    if (activeTab === 'closed') {
      return closedEquipment;
    } else if (activeTab === 'all') {
      return [...openEquipment, ...closedEquipment];
    } else {
      return openEquipment.filter(item => item.category_display === activeTab);
    }
  }, [activeTab, openEquipment, closedEquipment]);

  // Фильтрация для таблицы (учитывает статус, категорию и поиск)
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

  // Получение уникальных категорий для закрытой техники
  const uniqueClosedCategories = [...new Set(closedEquipment.map(item => item.category_display))];

  // Получение активных категорий для выбранного статуса
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

  if (loading) {
    return <div>Загрузка данных о технике...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // console.log(filterBySubdivision)

  return (
    <div className="section-container">
      <h2 className="section-title">
        <button onClick={() => navigate(`/divisions/${id}`)} className="back-button">
          <ArrowLeft className="back-button-icon" />
        </button>
        Техника связи и информатизации: {division?.name ? ` ${division?.name}` : ''} {subdivisionName ? ` / ${subdivisionName}` : ''}
      </h2>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setSelectedCategory(null);
          }}
        >
          Вся техника
        </button>

        {availableCategories.map(category => (
          <button
            key={category}
            className={`tab-button ${activeTab === category ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(category);
              setSelectedCategory(null);
            }}
          >
            {category}
          </button>
        ))}

        {closedEquipment.length > 0 && (
          <button
            className={`tab-button ${activeTab === 'closed' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('closed');
              setSelectedCategory(null);
            }}
          >
            Шатехника
          </button>
        )}
      </div>

      <div className="section-search-container">
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
        <div className="filters">
          <div className="category-filters">
            {uniqueClosedCategories.map(category => (
              category && (
                <button
                  key={category}
                  className={`category-filter-button 
                    ${selectedCategory === category ? 'active' : ''}
                    ${!activeCategories.includes(category) ? 'inactive' : ''}
                  `}
                  onClick={() => handleCategoryClick(category)}
                  disabled={!activeCategories.includes(category)}
                >
                  {category}
                  <span className="category-filter-badge">
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
  );
}