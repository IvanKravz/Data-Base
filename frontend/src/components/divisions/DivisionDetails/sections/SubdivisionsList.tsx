// SubdivisionsList.tsx
import React, { useEffect, useState } from 'react';
import { Users, Plug, Building2, ListTodo, Phone, Smartphone } from 'lucide-react';
import { Division } from '../../../../types';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../../../../api/tasks';
import { employeesApi } from '../../../../api/employees';
import { equipmentApi } from '../../../../api/equipment';
import { facilitiesApi } from '../../../../api/facilities';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';

// Маркеры фильтров (соответствуют бэкендным)
const USER_DIVISION_MARKER = '__user_division_id__';
const USER_SUBDIVISION_MARKER = '__user_subdivision_id__';

interface SubdivisionsListProps {
    division: Division;
}

/** Приводит ответ API (array или {results}) к массиву. */
const asArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
};

/** Группирует элементы по subdivision.id, возвращает Record<string, number>. */
const groupBySubdivision = (items: any[]): Record<string, number> => {
    const acc: Record<string, number> = {};
    for (const item of items) {
        const key = item?.subdivision?.id != null ? String(item.subdivision.id) : 'no-subdivision';
        acc[key] = (acc[key] ?? 0) + 1;
    }
    return acc;
};

/** Отображает число: 0 → «—», иначе — число. */
const formatCount = (value: number | null | undefined): string | number => {
    if (value === null || value === undefined) return '—';
    return value > 0 ? value : '—';
};

const isVisibleForSubdivision = (
    canAccess: boolean,
    filters: any,
    divisionId: number,
    subdivisionId: number,
    userDivisionId: number | null,
    userSubdivisionId: number | null,
): boolean => {
    if (!canAccess) return false;
    if (!filters) return true;

    // filters может быть dict или list[dict]. list — OR альтернатив.
    const alternatives: any[] = Array.isArray(filters) ? filters : [filters];

    for (const alt of alternatives) {
        if (!alt || typeof alt !== 'object') continue;

        let matches = true;

        // Проверка division_id
        const divValue = alt.division_id;
        if (divValue !== undefined && divValue !== null) {
            let actual: number | null = null;
            if (divValue === USER_DIVISION_MARKER) {
                actual = userDivisionId;
            } else {
                const n = Number(divValue);
                actual = Number.isFinite(n) ? n : null;
            }
            if (actual === null || actual !== divisionId) matches = false;
        }

        // Проверка subdivision_id
        if (matches) {
            const subValue = alt.subdivision_id;
            if (subValue !== undefined && subValue !== null) {
                let actual: number | null = null;
                if (subValue === USER_SUBDIVISION_MARKER) {
                    actual = userSubdivisionId;
                } else {
                    const n = Number(subValue);
                    actual = Number.isFinite(n) ? n : null;
                }
                if (actual === null || actual !== subdivisionId) matches = false;
            }
        }

        if (matches) return true;
    }

    return false;
};

