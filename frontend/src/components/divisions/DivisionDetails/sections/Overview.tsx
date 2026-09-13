// Overview.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Users,
  Plug,
  Building2,
  ListTodo,
  RadioTower,
  ChevronDown,
  SquareStack,
  Map,
  Calendar,
  Archive,
} from 'lucide-react';
import { Division } from '../../../../types';
import { StatCard } from './StatCard';
import { SubdivisionsList } from './SubdivisionsList';
import { DivisionLeadership } from './DivisionLeadership/DivisionLeadership';
import { employeesApi, tasksApi } from '../../../../api';
import { setPersonnel } from '../../../../store/slices/personnelSlice';
import { isExploitationEmployee, isExploitationChief } from '../../../../api/utils/permissions';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';
import { MapCountry } from '../../../map/MapCountry/MapCountry';
import './style.css';

// Маркеры фильтров (соответствуют бэкендным)
const USER_DIVISION_MARKER = '__user_division_id__';
const USER_SUBDIVISION_MARKER = '__user_subdivision_id__';

interface OverviewProps {
  division: Division;
}

const isVisibleForDivision = (
  canAccess: boolean,
  filters: { division_id?: number | string; subdivision_id?: number | string } | null,
  divisionId: number,
  userDivisionId?: number | null,
  userSubdivisionId?: number | null,
): boolean => {
  if (!canAccess) return false;
  if (!filters) return true;

  if (filters.division_id !== undefined && filters.division_id !== null) {
    const filterValue = filters.division_id;
    let actualDivisionId: number | null = null;
    if (filterValue === USER_DIVISION_MARKER) {
      actualDivisionId = userDivisionId ?? null;
    } else if (typeof filterValue === 'number') {
      actualDivisionId = filterValue;
    }
    if (actualDivisionId === null || actualDivisionId !== divisionId) {
      return false;
    }
  }

  return true;
};

