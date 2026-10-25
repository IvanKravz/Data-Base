import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plug,
  Building2,
  ListTodo,
  RadioTower,
  Map as MapIcon,
  ChevronDown,
  Phone,
  Smartphone,
  ArrowRight,
  Activity,
  Search,
} from 'lucide-react';
import { Division, Employee } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { divisionsApi } from '../../../api/divisions';
import { employeesApi } from '../../../api/employees';
import { MapCountry } from '../../map/MapCountry/MapCountry';
import { useAppPermissions } from '../../../api/utils/AppPermissionsContext';
import './style.css';
import '../DivisionDetails/sections/DivisionLeadership/DivisionLeadership.css';
import '../DivisionDetails/sections/style.css';

interface DivisionListProps {
  onSelectDivision: (division: Division) => void;
}

const isVisibleForDivision = (
  canAccess: boolean,
  filters: any,
  divisionId: number,
): boolean => {
  if (!canAccess) return false;
  if (!filters) return true;
  if (filters.division_id && filters.division_id !== divisionId) return false;
  if (filters.subdivision_id) return false;
  return true;
};

const safeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function DivisionList({ onSelectDivision }: DivisionListProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [chief, setChief] = useState<Employee | null>(null);
  const [deputies, setDeputies] = useState<Employee[]>([]);
  const [loadingLeadership, setLoadingLeadership] = useState(true);

  const {
    canAccessPersonnel,
    canAccessEquipment,
    canAccessFacilities,
    canAccessTasks,
    canAccessNetworks,
    personnelFilters,
    equipmentFilters,
    facilitiesFilters,
    taskFilters,
    networksFilters,
  } = useAppPermissions();

  // ── Видимость карты с сохранением в localStorage ────────────────
  const [showMap, setShowMap] = useState<boolean>(() => {
    const stored = localStorage.getItem('map_visible_divisionlist');
    return stored !== null ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem('map_visible_divisionlist', JSON.stringify(showMap));
  }, [showMap]);

  const toggleMap = () => setShowMap((prev) => !prev);

  // ── Загрузка подразделений ──────────────────────────────────────
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

  // ── Загрузка руководства ────────────────────────────────────────
  useEffect(() => {
    const fetchLeadership = async () => {
      if (!token) {
        setLoadingLeadership(false);
        return;
      }
      try {
        const allEmployees = await employeesApi.getPersonnel(token);
        const chiefData =
          allEmployees.find((emp) => emp.position === 'Главный руководитель') ?? null;
        const deputyData = allEmployees.filter(
          (emp) => emp.position === 'Заместитель главного руководителя',
        );
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

  // ── Агрегат по службе ───────────────────────────────────────────
  const aggregate = useMemo(() => {
    const compute = (
      canAccess: boolean,
      filters: any,
      field: keyof Division,
    ): number | null => {
      if (!canAccess) return null;
      let total = 0;
      for (const d of divisions) {
        if (!isVisibleForDivision(true, filters, d.id)) continue;
        total += safeNumber((d as any)[field]);
      }
      return total;
    };

    return {
      employees: compute(canAccessPersonnel(), personnelFilters, 'employees_count'),
      equipment: compute(canAccessEquipment(), equipmentFilters, 'equipment_count'),
      facilities: compute(canAccessFacilities(), facilitiesFilters, 'facilities_count'),
      networks: compute(canAccessNetworks(), networksFilters, 'networks_count'),
      tasks: compute(canAccessTasks(), taskFilters, 'tasks_count'),
    };
  }, [
    divisions,
    canAccessPersonnel,
    canAccessEquipment,
    canAccessFacilities,
    canAccessTasks,
    canAccessNetworks,
    personnelFilters,
    equipmentFilters,
    facilitiesFilters,
    taskFilters,
    networksFilters,
  ]);

  const kpiCards = useMemo(
    () =>
      (
        [
          { key: 'employees', label: 'Сотрудники', icon: Users, color: '#4d5edb', visible: canAccessPersonnel() },
          { key: 'equipment', label: 'Техника', icon: Plug, color: '#10b981', visible: canAccessEquipment() },
          { key: 'facilities', label: 'Объекты', icon: Building2, color: '#888676', visible: canAccessFacilities() },
          { key: 'networks', label: 'Сети связи', icon: RadioTower, color: '#70b3d0', visible: canAccessNetworks() },
          { key: 'tasks', label: 'Задачи', icon: ListTodo, color: '#f97316', visible: canAccessTasks() },
        ] as const
      ).filter((c) => c.visible),
    [canAccessPersonnel, canAccessEquipment, canAccessFacilities, canAccessNetworks, canAccessTasks],
  );

  // ── Поиск по названию ───────────────────────────────────────────
  const filteredDivisions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return divisions;
    return divisions.filter((d) => d.name.toLowerCase().includes(q));
  }, [divisions, search]);

  // ── Навигация ───────────────────────────────────────────────────
  const openDivision = (division: Division) => {
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
            {!leader.work_phone && !leader.personal_phone && <span>—</span>}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-divisions">Загрузка подразделений…</div>;
  }
  if (error) {
    return <div className="loading-divisions">{error}</div>;
  }

  const hasLeadership = !!(chief || deputies.length > 0);

  return (
    <>
      {/* 1. Руководство службы */}
      {!loadingLeadership && hasLeadership && (
        <div className="leadership-section">
          <div className="division-subheader-hh">
            <Users className="subheader-icon subheader-icon--blue" size={22} />
            <span>Руководство</span>
          </div>
          <div className="leadership-cards">
            {renderLeaderCard(chief, 'Главный руководитель')}
            {deputies.map((deputy, index) => (
              <React.Fragment key={deputy.id ?? index}>
                {renderLeaderCard(deputy, 'Заместитель главного руководителя')}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* 2. Сводка по службе */}
      {kpiCards.length > 0 && (
        <section className="service-overview">
          <div className="division-subheader">
            <Activity className="subheader-icon subheader-icon--blue" size={22} />
            <span>Сводка по службе</span>
          </div>
          <div className="service-kpi-grid">
            {kpiCards.map(({ key, label, icon: Icon, color }) => {
              const value = aggregate[key];
              return (
                <div key={key} className="service-kpi-card">
                  <div
                    className="service-kpi-card__icon"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    <Icon size={22} />
                  </div>
                  <div className="service-kpi-card__body">
                    <div className="service-kpi-card__value">
                      {value !== null ? value.toLocaleString('ru-RU') : '—'}
                    </div>
                    <div className="service-kpi-card__label">{label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Подразделения — карточки + поиск */}
      <section className="divisions-section">
        <div className="divisions-section__head">
          <div className="division-subheader divisions-section__title">
            <Building2 className="subheader-icon subheader-icon--purple" size={22} />
            <span>Подразделения</span>
          </div>
          <div className="divisions-search">
            <Search size={16} className="divisions-search__icon" />
            <input
              type="search"
              className="divisions-search__input"
              placeholder="Поиск по названию…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Поиск подразделений"
            />
          </div>
        </div>

        {filteredDivisions.length === 0 ? (
          <div className="divisions-empty">Ничего не найдено</div>
        ) : (
          <div className="divisions-cards-grid">
            {filteredDivisions.map((division) => (
              <article
                key={division.id}
                className="division-overview-card"
                role="button"
                tabIndex={0}
                onClick={() => openDivision(division)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDivision(division);
                  }
                }}
                aria-label={`Подразделение ${division.name}${
                  division.head ? `, начальник ${division.head.full_name}` : ''
                }`}
              >
                <header className="division-overview-card__head">
                  <h3
                    className="division-overview-card__title"
                    title={division.name}
                  >
                    {division.name}
                  </h3>
                  <ArrowRight size={16} className="division-overview-card__arrow" />
                </header>

                {/* Раскрывается при hover/focus */}
                <div className="division-overview-card__leader">
                  <span className="division-overview-card__leader-label">
                    Начальник
                  </span>

                  {division.head ? (
                    <>
                      <span
                        className="division-overview-card__leader-name"
                        title={division.head.full_name}
                      >
                        {division.head.full_name}
                      </span>
                      <div className="division-overview-card__contacts">
                        {division.head.work_phone && (
                          <span>
                            <Phone size={12} /> {division.head.work_phone}
                          </span>
                        )}
                        {division.head.personal_phone && (
                          <span>
                            <Smartphone size={12} /> {division.head.personal_phone}
                          </span>
                        )}
                        {!division.head.work_phone &&
                          !division.head.personal_phone && <span>—</span>}
                      </div>
                    </>
                  ) : (
                    <span className="division-overview-card__leader-empty">
                      Не назначен
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 4. Карта */}
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
              <MapIcon className="subheader-icon subheader-icon--green" size={22} />
              <span>Территориальные органы ФСБ России</span>
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