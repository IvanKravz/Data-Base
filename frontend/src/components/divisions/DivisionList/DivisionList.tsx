import React, { useState, useEffect } from 'react';
import { Users, Plug, Building2, ListTodo, ChevronDown, ChevronUp } from 'lucide-react';
import { Division } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { divisionsApi } from '../../../api/divisions';
import './style.css';
import { MapCountry } from '../../map/MapCountry/MapCountry';
import { useAppPermissions } from '../../../api/utils/AppPermissionsContext';

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

  if (loading) return <div className="loading-divisions">Загрузка подразделений...</div>;
  if (error) return <div className="loading-divisions">{error}</div>;

  const chunkSize = Math.ceil(divisions.length / 3);
  const divisionChunks: Division[][] = [];
  for (let i = 0; i < divisions.length; i += chunkSize) {
    divisionChunks.push(divisions.slice(i, i + chunkSize));
  }

  return (
    <>
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

                    return (
                      <React.Fragment key={division.id}>
                        <tr className={`table-row ${isExpanded ? 'expanded' : ''}`}>
                          <td className="name-cell" onClick={() => handleTitleClick(division)}>
                            {division.name}
                          </td>
                          <td className="toggle-cell">
                            {hasAnyVisible && (
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

      <div className="map-country animate-fadeInUp">
        <MapCountry />
      </div>
    </>
  );
}