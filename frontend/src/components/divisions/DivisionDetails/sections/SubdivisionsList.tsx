// SubdivisionsList.tsx
import React, { useEffect, useState } from 'react';
import { Users, Plug, Building2, ListTodo, Phone, Smartphone } from 'lucide-react';
import { Division } from '../../../../types';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../../../../api/tasks';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';

// Маркеры фильтров (соответствуют бэкендным)
const USER_DIVISION_MARKER = '__user_division_id__';
const USER_SUBDIVISION_MARKER = '__user_subdivision_id__';

interface SubdivisionsListProps {
    division: Division;
}

const isVisibleForSubdivision = (
    canAccess: boolean,
    filters: { division_id?: number | string; subdivision_id?: number | string } | null,
    divisionId: number,
    subdivisionId: number,
    userDivisionId: number | null,
    userSubdivisionId: number | null,
): boolean => {
    if (!canAccess) return false;
    if (!filters) return true;

    // Проверка division_id
    if (filters.division_id !== undefined && filters.division_id !== null) {
        const filterValue = filters.division_id;
        let actualDivisionId: number | null = null;
        if (filterValue === USER_DIVISION_MARKER) {
            actualDivisionId = userDivisionId;
        } else if (typeof filterValue === 'number') {
            actualDivisionId = filterValue;
        }
        if (actualDivisionId === null || actualDivisionId !== divisionId) {
            return false;
        }
    }

    // Проверка subdivision_id
    if (filters.subdivision_id !== undefined && filters.subdivision_id !== null) {
        const filterValue = filters.subdivision_id;
        let actualSubdivisionId: number | null = null;
        if (filterValue === USER_SUBDIVISION_MARKER) {
            actualSubdivisionId = userSubdivisionId;
        } else if (typeof filterValue === 'number') {
            actualSubdivisionId = filterValue;
        }
        if (actualSubdivisionId === null || actualSubdivisionId !== subdivisionId) {
            return false;
        }
    }

    return true;
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
    const [tasksCounts, setTasksCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    const currentUser = getCurrentUser();
    const userDivisionId = currentUser?.division_info?.id ?? null;
    const userSubdivisionId = currentUser?.division_info?.subdivision?.id ?? null;

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
                                ? (loading ? '...' : sub.employees_count ?? 0)
                                : 0,
                            icon: Users,
                            section: 'personnel',
                            disabled: !canViewPersonnel,
                        },
                        {
                            label: 'Техника',
                            value: canViewEquipment
                                ? (loading ? '...' : sub.equipment_count ?? 0)
                                : 0,
                            icon: Plug,
                            section: 'equipment',
                            disabled: !canViewEquipment,
                        },
                        {
                            label: 'Объекты',
                            value: canViewFacilities
                                ? (loading ? '...' : sub.facilities_count ?? 0)
                                : 0,
                            icon: Building2,
                            section: 'facilities',
                            disabled: !canViewFacilities,
                        },
                        {
                            label: 'Задачи',
                            value: canViewTasks
                                ? (loading ? '...' : tasksCounts[sub.id] ?? 0)
                                : 0,
                            icon: ListTodo,
                            section: 'tasks',
                            disabled: !canViewTasks,
                        },
                    ];

                    const head = sub.head;
                    const deputy = sub.deputy_head;

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