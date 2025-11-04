// EquipmentSection.tsx - обновленный код

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Filter, Plus } from 'lucide-react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { EquipmentList } from '../../../../equipment/EquipmentList';
import { divisionsApi, equipmentApi, authApi } from '../../../../../api';
import { SearchBar } from '../../../../common/SearchBar';
import { StatusButtons } from '../../../../equipment';
import { AdvancedSearchModal } from '../../../../equipment/forms/AdvancedSearchModal/AdvancedSearchModal';
import './EquipmentSection.css';
import {
  Server,
  RadioTower,
  Monitor,
  BatteryCharging,
  Antenna,
  Zap,
  Box,
  KeyRound
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setEquipment, deleteEquipment } from '../../../../../store/slices/equipmentSlice';
import { RootState } from '../../../../../store/store';
import { getCurrentUser, getPermissions, isExploitationChief, isExploitationEmployee } from '../../../../../api/utils/permissions';

const CATEGORY_ICONS = {
  'tko': <Server className="equipment-tab-icon" size={16} />,
  'radio': <RadioTower className="equipment-tab-icon" size={16} />,
  'computer': <Monitor className="equipment-tab-icon" size={16} />,
  'battery': <BatteryCharging className="equipment-tab-icon" size={16} />,
  'antenna': <Antenna className="equipment-tab-icon" size={16} />,
  'power': <Zap className="equipment-tab-icon" size={16} />,
  'material': <Box className="equipment-tab-icon" size={16} />,
  'closed': <KeyRound className="equipment-tab-icon" size={16} />
};

// Интерфейс для объекта interest_organ
interface InterestOrgan {
  id: string;
  name: string;
}

interface AdvancedSearchFilters {
  names: string[];
  serialNumbers: string[];
  inventoryNumbers: string[];
  manufacturingDateFrom: string;
  manufacturingDateTo: string;
  exploitationDateFrom: string;
  exploitationDateTo: string;
  assignedTo: string[];
  interestOrgans: InterestOrgan[]; // Добавлено новое поле
}

