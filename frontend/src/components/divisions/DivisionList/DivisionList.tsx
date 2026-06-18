// DivisionList.tsx
import { Users, Plug, Building2, ListTodo, ChevronDown, ChevronUp } from 'lucide-react';
import { Division } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { divisionsApi } from '../../../api/divisions';
import { useState, useEffect } from 'react';
import './style.css';
import { MapCountry } from '../../map/MapCountry/MapCountry';
import { useAppPermissions } from '../../../api/utils/AppPermissionsContext';

interface DivisionListProps {
  onSelectDivision: (division: Division) => void;
}

// Функция проверки видимости раздела для данного подразделения
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
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Получаем права доступа и фильтры
  const {
    canAccessPersonnel, canAccessEquipment, canAccessFacilities,
    canAccessTasks,
    personnelFilters, equipmentFilters, facilitiesFilters, taskFilters
  } = useAppPermissions();

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

  const toggleExpand = (divisionId: number) => {
    setExpandedId(expandedId === divisionId ? null : divisionId);
  };

  const handleMetricClick = (divisionId: number, section: string) => {
    navigate(`/divisions/${divisionId}/${section}`, { state: { fromDivisionList: true } });
  };

  const handleTitleClick = (division: Division) => {
    onSelectDivision(division);
    navigate(`/divisions/${division.id}`);
  };

  if (loading) {
    return <div className="loading-divisions">Загрузка подразделений...</div>;
  }

  if (error) {
    return <div className="loading-divisions">{error}</div>;
  }

  return (
    <>
      <div className="division-list-header-text">Отделы и отделения</div>
      <div className="grid-container">
        {divisions.map((division, index) => {
          const isExpanded = expandedId === division.id;

          // Определяем доступность каждого раздела
          const showPersonnel = isVisibleForDivision(
            canAccessPersonnel(), personnelFilters, division.id
          );
          const showEquipment = isVisibleForDivision(
            canAccessEquipment(), equipmentFilters, division.id
          );
          const showFacilities = isVisibleForDivision(
            canAccessFacilities(), facilitiesFilters, division.id
          );
          const showTasks = isVisibleForDivision(
            canAccessTasks(), taskFilters, division.id
          );

          // Показываем выпадающее меню, только если есть хотя бы один доступный раздел
          const hasAnyVisible = showPersonnel || showEquipment || showFacilities || showTasks;

          return (
            <div
              key={division.id}
              className={`division-card ${isExpanded ? 'expanded' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="division-card-header">
                <h3
                  className="division-card-title clickable-title"
                  onClick={() => handleTitleClick(division)}
                >
                  {division.name}
                </h3>
                {hasAnyVisible && (
                  <button
                    className="chevron-button"
                    onClick={() => toggleExpand(division.id)}
                    aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                )}
              </div>

              {isExpanded && hasAnyVisible && (
                <div className="expanded-content">
                  <div className="expanded-metrics-grid">
                    {showPersonnel && (
                      <div
                        className="metric-item metric-item-clickable"
                        onClick={() => handleMetricClick(division.id, 'personnel')}
                      >
                        <Users className="metric-icon metric-icon--blue" />
                        <span>Сотрудники: {division.employees_count}</span>
                      </div>
                    )}
                    {showEquipment && (
                      <div
                        className="metric-item metric-item-clickable"
                        onClick={() => handleMetricClick(division.id, 'equipment')}
                      >
                        <Plug className="metric-icon metric-icon--green" />
                        <span>Техника: {division.equipment_count}</span>
                      </div>
                    )}
                    {showFacilities && (
                      <div
                        className="metric-item metric-item-clickable"
                        onClick={() => handleMetricClick(division.id, 'facilities')}
                      >
                        <Building2 className="metric-icon metric-icon--purple" />
                        <span>Объекты: {division.facilities_count}</span>
                      </div>
                    )}
                    {showTasks && (
                      <div
                        className="metric-item metric-item-clickable"
                        onClick={() => handleMetricClick(division.id, 'tasks')}
                      >
                        <ListTodo className="metric-icon metric-icon--orange" />
                        <span>Задачи: {division.tasks_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="map-country animate-fadeInUp">
        <MapCountry />
      </div>
    </>
  );
}