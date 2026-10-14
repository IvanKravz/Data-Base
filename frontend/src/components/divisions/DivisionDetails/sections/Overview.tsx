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
  UserPlus,
} from 'lucide-react';
import { Division } from '../../../../types';
import { StatCard } from './StatCard';
import { SubdivisionsList } from './SubdivisionsList';
import { DivisionLeadership } from './DivisionLeadership/DivisionLeadership';
import { employeesApi, tasksApi, equipmentApi, facilitiesApi } from '../../../../api';
import { setPersonnel } from '../../../../store/slices/personnelSlice';
import { isExploitationEmployee, isExploitationChief } from '../../../../api/utils/permissions';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';
import { MapCountry } from '../../../map/MapCountry/MapCountry';
import { candidatesApi } from '../../../../api/candidatesApi';
import './style.css';

// Маркеры фильтров (соответствуют бэкендным)
const USER_DIVISION_MARKER = '__user_division_id__';
const USER_SUBDIVISION_MARKER = '__user_subdivision_id__';

interface OverviewProps {
  division: Division;
}

const asArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

const idsEqual = (a: unknown, b: unknown): boolean => {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
};

const isVisibleForDivision = (
  canAccess: boolean,
  filters: any,
  divisionId: number,
  userDivisionId?: number | null,
  userSubdivisionId?: number | null,
): boolean => {
  if (!canAccess) return false;
  if (!filters) return true;

  const alternatives: any[] = Array.isArray(filters) ? filters : [filters];

  for (const alt of alternatives) {
    if (!alt || typeof alt !== 'object') continue;

    const filterValue = alt.division_id;
    if (filterValue === undefined || filterValue === null) {
      return true;
    }

    let actual: number | null = null;
    if (filterValue === USER_DIVISION_MARKER) {
      actual = userDivisionId ?? null;
    } else if (typeof filterValue === 'number' || typeof filterValue === 'string') {
      const n = Number(filterValue);
      actual = Number.isFinite(n) ? n : null;
    }

    if (actual !== null && actual === divisionId) {
      return true;
    }
  }

  return false;
};

