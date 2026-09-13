import React, { useState, useEffect } from 'react';
import { Users, Plug, Building2, ListTodo, ChevronDown, ChevronUp, Phone, Smartphone } from 'lucide-react';
import { Division, Employee } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { divisionsApi } from '../../../api/divisions';
import { employeesApi } from '../../../api/employees';
import './style.css';
import '../DivisionDetails/sections/DivisionLeadership/DivisionLeadership.css';
import { MapCountry } from '../../map/MapCountry/MapCountry';
import { useAppPermissions } from '../../../api/utils/AppPermissionsContext';
import '../DivisionDetails/sections/style.css';

interface DivisionListProps {
  onSelectDivision: (division: Division) => void;
}

const isVisibleForDivision = (
  canAccess: boolean,
  filters: { division_id?: number; subdivision_id?: number } | null,
  divisionId: number
): boolean => {
  if (!canAccess) return false;
  if (!filters) return true;
  if (filters.division_id && filters.division_id !== divisionId) return false;
  if (filters.subdivision_id) return false;
  return true;
};

export function DivisionList({ onSelectDivision }: DivisionListProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [chief, setChief] = useState<Employee | null>(null);
  const [deputies, setDeputies] = useState<Employee[]>([]);
  const [loadingLeadership, setLoadingLeadership] = useState(true);

  const {
    canAccessPersonnel, canAccessEquipment, canAccessFacilities,
    canAccessTasks,
    personnelFilters, equipmentFilters, facilitiesFilters, taskFilters
  } = useAppPermissions();

  // Состояние видимости карты с сохранением в localStorage
  const [showMap, setShowMap] = useState<boolean>(() => {
    const stored = localStorage.getItem('map_visible_divisionlist');
    return stored !== null ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem('map_visible_divisionlist', JSON.stringify(showMap));
  }, [showMap]);

  const toggleMap = () => setShowMap(prev => !prev);

  // Загрузка подразделений
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const data = await divisionsApi.getDivisions(token);
        setDivisions(data);
      } catch (err) {
        setError('Не удалось загрузить подразделения');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDivisions();
  }, [token]);

  // Загрузка руководителей (главный и заместители)
  useEffect(() => {
    const fetchLeadership = async () => {
      if (!token) {
        setLoadingLeadership(false);
        return;
      }
      try {
        // Загружаем всех сотрудников
        const allEmployees = await employeesApi.getPersonnel(token);

        // Фильтруем на клиенте по должности
        const chiefData = allEmployees.find(emp => emp.position === 'Главный руководитель') || null;
        const deputyData = allEmployees.filter(emp => emp.position === 'Заместитель главного руководителя');

        setChief(chiefData);
        setDeputies(deputyData);
      } catch (err) {
        console.error('Ошибка загрузки руководителей:', err);
      } finally {
        setLoadingLeadership(false);
      }
    };
    fetchLeadership();
  }, [token]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleMetricClick = (divisionId: number, section: string) => {
    navigate(`/divisions/${divisionId}/${section}`, { state: { fromDivisionList: true } });
  };

  const handleTitleClick = (division: Division) => {
    onSelectDivision(division);
    navigate(`/divisions/${division.id}`);
  };

  const renderLeaderCard = (leader: Employee | null, title: string) => {
    if (!leader) return null;
    return (
      <div className="division-leader-item">
        <div className="division-leader-info">
          <div className="division-leader-position">{title}</div>
          <div className="division-leader-name">{leader.full_name}</div>
          <div className="division-leader-contacts">
            {leader.work_phone && (
              <span>
                <Phone size={14} /> Рабочий: {leader.work_phone}
              </span>
            )}
            {leader.personal_phone && (
              <span>
                <Smartphone size={14} /> Личный: {leader.personal_phone}
              </span>
            )}
            {!leader.work_phone && !leader.personal_phone && (
              <span>—</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading-divisions">Загрузка подразделений...</div>;
  if (error) return <div className="loading-divisions">{error}</div>;

  const chunkSize = Math.ceil(divisions.length / 3);
  const divisionChunks: Division[][] = [];
  for (let i = 0; i < divisions.length; i += chunkSize) {
    divisionChunks.push(divisions.slice(i, i + chunkSize));
  }

  const hasLeadership = !!(chief || deputies.length > 0);

  return (
    <>
      {/* Блок руководства над списком */}
      {!loadingLeadership && hasLeadership && (
        <div className="leadership-section">
          <div className="division-subheader-hh">Руководство</div>
          <div className="leadership-cards">
            {chief && renderLeaderCard(chief, 'Главный руководитель')}
            {deputies.map((deputy, index) => (
              <React.Fragment key={deputy.id || index}>
                {renderLeaderCard(deputy, 'Заместитель главного руководителя')}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="division-subheader">Подразделения</div>

      <div className="tables-wrapper">
        <div className="tables-grid">
          {divisionChunks.map((chunk, chunkIndex) => (
            <div className="table-column" key={chunkIndex}>
              <table className="division-table">
                <tbody>
                  {chunk.map((division) => {
                    const isExpanded = expandedIds.has(division.id);
                    const showPersonnel = isVisibleForDivision(canAccessPersonnel(), personnelFilters, division.id);
                    const showEquipment = isVisibleForDivision(canAccessEquipment(), equipmentFilters, division.id);
                    const showFacilities = isVisibleForDivision(canAccessFacilities(), facilitiesFilters, division.id);
                    const showTasks = isVisibleForDivision(canAccessTasks(), taskFilters, division.id);
                    const hasAnyVisible = showPersonnel || showEquipment || showFacilities || showTasks;
                    const hasHead = !!division.head;

                    return (
                      <React.Fragment key={division.id}>
                        <tr className={`table-row ${isExpanded ? 'expanded' : ''}`}>
                          <td className="name-cell" onClick={() => handleTitleClick(division)}>
                            {division.name}
                          </td>
                          <td className="toggle-cell">
                            {(hasAnyVisible || hasHead) && (
                              <button
                                className="chevron-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(division.id);
                                }}
                                aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
                              >
                                {isExpanded ? <ChevronUp size={25} /> : <ChevronDown size={25} />}
                              </button>
                            )}
                          </td>
                        </tr>

                        <tr className={`expanded-row ${isExpanded ? 'expanded' : ''}`}>
                          <td colSpan={2}>
                            <div className="expanded-metrics-wrapper">
                              {hasHead && (
                                <div className="expanded-leadership-text">
                                  <span className="leader-label">Начальник отдела:</span>
                                  <div className="expanded-leader-item">
                                    <div className="leader-name-row">
                                      <span className="leader-fullname">{division.head.full_name}</span>
                                    </div>
                                    <div className="leader-contacts-row">
                                      {division.head.work_phone && (
                                        <span className="leader-contact">
                                          <Phone size={14} className="leader-contact-icon" />
                                          {division.head.work_phone}
                                        </span>
                                      )}
                                      {division.head.personal_phone && (
                                        <span className="leader-contact">
                                          <Smartphone size={14} className="leader-contact-icon" />
                                          {division.head.personal_phone}
                                        </span>
                                      )}
                                      {!division.head.work_phone && !division.head.personal_phone && (
                                        <span className="leader-contact">—</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {hasAnyVisible && (
                                <div className="expanded-metrics-row">
                                  {showPersonnel && (
                                    <div className="metric-item" onClick={() => handleMetricClick(division.id, 'personnel')}>
                                      <Users className="metric-icon metric-icon--blue" />
                                      <span>Сотрудники: {division.employees_count}</span>
                                    </div>
                                  )}
                                  {showEquipment && (
                                    <div className="metric-item" onClick={() => handleMetricClick(division.id, 'equipment')}>
                                      <Plug className="metric-icon metric-icon--green" />
                                      <span>Техника: {division.equipment_count}</span>
                                    </div>
                                  )}
                                  {showFacilities && (
                                    <div className="metric-item" onClick={() => handleMetricClick(division.id, 'facilities')}>
                                      <Building2 className="metric-icon metric-icon--purple" />
                                      <span>Объекты: {division.facilities_count}</span>
                                    </div>
                                  )}
                                  {showTasks && (
                                    <div className="metric-item" onClick={() => handleMetricClick(division.id, 'tasks')}>
                                      <ListTodo className="metric-icon metric-icon--orange" />
                                      <span>Задачи: {division.tasks_count}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* Блок карты с заголовком и шевроном */}
      <div className="map-country animate-fadeInUp">
        <div className="map-section-header">
          <div className={`map-header-left ${showMap ? 'expanded' : ''}`}>
            <h3
              className="map-title"
              onClick={toggleMap}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleMap()}
            >
              Территориальные органы ФСБ России
            </h3>
            <button
              className="map-toggle"
              onClick={toggleMap}
              aria-expanded={showMap}
              aria-label={showMap ? 'Скрыть карту' : 'Показать карту'}
            >
              <ChevronDown
                size={20}
                className={`map-toggle-icon ${showMap ? 'expanded' : ''}`}
              />
            </button>
          </div>
        </div>
        {showMap && (
          <div className="map-content-wrapper">
            <MapCountry />
          </div>
        )}
      </div>
    </>
  );
}