export function SubdivisionsList({ division }: SubdivisionsListProps) {
    const {
        canAccessPersonnel,
        canAccessEquipment,
        canAccessFacilities,
        canAccessTasks,
        personnelFilters,
        equipmentFilters,
        facilitiesFilters,
        taskFilters,
        getCurrentUser,
    } = useAppPermissions();

    const navigate = useNavigate();
    const subdivisions = division.subdivisions || [];

    const token = localStorage.getItem('accessToken');

    // Счётчики задач (запрашиваются отдельно, по каждому подразделению)
    const [tasksCounts, setTasksCounts] = useState<Record<string, number>>({});

    // Счётчики сотрудников / техники / объектов — считаем на клиенте из API,
    // чтобы применялись те же ролевые фильтры, что и в списках.
    const [personnelBySub, setPersonnelBySub] = useState<Record<string, number>>({});
    const [equipmentBySub, setEquipmentBySub] = useState<Record<string, number>>({});
    const [facilitiesBySub, setFacilitiesBySub] = useState<Record<string, number>>({});

    const [loading, setLoading] = useState(true);

    const currentUser = getCurrentUser();
    const userDivisionId = currentUser?.division_info?.id ?? null;
    const userSubdivisionId = currentUser?.division_info?.subdivision?.id ?? null;

    // === Загрузка счётчиков сотрудников/техники/объектов ===
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchAll = async () => {
            setLoading(true);
            try {
                // Сотрудники — все доступные роли; группируем по subdivision.id.
                const employeesPromise = canAccessPersonnel()
                    ? employeesApi.getPersonnel(token, {})
                    : Promise.resolve([]);

                // Техника — все доступные роли; списанные (status='disposed') исключаем.
                const equipmentPromise = canAccessEquipment()
                    ? equipmentApi.getEquipment(token, {})
                    : Promise.resolve([]);

                // Объекты — все доступные роли; is_closed здесь не фильтруем
                // (это признак «защищённости», а не списания).
                const facilitiesPromise = canAccessFacilities()
                    ? facilitiesApi.getFacilities({ token })
                    : Promise.resolve([]);

                const [employees, equipment, facilities] = await Promise.all([
                    employeesPromise,
                    equipmentPromise,
                    facilitiesPromise,
                ]);

                if (cancelled) return;

                const empList = asArray(employees);
                const eqList = asArray(equipment).filter(
                    (e: any) => e?.status !== 'disposed',
                );
                const facList = asArray(facilities);

                setPersonnelBySub(groupBySubdivision(empList));
                setEquipmentBySub(groupBySubdivision(eqList));
                setFacilitiesBySub(groupBySubdivision(facList));
            } catch (err) {
                console.error('Ошибка загрузки счётчиков подразделений:', err);
            }
        };

        fetchAll();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, division.id]);

    // === Счётчики задач (отдельным запросом на каждое отделение) ===
    useEffect(() => {
        const fetchTasksCounts = async () => {
            const counts: Record<string, number> = {};
            for (const sub of subdivisions) {
                const hasAccess = isVisibleForSubdivision(
                    canAccessTasks(),
                    taskFilters,
                    division.id,
                    sub.id,
                    userDivisionId,
                    userSubdivisionId,
                );
                if (!hasAccess) {
                    counts[sub.id] = 0;
                    continue;
                }
                try {
                    const count = await tasksApi.getIncompleteTasksCount({ subdivisionId: sub.id });
                    counts[sub.id] = count;
                } catch (err) {
                    console.error(`Ошибка загрузки задач для подразделения ${sub.id}:`, err);
                    counts[sub.id] = 0;
                }
            }
            setTasksCounts(counts);
            setLoading(false);
        };

        if (subdivisions.length > 0) {
            fetchTasksCounts();
        } else {
            setLoading(false);
        }
    }, [subdivisions, division.id, canAccessTasks, taskFilters, userDivisionId, userSubdivisionId]);

    const handleSectionClick = (
        section: string,
        subdivisionId: string,
        subdivisionName: string
    ) => {
        navigate(`/divisions/${division.id}/${section}?subdivision=${subdivisionId}`, {
            state: {
                activeTab: 'all',
                subdivisionId: subdivisionId,
                divisionId: division.id,
                subdivisionName: subdivisionName,
                fromSubdivision: true,
            },
        });
    };

    const handleMetricClick = (
        e: React.MouseEvent,
        section: string,
        subId: string,
        subName: string,
        disabled: boolean
    ) => {
        e.stopPropagation();
        if (disabled) return;
        handleSectionClick(section, subId, subName);
    };

    if (subdivisions.length === 0) return null;

    return (
        <div className="division-subdivisions-section">
            <div className="division-subdivisions-cards">
                {subdivisions.map((sub) => {
                    const subIdStr = String(sub.id);

                    const canViewPersonnel = isVisibleForSubdivision(
                        canAccessPersonnel(),
                        personnelFilters,
                        division.id,
                        sub.id,
                        userDivisionId,
                        userSubdivisionId,
                    );
                    const canViewEquipment = isVisibleForSubdivision(
                        canAccessEquipment(),
                        equipmentFilters,
                        division.id,
                        sub.id,
                        userDivisionId,
                        userSubdivisionId,
                    );
                    const canViewFacilities = isVisibleForSubdivision(
                        canAccessFacilities(),
                        facilitiesFilters,
                        division.id,
                        sub.id,
                        userDivisionId,
                        userSubdivisionId,
                    );
                    const canViewTasks = isVisibleForSubdivision(
                        canAccessTasks(),
                        taskFilters,
                        division.id,
                        sub.id,
                        userDivisionId,
                        userSubdivisionId,
                    );

                    const metrics = [
                        {
                            label: 'Сотрудники',
                            value: canViewPersonnel
                                ? (loading ? '...' : formatCount(personnelBySub[subIdStr]))
                                : '—',
                            icon: Users,
                            section: 'personnel',
                            disabled: !canViewPersonnel,
                        },
                        {
                            label: 'Техника',
                            value: canViewEquipment
                                ? (loading ? '...' : formatCount(equipmentBySub[subIdStr]))
                                : '—',
                            icon: Plug,
                            section: 'equipment',
                            disabled: !canViewEquipment,
                        },
                        {
                            label: 'Объекты',
                            value: canViewFacilities
                                ? (loading ? '...' : formatCount(facilitiesBySub[subIdStr]))
                                : '—',
                            icon: Building2,
                            section: 'facilities',
                            disabled: !canViewFacilities,
                        },
                        {
                            label: 'Задачи',
                            value: canViewTasks
                                ? (loading ? '...' : formatCount(tasksCounts[sub.id]))
                                : '—',
                            icon: ListTodo,
                            section: 'tasks',
                            disabled: !canViewTasks,
                        },
                    ];

                    const head = sub.head;

                    return (
                        <div key={sub.id} className="subdivision-card">
                            <div className="subdivision-card-top">
                                <div className="subdivision-leaders" onClick={(e) => e.stopPropagation()}>
                                    {head && (
                                        <div className="subdivision-leader">
                                            <div className="subdivision-leader-info">
                                                {head.position && (
                                                    <span className="subdivision-leader-position">
                                                        {head.position}
                                                    </span>
                                                )}
                                                <span className="subdivision-leader-name">
                                                    {head.full_name}
                                                </span>
                                                <div className="subdivision-leader-phones">
                                                    {head.work_phone && (
                                                        <span>
                                                            <Phone size={11} /> Рабочий: {head.work_phone}
                                                        </span>
                                                    )}
                                                    {head.personal_phone && (
                                                        <span>
                                                            <Smartphone size={11} /> Личный: {head.personal_phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className="subdivision-card-name">{sub.name}</span>
                            </div>

                            <div className="subdivision-card-metrics">
                                {metrics.map(({ label, value, icon: Icon, section, disabled }) => (
                                    <div
                                        className={`subdivision-metric ${disabled ? 'disabled' : ''}`}
                                        key={label}
                                        onClick={(e) =>
                                            handleMetricClick(e, section, sub.id, sub.name, disabled)
                                        }
                                        title={disabled ? 'Нет доступа' : `Перейти в раздел «${label}»`}
                                    >
                                        <Icon size={16} className="subdivision-metric-icon" />
                                        <span className="subdivision-metric-value">{value}</span>
                                        <span className="subdivision-metric-label">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}