import React, { useEffect, useState } from 'react';
import { Users, Plug, Building2, ListTodo } from 'lucide-react';
import { Division } from '../../../../types';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../../../../api/tasks';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';

interface SubdivisionsListProps {
    division: Division;
}

const isVisibleForSubdivision = (
    canAccess: boolean,
    filters: { division_id?: number; subdivision_id?: number } | null,
    divisionId: number,
    subdivisionId: number
): boolean => {
    if (!canAccess) return false;
    if (!filters) return true;
    if (filters.division_id && filters.division_id !== divisionId) return false;
    if (filters.subdivision_id && filters.subdivision_id !== subdivisionId) return false;
    return true;
};

export function SubdivisionsList({ division }: SubdivisionsListProps) {
    const {
        canAccessPersonnel, canAccessEquipment, canAccessFacilities, canAccessTasks,
        personnelFilters, equipmentFilters, facilitiesFilters, taskFilters,
    } = useAppPermissions();

    const navigate = useNavigate();
    const subdivisions = division.subdivisions || [];
    const [tasksCounts, setTasksCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasksCounts = async () => {
            const counts: Record<string, number> = {};
            for (const sub of subdivisions) {
                const hasAccess = isVisibleForSubdivision(
                    canAccessTasks(),
                    taskFilters,
                    division.id,
                    sub.id
                );
                if (!hasAccess) continue;
                try {
                    const count = await tasksApi.getIncompleteTasksCount({ subdivisionId: sub.id });
                    counts[sub.id] = count;
                } catch (err) {
                    console.error(`Ошибка загрузки задач для подразделения ${sub.id}:`, err);
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
    }, [subdivisions, division.id, canAccessTasks, taskFilters]);

    const handleSectionClick = (section: string, subdivisionId?: string, disabled?: boolean) => {
        if (disabled) return;
        const path = subdivisionId
            ? `/divisions/${division.id}/${section}?subdivision=${subdivisionId}`
            : `/divisions/${division.id}/${section}`;
        const targetSubdivision = subdivisionId
            ? subdivisions.find(sub => sub.id === subdivisionId)
            : null;

        navigate(path, {
            state: {
                activeTab: 'all',
                subdivisionId: subdivisionId,
                divisionId: division.id,
                subdivisionName: targetSubdivision?.name,
                fromSubdivision: !!subdivisionId,
            },
        });
    };

    if (subdivisions.length === 0) return null;

    return (
        <div className="division-subdivisions-section">
            <h2 className="division-section-title">Отделения</h2>
            <div className="division-subdivisions-grid">
                {subdivisions.map((subdivision, index) => {
                    const showPersonnel = isVisibleForSubdivision(
                        canAccessPersonnel(),
                        personnelFilters,
                        division.id,
                        subdivision.id
                    );
                    const showEquipment = isVisibleForSubdivision(
                        canAccessEquipment(),
                        equipmentFilters,
                        division.id,
                        subdivision.id
                    );
                    const showFacilities = isVisibleForSubdivision(
                        canAccessFacilities(),
                        facilitiesFilters,
                        division.id,
                        subdivision.id
                    );
                    const showTasks = isVisibleForSubdivision(
                        canAccessTasks(),
                        taskFilters,
                        division.id,
                        subdivision.id
                    );

                    return (
                        <div
                            key={subdivision.id}
                            className="division-subdivision-card"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="division-subdivision-header">
                                <h3 className="division-subdivision-name">{subdivision.name}</h3>
                            </div>

                            <div className="division-subdivision-metrics">
                                <div
                                    className={`division-metric-item ${!showPersonnel ? 'disabled' : ''}`}
                                    onClick={() => handleSectionClick('personnel', subdivision.id, !showPersonnel)}
                                >
                                    <div className="division-metric-icon-container">
                                        <Users className="division-metric-icon" />
                                    </div>
                                    <div className="division-metric-info">
                                        <span className="division-metric-label">Сотрудники</span>
                                        <span className="division-metric-value">{subdivision.employees_count}</span>
                                    </div>
                                </div>

                                <div
                                    className={`division-metric-item ${!showEquipment ? 'disabled' : ''}`}
                                    onClick={() => handleSectionClick('equipment', subdivision.id, !showEquipment)}
                                >
                                    <div className="division-metric-icon-container">
                                        <Plug className="division-metric-icon" />
                                    </div>
                                    <div className="division-metric-info">
                                        <span className="division-metric-label">Техника</span>
                                        <span className="division-metric-value">{subdivision.equipment_count}</span>
                                    </div>
                                </div>

                                <div
                                    className={`division-metric-item ${!showFacilities ? 'disabled' : ''}`}
                                    onClick={() => handleSectionClick('facilities', subdivision.id, !showFacilities)}
                                >
                                    <div className="division-metric-icon-container">
                                        <Building2 className="division-metric-icon" />
                                    </div>
                                    <div className="division-metric-info">
                                        <span className="division-metric-label">Объекты</span>
                                        <span className="division-metric-value">{subdivision.facilities_count}</span>
                                    </div>
                                </div>

                                <div
                                    className={`division-metric-item ${!showTasks ? 'disabled' : ''}`}
                                    onClick={() => handleSectionClick('tasks', subdivision.id, !showTasks)}
                                >
                                    <div className="division-metric-icon-container">
                                        <ListTodo className="division-metric-icon" />
                                    </div>
                                    <div className="division-metric-info">
                                        <span className="division-metric-label">Задачи</span>
                                        <span className="division-metric-value">
                                            {loading ? '...' : tasksCounts[subdivision.id] ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}