import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Division } from '../../../../types';
import { EquipmentList } from '../../../equipment/EquipmentList';
import { divisionsApi, equipmentApi } from '../../../../api';
import { SearchBar } from '../../../common/SearchBar';
import { Equipment, EquipmentCategory } from '../../../../types';
import './style.css';
import { StatusButtons } from '../../../equipment';

// Определим основные категории для вкладок
const MAIN_CATEGORIES = [
  'ТКО',
  'Радио',
  'СВТ',
  'АКБ',
  'Антенны, мачты',
  'Источники питания',
  'Материалы'
];

interface EquipmentSectionProps {
  division: Division;
  activeSubdivision: string | null;
}

export function EquipmentSection({ activeSubdivision }: EquipmentSectionProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');

  const [division, setDivision] = useState<Division | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'closed' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Equipment['status'] | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const div = await divisionsApi.getDivisionById(id, token);
        const equip = await equipmentApi.getEquipment(token, { division: div.id });
        setDivision(div);
        setEquipment(equip);
      } catch (err) {
        setError('Не удалось загрузить данные об объекте');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  const onBack = () => {
    navigate(`/divisions/${id}`);
  };

  // Разделяем технику на открытую и закрытую
  const openEquipment = useMemo(() =>
    equipment.filter(item => !item.is_closed),
    [equipment]
  );

  const closedEquipment = useMemo(() =>
    equipment.filter(item => item.is_closed),
    [equipment]
  );

  // Получаем категории для вкладок (только те, для которых есть техника)
  const availableCategories = useMemo(() => {
    const categoriesWithEquipment = [...new Set(openEquipment.map(item => item.category_display))];
    return MAIN_CATEGORIES.filter(category =>
      categoriesWithEquipment.includes(category)
    );
  }, [openEquipment]);

  // Техника для StatusButtons (всегда полный список для текущей вкладки)
  const statusButtonsEquipment = useMemo(() => {
    if (activeTab === 'closed') {
      return closedEquipment;
    } else if (activeTab === 'all') {
      return [...openEquipment, ...closedEquipment]; // Объединяем открытую и закрытую технику
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
        item.assigned_to.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subdivision?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Обработчик нажатия на кнопку категории в закрытой технике
  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  return (
    <div className="section-container">
      <h2 className="section-title">
        <button onClick={onBack} className="back-button">
          <ArrowLeft className="back-button-icon" />
        </button>
        Техника подразделения
      </h2>

      <div className="tabs">
        {/* Вкладка "Вся техника" */}
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab(activeTab === 'all' ? 'all' : 'all');
            setSelectedCategory(null);
          }}
        >
          Вся техника
        </button>

        {/* Вкладки для основных категорий */}
        {availableCategories.map(category => (
          <button
            key={category}
            className={`tab-button ${activeTab === category ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(activeTab === category ? 'all' : category);
              setSelectedCategory(null);
            }}
          >
            {category}
          </button>
        ))}

        {/* Вкладка для закрытой техники */}
        {closedEquipment.length != 0 && <button
          className={`tab-button ${activeTab === 'closed' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('closed');
            setSelectedCategory(null);
          }}
        >
          Шатехника
          {/* <span className="tab-badge">
            {closedEquipment.length}
          </span> */}
        </button>}
      </div>

      <div className="section-search-container">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Поиск по наименованию, серийному номеру, инвентарному номеру, за кем закреплено..."
        />
      </div>

      {/* Кнопки фильтрации по статусу */}
      {equipment.length > 0 && (
        <StatusButtons
          equipment={statusButtonsEquipment}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      )}

      {/* Фильтры по категориям (только для закрытой техники) */}
      {activeTab === 'closed' && (
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

      {/* Отображаем отфильтрованные данные */}
      <EquipmentList equipment={filteredEquipment} />
    </div>
  );
}