export function Overview({ division }: OverviewProps) {
  const {
    canAccessPersonnel,
    canAccessEquipment,
    canAccessFacilities,
    canAccessTasks,
    canAccessNetworks,
    personnelFilters,
    equipmentFilters,
    facilitiesFilters,
    networksFilters,
    taskFilters,
    canAccessPage,
    getCurrentUser,
  } = useAppPermissions();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [incompleteTasksCount, setIncompleteTasksCount] = useState<number | null>(null);
  const isExploitationEmp = isExploitationEmployee();
  const isChief = isExploitationChief();
  const isExploitation = isChief || isExploitationEmp;

  const currentUser = getCurrentUser();
  const userDivisionId = currentUser?.division_info?.id ?? null;
  const userSubdivisionId = currentUser?.division_info?.subdivision?.id ?? null;

  const canAccessSchedule = canAccessPage('ScheduleEvent', 'view');

  const isTasksVisible = useMemo(() => {
    if (!canAccessTasks()) return false;
    if (!taskFilters) return true;

    if (taskFilters.division_id !== undefined && taskFilters.division_id !== null) {
      const filterValue = taskFilters.division_id;
      let actualDivisionId: number | null = null;
      if (filterValue === USER_DIVISION_MARKER) {
        actualDivisionId = userDivisionId;
      } else if (typeof filterValue === 'number') {
        actualDivisionId = filterValue;
      }
      if (actualDivisionId === null || actualDivisionId !== division.id) {
        return false;
      }
    }

    return true;
  }, [canAccessTasks, taskFilters, division.id, userDivisionId]);

  const effectiveSubdivisionId = useMemo(() => {
    if (!taskFilters?.subdivision_id) return null;
    const filterValue = taskFilters.subdivision_id;
    if (filterValue === USER_SUBDIVISION_MARKER) {
      return userSubdivisionId;
    } else if (typeof filterValue === 'number') {
      return filterValue;
    }
    return null;
  }, [taskFilters, userSubdivisionId]);

  const storageKeySub = `subdivisions_visible_${division.id}`;
  const [showSubdivisions, setShowSubdivisions] = useState<boolean>(() => {
    const stored = localStorage.getItem(storageKeySub);
    return stored !== null ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem(storageKeySub, JSON.stringify(showSubdivisions));
  }, [showSubdivisions, storageKeySub]);

  const toggleSubdivisions = () => setShowSubdivisions((prev) => !prev);

  const storageKeyMap = `map_visible_${division.id}`;
  const [showMap, setShowMap] = useState<boolean>(() => {
    const stored = localStorage.getItem(storageKeyMap);
    return stored !== null ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem(storageKeyMap, JSON.stringify(showMap));
  }, [showMap, storageKeyMap]);

  const toggleMap = () => setShowMap((prev) => !prev);

  const isPersonnelVisible = isVisibleForDivision(
    canAccessPersonnel(),
    personnelFilters,
    division.id,
    userDivisionId,
    userSubdivisionId,
  );
  const isEquipmentVisible = isVisibleForDivision(
    canAccessEquipment(),
    equipmentFilters,
    division.id,
    userDivisionId,
    userSubdivisionId,
  );
  const isFacilitiesVisible = isVisibleForDivision(
    canAccessFacilities(),
    facilitiesFilters,
    division.id,
    userDivisionId,
    userSubdivisionId,
  );
  const isNetworksVisible = isVisibleForDivision(
    canAccessNetworks(),
    networksFilters,
    division.id,
    userDivisionId,
    userSubdivisionId,
  );

  const handleSectionClick = (section: string, subdivisionId?: string) => {
    const path = subdivisionId
      ? `/divisions/${id}/${section}?subdivision=${subdivisionId}`
      : `/divisions/${id}/${section}`;
    navigate(path);
  };

  useEffect(() => {
    if (!isPersonnelVisible) {
      setLoading(false);
      return;
    }
    const fetchEmployees = async () => {
      try {
        const data = await employeesApi.getPersonnel(token, { division: division.id });
        dispatch(setPersonnel(data));
      } catch (err) {
        setError('Failed to load personnel');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [token, dispatch, division.id, isPersonnelVisible]);

  useEffect(() => {
    if (!isTasksVisible) {
      setTasksLoading(false);
      setIncompleteTasksCount(null);
      return;
    }
    const fetchTasksCount = async () => {
      try {
        const params: { divisionId: number; subdivisionId?: number } = { divisionId: division.id };
        if (effectiveSubdivisionId) {
          params.subdivisionId = effectiveSubdivisionId;
        }
        const count = await tasksApi.getIncompleteTasksCount(params);
        setIncompleteTasksCount(count);
      } catch (err: any) {
        console.error('Failed to fetch incomplete tasks count', err);
        setIncompleteTasksCount(null);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasksCount();
  }, [division.id, isTasksVisible, effectiveSubdivisionId]);

  const getCount = (
    visible: boolean,
    value: number | null | undefined,
    isLoading: boolean
  ): number | null => {
    if (!visible) return null;
    if (isLoading) return null;
    return value !== undefined ? value : null;
  };

  const hasSubdivisions = division.subdivisions && division.subdivisions.length > 0;
  const showSubdivisionsBlock = !isExploitationEmp && hasSubdivisions;

  return (
    <div className="division-overview-container">
      <DivisionLeadership division={division} />

      <div className="division-stats-grid">
        <StatCard
          title="Сотрудники"
          count={getCount(isPersonnelVisible, division.employees_count, loading)}
          icon={Users}
          iconColor="#4d5edb"
          details={[]}
          onClick={() => handleSectionClick('personnel')}
          loading={loading && isPersonnelVisible}
          disabled={!isPersonnelVisible}
          storageKey={`card_menu_employees_${division.id}`}
        >
          {canAccessSchedule && (
            <div
              className="schedule-link-card"
              onClick={() =>
                navigate(`/employee-schedule?division=${division.id}`, {
                  state: { divisionName: division.name },
                })
              }
            >
              <div className="schedule-link-icon">
                <Calendar size={28} />
              </div>
              <div className="schedule-link-text">
                <span className="schedule-link-title">График работы</span>
                <span className="schedule-link-sub">Планирование событий</span>
              </div>
            </div>
          )}
        </StatCard>

        <StatCard
          title="Техника"
          count={getCount(isEquipmentVisible, division.equipment_count, false)}
          icon={Plug}
          iconColor="#10b981"
          details={[]}
          onClick={() => handleSectionClick('equipment')}
          loading={false}
          disabled={!isEquipmentVisible}
          storageKey={`card_menu_equipment_${division.id}`}
        >
          <div
            className="schedule-link-card"
            onClick={() =>
              navigate('/equipment-disposed', {
                state: {
                  from: 'division-overview',   // ← ДОБАВЛЕНО: маркер источника
                  divisionId: division.id,
                  divisionName: division.name,
                },
              })
            }
          >
            <div
              className="schedule-link-icon"
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
            >
              <Archive size={28} />
            </div>
            <div className="schedule-link-text">
              <span className="schedule-link-title">Архив техники</span>
              <span className="schedule-link-sub">Списанное оборудование</span>
            </div>
          </div>
        </StatCard>

        <StatCard
          title="Объекты"
          count={getCount(isFacilitiesVisible, division.facilities_count, false)}
          icon={Building2}
          iconColor="#888676"
          details={[]}
          onClick={() => handleSectionClick('facilities')}
          loading={false}
          disabled={!isFacilitiesVisible}
        />

        <StatCard
          title="Сети связи"
          count={getCount(isNetworksVisible, division.networks_count, false)}
          icon={RadioTower}
          iconColor="#70b3d0"
          details={[]}
          onClick={() => handleSectionClick('networks')}
          loading={false}
          disabled={!isNetworksVisible}
        />

        <StatCard
          title="Задачи"
          count={getCount(isTasksVisible, incompleteTasksCount, tasksLoading)}
          icon={ListTodo}
          iconColor="#f97316"
          details={[]}
          onClick={() => handleSectionClick('tasks')}
          loading={tasksLoading && isTasksVisible}
          disabled={!isTasksVisible}
        />
      </div>

      {showSubdivisionsBlock && (
        <>
          <div className="subdivisions-section-header">
            <div className={`subdivisions-header-left ${showSubdivisions ? 'expanded' : ''}`}>
              <h3
                className="division-subdivisions-title"
                onClick={toggleSubdivisions}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleSubdivisions()}
              >
                <SquareStack
                  size={20}
                  style={{
                    marginRight: '8px',
                    verticalAlign: 'middle',
                    display: 'inline-block',
                  }}
                />
                Отделения подразделения
              </h3>
              <button
                className="subdivisions-toggle"
                onClick={toggleSubdivisions}
                aria-expanded={showSubdivisions}
                aria-label={showSubdivisions ? 'Скрыть подразделения' : 'Показать подразделения'}
              >
                <ChevronDown
                  size={20}
                  className={`subdivisions-toggle-icon ${showSubdivisions ? 'expanded' : ''}`}
                />
              </button>
            </div>
          </div>
          {showSubdivisions && <SubdivisionsList division={division} />}
        </>
      )}

      {isExploitation && (
        <>
          <div className="map-section-header">
            <div className={`map-header-left ${showMap ? 'expanded' : ''}`}>
              <h3
                className="map-title"
                onClick={toggleMap}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleMap()}
              >
                <Map
                  size={20}
                  style={{
                    marginRight: '8px',
                    verticalAlign: 'middle',
                    display: 'inline-block',
                  }}
                />
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
          {showMap && <MapCountry />}
        </>
      )}
    </div>
  );
}