export function EquipmentSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');
  const token = localStorage.getItem('accessToken');
  const dispatch = useDispatch();
  const equipment = useSelector((state: RootState) => state.equipment.equipment);

  // Определение ролей пользователя
  const currentUser = getCurrentUser();

  // Стабилизированные значения для зависимостей
  const stableToken = useMemo(() => token, [token]);
  const stableSubdivisionId = useMemo(() => subdivisionId, [subdivisionId]);
  const stableCurrentUser = useMemo(() => currentUser, [JSON.stringify(currentUser)]);

  // Определяем тип пользователя
  const isExploitationUser = useMemo(() => isExploitationChief() || isExploitationEmployee(), []);
  const isChief = useMemo(() => isExploitationChief(), []);

  // Для эксплуатационных пользователей отключаем глобальный режим
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);;

  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const [division, setDivision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ИЗМЕНЕНИЕ: Восстанавливаем активную вкладку из location.state или используем 'all' по умолчанию
  const [activeTab, setActiveTab] = useState<'all' | 'closed' | string>(location.state?.activeTab || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [subdivisionName, setSubdivisionName] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>({
    names: [],
    serialNumbers: [],
    inventoryNumbers: [],
    manufacturingDateFrom: '',
    manufacturingDateTo: '',
    exploitationDateFrom: '',
    exploitationDateTo: '',
    assignedTo: [],
    interestOrgans: []
  });

  // Проверка прав доступа для кнопки "Добавить технику"
  const canCreateEquipment = useMemo(() => {
    const permissions = getPermissions();
    if (permissions && permissions.equipment) {
      return permissions.equipment.can_edit;
    }
    return false;
  }, []);

  // Функция обновления индикатора
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

  // Обновляем индикатор при изменении активной вкладки
  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  // ДОБАВЛЕНО: Обновляем индикатор после первоначальной загрузки данных
  useEffect(() => {
    if (!loading) {
      // Небольшая задержка для гарантии, что DOM полностью обновлен
      const timer = setTimeout(() => {
        updateIndicator();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Исправленный useEffect с стабилизированными зависимостями
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Если пользователь эксплуатации и нет id (глобальный режим для обычных пользователей)
        if (isExploitationUser && !id) {
          const userDivisionId = stableCurrentUser?.division_info?.id;

          if (userDivisionId) {
            // Для начальника - вся техника подразделения
            // Для сотрудника - техника его отделения
            const params = isChief ?
              { division: userDivisionId } :
              {
                division: userDivisionId,
                subdivision: stableCurrentUser.division_info.subdivision?.id
              };

            const [div, equip, cats] = await Promise.all([
              divisionsApi.getDivisionById(userDivisionId, stableToken),
              equipmentApi.getEquipment(stableToken, params),
              equipmentApi.getEquipmentCategories(stableToken)
            ]);

            if (!isMounted) return;

            if (!isChief) {
              const userSubdivision = div.subdivisions?.find(
                s => s.id.toString() === stableCurrentUser.division_info.subdivision?.id?.toString()
              );
              setSubdivisionName(userSubdivision?.name || '');
            }

            setDivision(div);
            dispatch(setEquipment(equip));
            setCategories(cats);
          } else {
            // Если нет информации о подразделении, загружаем всю технику
            const [equip, cats] = await Promise.all([
              equipmentApi.getEquipment(stableToken, {}),
              equipmentApi.getEquipmentCategories(stableToken)
            ]);

            if (!isMounted) return;

            dispatch(setEquipment(equip));
            setCategories(cats);
          }
        } else if (isGlobalView) {
          // Глобальный режим для обычных пользователей - загружаем всю технику
          const [equip, cats] = await Promise.all([
            equipmentApi.getEquipment(stableToken, {}),
            equipmentApi.getEquipmentCategories(stableToken)
          ]);

          if (!isMounted) return;

          dispatch(setEquipment(equip));
          setCategories(cats);
        } else {
          // Режим подразделения (есть id)
          const [div, equip, cats] = await Promise.all([
            divisionsApi.getDivisionById(id, stableToken),
            equipmentApi.getEquipment(stableToken, { division: id }),
            equipmentApi.getEquipmentCategories(stableToken)
          ]);

          if (!isMounted) return;

          if (stableSubdivisionId) {
            const subdivision = div.subdivisions?.find(s => s.id.toString() === stableSubdivisionId.toString());
            setSubdivisionName(subdivision?.name || '');
          }

          setDivision(div);
          dispatch(setEquipment(equip));
          setCategories(cats);
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Не удалось загрузить данные');
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, stableToken, stableSubdivisionId, dispatch, isGlobalView, isExploitationUser, isChief, stableCurrentUser]);

  // Остальной код без изменений...
  // Логика фильтрации для отделения
  const filterBySubdivision = (items) => {
    // Для сотрудника эксплуатации не фильтруем по отделению - показываем всю технику подразделения
    if (isExploitationUser && !id) {
      return items;
    }

    // Для обычных случаев
    if (isGlobalView) return items;
    if (!stableSubdivisionId) return items;

    return items.filter(item =>
      item.subdivision?.id?.toString() === stableSubdivisionId.toString()
    );
  };

  const openEquipment = useMemo(() =>
    filterBySubdivision(equipment.filter(item => !item.is_closed)),
    [equipment, stableSubdivisionId, isGlobalView, isExploitationUser, stableCurrentUser, isChief, id]
  );

  const closedEquipment = useMemo(() =>
    filterBySubdivision(equipment.filter(item => item.is_closed)),
    [equipment, stableSubdivisionId, isGlobalView, isExploitationUser, stableCurrentUser, isChief, id]
  );

  // Логика формирования доступных категорий
  const availableCategories = useMemo(() => {
    const openCategories = categories.filter(cat => !cat.is_closed);

    return openCategories.filter(cat =>
      openEquipment.some(item => item.category?.value === cat.value)
    );
  }, [categories, openEquipment]);

  // Логика формирования техники для статусных кнопок
  const statusButtonsEquipment = useMemo(() => {
    if (activeTab === 'closed') {
      return closedEquipment;
    } else if (activeTab === 'all') {
      return [...openEquipment, ...closedEquipment];
    } else {
      return openEquipment.filter(item => item.category?.value === activeTab);
    }
  }, [activeTab, openEquipment, closedEquipment]);

  // Остальная логика фильтрации с добавлением interest_organ
  const filteredEquipment = useMemo(() => {
    return statusButtonsEquipment.filter(item => {
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      const matchesBasicSearch = searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assigned_to?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subdivision?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.interest_organ?.name?.toLowerCase().includes(searchTerm.toLowerCase()); // Добавлен поиск по interest_organ

      const matchesAdvancedSearch =
        (advancedFilters.names.length === 0 || advancedFilters.names.some(name =>
          item.name.toLowerCase().includes(name.toLowerCase()))) &&
        (advancedFilters.serialNumbers.length === 0 || advancedFilters.serialNumbers.some(sn =>
          item.serial_number.toLowerCase().includes(sn.toLowerCase()))) &&
        (advancedFilters.inventoryNumbers.length === 0 || advancedFilters.inventoryNumbers.some(inv =>
          item.inventory_number?.toLowerCase().includes(inv.toLowerCase()))) &&
        (advancedFilters.assignedTo.length === 0 || advancedFilters.assignedTo.some(assigned =>
          item.assigned_to?.full_name?.toLowerCase().includes(assigned.toLowerCase()))) &&
        (advancedFilters.interestOrgans.length === 0 || advancedFilters.interestOrgans.some(organ =>
          item.interest_organ?.id === organ.id)) && // Добавлена фильтрация по interest_organ
        (!advancedFilters.manufacturingDateFrom || item.manufacturing_date >= advancedFilters.manufacturingDateFrom) &&
        (!advancedFilters.manufacturingDateTo || item.manufacturing_date <= advancedFilters.manufacturingDateTo) &&
        (!advancedFilters.exploitationDateFrom || item.exploitation_date >= advancedFilters.exploitationDateFrom) &&
        (!advancedFilters.exploitationDateTo || item.exploitation_date <= advancedFilters.exploitationDateTo);

      return matchesStatus && matchesBasicSearch && matchesAdvancedSearch;
    });
  }, [statusButtonsEquipment, selectedStatus, searchTerm, advancedFilters]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Обновляем состояние в location, чтобы сохранить при переходе
    navigate(location.pathname + location.search, {
      state: {
        ...location.state,
        activeTab: tab
      },
      replace: true // Заменяем текущую запись в истории
    });
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

  const handleAdvancedFilterChange = (filterType: keyof AdvancedSearchFilters, values: any) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      names: [],
      serialNumbers: [],
      inventoryNumbers: [],
      manufacturingDateFrom: '',
      manufacturingDateTo: '',
      exploitationDateFrom: '',
      exploitationDateTo: '',
      assignedTo: [],
      interestOrgans: [] // Добавлено новое поле
    });
  };

  const hasActiveAdvancedFilters =
    advancedFilters.names.length > 0 ||
    advancedFilters.serialNumbers.length > 0 ||
    advancedFilters.inventoryNumbers.length > 0 ||
    advancedFilters.manufacturingDateFrom !== '' ||
    advancedFilters.manufacturingDateTo !== '' ||
    advancedFilters.exploitationDateFrom !== '' ||
    advancedFilters.exploitationDateTo !== '' ||
    advancedFilters.assignedTo.length > 0 ||
    advancedFilters.interestOrgans.length > 0; // Добавлено новое поле

  const handleCreateEquipment = () => {
    if (isGlobalView) {
      navigate(`/equipment/create`, {
        state: {
          isClosed: activeTab === 'closed'
        }
      });
    } else {
      navigate(`/divisions/${id}/equipment/create`, {
        state: {
          subdivisionId: stableSubdivisionId,
          isClosed: activeTab === 'closed'
        }
      });
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      await equipmentApi.deleteEquipment(id);
      dispatch(deleteEquipment(id));
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

  const handleBack = () => {
    if (isGlobalView) {
      navigate('/');
    } else {
      navigate(`/divisions/${id}`);
    }
  };

  // Правильное отображение заголовка для всех случаев
  const getHeaderTitle = () => {

    // Для пользователей эксплуатации в "глобальном" режиме (когда нет id)
    if (isExploitationUser && !id) {

      const divisionName = stableCurrentUser?.division_info?.name || 'Ваше подразделение';
      // Для всех эксплуатационных пользователей показываем только подразделение
      return `Техника связи и информатизации: ${divisionName}`;
    }

    // Для глобального режима обычных пользователей
    if (isGlobalView) {

      return 'Техника связи и информатизации: Все подразделения';
    }

    // Для режима конкретного подразделения
    return `Техника связи и информатизации: ${division?.name || ''} ${subdivisionName ? ` / ${subdivisionName}` : ''}`;
  };

  if (loading) {
    return <div className="flex justify-center py-12">Загрузка данных о технике...</div>;
  }

  if (error) {
    return <div className="equipment-error-message">{error}</div>;
  }

  return (
    <>
      <div className="equipment-header">
        <div className="equipment-title-container">
          {/* Показываем кнопку назад только при переходе из подразделения, а не из сайдбара */}
          {id && (
            <button onClick={handleBack} className="back-button">
              <ArrowLeft className="back-button-icon" />
            </button>
          )}
          <h2 className="equipment-title">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* Проверка прав доступа для кнопки "Добавить технику" */}
        {canCreateEquipment && (
          <button
            onClick={handleCreateEquipment}
            className="add-equipment-btn"
          >
            <Plus size={16} />
            Добавить технику
          </button>
        )}
      </div>

      <div className="equipment-content-wrapper">
        <div className="equipment-tabs-container">
          <div
            className="equipment-tabs"
            ref={tabsRef}
          >
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
                key={category.value}
                className={`equipment-tab-button ${activeTab === category.value ? 'active' : ''}`}
                onClick={() => handleTabChange(category.value)}
              >
                {CATEGORY_ICONS[category.value] || <Box className="equipment-tab-icon" size={16} />}
                {category.name}
              </button>
            ))}

            {closedEquipment.length > 0 && (
              <button
                className={`equipment-tab-button ${activeTab === 'closed' ? 'active' : ''}`}
                onClick={() => handleTabChange('closed')}
              >
                {CATEGORY_ICONS.closed}
                Закрытая техника
              </button>
            )}
          </div>
        </div>

        <div className="equipment-content">
          <div className="equipment-search-container">
            <div className="search-bar-with-filters">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Поиск по наименованию, серийному номеру, инвентарному номеру, за кем закреплено, в чьих интересах..."
              />
              <button
                className={`advanced-filter-button ${hasActiveAdvancedFilters ? 'active' : ''}`}
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <Filter size={18} />
                {hasActiveAdvancedFilters && <span className="filter-indicator"></span>}
              </button>
            </div>

            <AdvancedSearchModal
              isOpen={showAdvancedSearch}
              filters={advancedFilters}
              onFilterChange={handleAdvancedFilterChange}
              onClose={() => setShowAdvancedSearch(false)}
              onClearFilters={clearAdvancedFilters}
              equipment={equipment}
            />
          </div>

          {hasActiveAdvancedFilters && (
            <div className="active-filters">
              {/* Можно добавить отображение активных фильтров для interestOrgans */}
              {advancedFilters.interestOrgans.length > 0 && (
                <div className="filter-tags">
                  {advancedFilters.interestOrgans.map((organ, index) => (
                    <span key={organ.id} className="filter-tag">
                      В чьих интересах: {organ.name}
                      <button onClick={() => {
                        const newInterestOrgans = [...advancedFilters.interestOrgans];
                        newInterestOrgans.splice(index, 1);
                        handleAdvancedFilterChange('interestOrgans', newInterestOrgans);
                      }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {statusButtonsEquipment.length > 0 && (
            <StatusButtons
              equipment={statusButtonsEquipment}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          )}

          <EquipmentList
            equipment={filteredEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            divisionId={id}
            subdivisionId={stableSubdivisionId}
            activeTab={activeTab}
          />
        </div>
      </div>
    </>
  );
}