const isScheduleVisibleForDivision = (
  canAccess: boolean,
  filters: any,
  divisionId: number,
  userDivisionId?: number | null,
): boolean => {
  if (!canAccess) return false;
  if (!filters) return true;

  const alternatives: any[] = Array.isArray(filters) ? filters : [filters];

  for (const alt of alternatives) {
    if (!alt || typeof alt !== 'object') continue;

    const filterValue = alt.employee__division_id;
    if (filterValue === undefined || filterValue === null) {
      return true;
    }

    let actual: number | null = null;
    if (filterValue === USER_DIVISION_MARKER) {
      actual = userDivisionId ?? null;
    } else {
      const n = Number(filterValue);
      actual = Number.isFinite(n) ? n : null;
    }

    if (actual !== null && actual === divisionId) {
      return true;
    }
  }

  return false;
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
    scheduleFilters,
    candidateFilters,
    canAccessPage,
    getCurrentUser,
  } = useAppPermissions();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');

  const [error, setError] = useState<string | null>(null);

  // ── Счётчики ──────────────────────────────────────────────────────
  const [personnelCount, setPersonnelCount] = useState<number | null>(null);
  const [equipmentCount, setEquipmentCount] = useState<number | null>(null);
  const [facilitiesCount, setFacilitiesCount] = useState<number | null>(null);
  // Сети берём из division.networks_count (нет API с ролевой фильтрацией)
  const [networksCount] = useState<number | null>(division.networks_count ?? null);

  const [tasksLoading, setTasksLoading] = useState(true);
  const [incompleteTasksCount, setIncompleteTasksCount] = useState<number | null>(null);

  // ── Состояния загрузки — все стартуют с true, чтобы избежать «мигания»
  const [personnelLoading, setPersonnelLoading] = useState(true);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  const isExploitationEmp = isExploitationEmployee();
  const isChief = isExploitationChief();
  const isExploitation = isChief || isExploitationEmp;

  const currentUser = getCurrentUser();
  const userDivisionId = currentUser?.division_info?.id ?? null;
  const userSubdivisionId = currentUser?.division_info?.subdivision?.id ?? null;

  const [candidatesCount, setCandidatesCount] = useState<number | null>(null);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const isCandidatesVisibleForThisDivision = useMemo(
    () => isVisibleForDivision(
      canAccessPage('Candidate', 'view'),
      candidateFilters,
      division.id,
      userDivisionId,
    ),
    [canAccessPage, candidateFilters, division.id, userDivisionId],
  );

  useEffect(() => {
    if (!isCandidatesVisibleForThisDivision) {
      setCandidatesCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setCandidatesLoading(true);
        const stats = await candidatesApi.stats({ division: division.id });
        if (!cancelled) setCandidatesCount(stats.total);
      } catch {
        if (!cancelled) setCandidatesCount(null);
      } finally {
        if (!cancelled) setCandidatesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [division.id, isCandidatesVisibleForThisDivision]);

  const isScheduleVisibleForThisDivision = useMemo(
    () => isScheduleVisibleForDivision(
      canAccessPage('ScheduleEvent', 'view'),
      scheduleFilters,
      division.id,
      userDivisionId,
    ),
    [canAccessPage, scheduleFilters, division.id, userDivisionId],
  );

  const isTasksVisible = useMemo(() => {
    if (!canAccessTasks()) return false;
    if (!taskFilters) return true;

    const alternatives: any[] = Array.isArray(taskFilters) ? taskFilters : [taskFilters];
    for (const alt of alternatives) {
      if (!alt || typeof alt !== 'object') continue;
      const filterValue = alt.division_id;
      if (filterValue === undefined || filterValue === null) return true;

      let actual: number | null = null;
      if (filterValue === USER_DIVISION_MARKER) {
        actual = userDivisionId;
      } else {
        const n = Number(filterValue);
        actual = Number.isFinite(n) ? n : null;
      }
      if (actual !== null && actual === division.id) return true;
    }
    return false;
  }, [canAccessTasks, taskFilters, division.id, userDivisionId]);

  const effectiveSubdivisionId = useMemo(() => {
    if (!taskFilters) return null;
    const alt = Array.isArray(taskFilters) ? taskFilters[0] : taskFilters;
    if (!alt || typeof alt !== 'object') return null;
    const filterValue = alt.subdivision_id;
    if (filterValue === undefined || filterValue === null) return null;
    if (filterValue === USER_SUBDIVISION_MARKER) return userSubdivisionId;
    const n = Number(filterValue);
    return Number.isFinite(n) ? n : null;
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

  // ── Видимость секций ──────────────────────────────────────────────
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

  /**
   * Пока хотя бы одна видимая секция грузится — показываем скелетоны,
   * а все карточки раскрываем одновременно, когда всё готово.
   */
  const countsLoading =
    (isPersonnelVisible && personnelLoading) ||
    (isEquipmentVisible && equipmentLoading) ||
    (isFacilitiesVisible && facilitiesLoading) ||
    (isTasksVisible && tasksLoading);

  const visibleCardsCount = [
    isPersonnelVisible,
    isEquipmentVisible,
    isFacilitiesVisible,
    isNetworksVisible,
    isTasksVisible,
  ].filter(Boolean).length;

  const handleSectionClick = (section: string, subdivisionId?: string) => {
    const path = subdivisionId
      ? `/divisions/${id}/${section}?subdivision=${subdivisionId}`
      : `/divisions/${id}/${section}`;
    navigate(path);
  };

  // ── Загрузка сотрудников ──────────────────────────────────────────
  useEffect(() => {
    if (!isPersonnelVisible) {
      setPersonnelLoading(false);
      setPersonnelCount(null);
      return;
    }
    let cancelled = false;
    const fetchEmployees = async () => {
      try {
        setPersonnelLoading(true);
        const data = await employeesApi.getPersonnel(token, {});
        const list = asArray(data);
        const filtered = list.filter((p: any) =>
          idsEqual(p.division?.id, division.id),
        );
        if (!cancelled) {
          setPersonnelCount(filtered.length);
          dispatch(setPersonnel(list as any));
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load personnel');
          console.error(err);
          setPersonnelCount(null);
        }
      } finally {
        if (!cancelled) setPersonnelLoading(false);
      }
    };
    fetchEmployees();
    return () => { cancelled = true; };
  }, [token, dispatch, division.id, isPersonnelVisible]);

  // ── Загрузка техники ──────────────────────────────────────────────
  useEffect(() => {
    if (!isEquipmentVisible) {
      setEquipmentLoading(false);
      setEquipmentCount(null);
      return;
    }
    let cancelled = false;
    const fetchEquipment = async () => {
      try {
        setEquipmentLoading(true);
        const data = await equipmentApi.getEquipment(token, {});
        const list = asArray(data).filter((e: any) => e?.status !== 'disposed');
        const filtered = list.filter((e: any) =>
          idsEqual(e.division?.id, division.id),
        );
        if (!cancelled) setEquipmentCount(filtered.length);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load equipment count', err);
          setEquipmentCount(null);
        }
      } finally {
        if (!cancelled) setEquipmentLoading(false);
      }
    };
    fetchEquipment();
    return () => { cancelled = true; };
  }, [token, division.id, isEquipmentVisible]);

  // ── Загрузка объектов ─────────────────────────────────────────────
  useEffect(() => {
    if (!isFacilitiesVisible) {
      setFacilitiesLoading(false);
      setFacilitiesCount(null);
      return;
    }
    let cancelled = false;
    const fetchFacilities = async () => {
      try {
        setFacilitiesLoading(true);
        const data = await facilitiesApi.getFacilities({ token });
        const list = asArray(data);
        const filtered = list.filter((f: any) =>
          idsEqual(f.division?.id, division.id),
        );
        if (!cancelled) setFacilitiesCount(filtered.length);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load facilities count', err);
          setFacilitiesCount(null);
        }
      } finally {
        if (!cancelled) setFacilitiesLoading(false);
      }
    };
    fetchFacilities();
    return () => { cancelled = true; };
  }, [token, division.id, isFacilitiesVisible]);

  // ── Загрузка задач ────────────────────────────────────────────────
  useEffect(() => {
    if (!isTasksVisible) {
      setTasksLoading(false);
      setIncompleteTasksCount(null);
      return;
    }
    let cancelled = false;
    const fetchTasksCount = async () => {
      try {
        setTasksLoading(true);
        const params: { divisionId: number; subdivisionId?: number } = { divisionId: division.id };
        if (effectiveSubdivisionId) {
          params.subdivisionId = effectiveSubdivisionId;
        }
        const count = await tasksApi.getIncompleteTasksCount(params);
        if (!cancelled) setIncompleteTasksCount(count);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to fetch incomplete tasks count', err);
          setIncompleteTasksCount(null);
        }
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    };
    fetchTasksCount();
    return () => { cancelled = true; };
  }, [division.id, isTasksVisible, effectiveSubdivisionId]);

  const hasSubdivisions = division.subdivisions && division.subdivisions.length > 0;
  const showSubdivisionsBlock = !isExploitationEmp && hasSubdivisions;

  return (
    <div className="division-overview-container">
      <DivisionLeadership division={division} />

      {countsLoading ? (
        <div className="division-stats-grid division-stats-grid--skeleton">
          {Array.from({ length: Math.max(visibleCardsCount, 1) }).map((_, i) => (
            <div key={i} className="sc-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : (
        <div className="division-stats-grid">
          <StatCard
            title="Сотрудники"
            count={isPersonnelVisible ? personnelCount : null}
            icon={Users}
            iconColor="#4d5edb"
            details={[]}
            onClick={() => handleSectionClick('personnel')}
            loading={false}
            disabled={!isPersonnelVisible}
            storageKey={`card_menu_employees_${division.id}`}
          >
            {isScheduleVisibleForThisDivision && (
              <div
                className="schedule-link-card"
                onClick={() =>
                  navigate(`/employee-schedule?division=${division.id}`, {
                    state: {
                      divisionName: division.name,
                      fromDivisionPage: true,
                      from: `/divisions/${division.id}`,
                    },
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

            {isCandidatesVisibleForThisDivision && (
              <div
                className="schedule-link-card"
                onClick={() =>
                  navigate(`/candidates?division=${division.id}`, {
                    state: { from: `/divisions/${division.id}` },
                  })
                }
              >
                <div
                  className="schedule-link-icon"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
                >
                  <UserPlus size={28} />
                </div>
                <div className="schedule-link-text">
                  <span className="schedule-link-title">Кандидаты</span>
                  <span className="schedule-link-sub">
                    {candidatesLoading
                      ? 'Загрузка…'
                      : `${candidatesCount ?? 0} в работе`}
                  </span>
                </div>
              </div>
            )}
          </StatCard>

          <StatCard
            title="Техника"
            count={isEquipmentVisible ? equipmentCount : null}
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
                    from: 'division-overview',
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
            count={isFacilitiesVisible ? facilitiesCount : null}
            icon={Building2}
            iconColor="#888676"
            details={[]}
            onClick={() => handleSectionClick('facilities')}
            loading={false}
            disabled={!isFacilitiesVisible}
          />

          <StatCard
            title="Сети связи"
            count={isNetworksVisible ? networksCount : null}
            icon={RadioTower}
            iconColor="#70b3d0"
            details={[]}
            onClick={() => handleSectionClick('networks')}
            loading={false}
            disabled={!isNetworksVisible}
          />

          <StatCard
            title="Задачи"
            count={isTasksVisible ? incompleteTasksCount : null}
            icon={ListTodo}
            iconColor="#f97316"
            details={[]}
            onClick={() => handleSectionClick('tasks')}
            loading={false}
            disabled={!isTasksVisible}
          />
        </div>
      )}

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