// Overview.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Users, Plug, Building2, ListTodo, RadioTower } from 'lucide-react';
import { Division } from '../../../../types';
import { StatCard } from './StatCard';
import { SubdivisionsList } from './SubdivisionsList';
import { employeesApi, tasksApi } from '../../../../api';
import { setPersonnel } from '../../../../store/slices/personnelSlice';
import { isExploitationEmployee } from '../../../../api/utils/permissions';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';
import './style.css';

interface OverviewProps {
    division: Division;
}

// Вспомогательная функция: доступен ли раздел на уровне отдела
const isVisibleForDivision = (
    canAccess: boolean,
    filters: { division_id?: number } | null,
    divisionId: number
): boolean => {
    if (!canAccess) return false;
    if (!filters) return true;                     // нет фильтров – доступен
    if (filters.division_id && filters.division_id !== divisionId) return false;
    // Если есть subdivision_id, значит доступ ограничен конкретным подразделением,
    // карточку на уровне отдела показывать не нужно, т.к. она будет отображаться только на уровне подразделения.
    if (filters.subdivision_id) return false;
    return true;
};

export function Overview({ division }: OverviewProps) {
    const {
        canAccessPersonnel, canAccessEquipment, canAccessFacilities,
        canAccessTasks, canAccessNetworks,
        personnelFilters, equipmentFilters, facilitiesFilters,
        networksFilters, taskFilters,
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

    const isPersonnelVisible = isVisibleForDivision(canAccessPersonnel(), personnelFilters, division.id);
    const isEquipmentVisible = isVisibleForDivision(canAccessEquipment(), equipmentFilters, division.id);
    const isFacilitiesVisible = isVisibleForDivision(canAccessFacilities(), facilitiesFilters, division.id);
    const isNetworksVisible = isVisibleForDivision(canAccessNetworks(), networksFilters, division.id);
    const isTasksVisible = isVisibleForDivision(canAccessTasks(), taskFilters, division.id);

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
            return;
        }

        const fetchTasksCount = async () => {
            try {
                const count = await tasksApi.getIncompleteTasksCount({ divisionId: division.id });
                setIncompleteTasksCount(count);
            } catch (err: any) {
                console.error('Failed to fetch incomplete tasks count', err);
                setIncompleteTasksCount(0);
            } finally {
                setTasksLoading(false);
            }
        };

        fetchTasksCount();
    }, [division.id, isTasksVisible]);

    return (
        <div className="division-overview-container">
            <div className="division-stats-grid">
                {isPersonnelVisible && (
                    <StatCard
                        title="Сотрудники"
                        count={loading ? null : division.employees_count}
                        icon={Users}
                        iconColor="#4d5edb"
                        details={[]}
                        onClick={() => handleSectionClick('personnel')}
                        loading={loading}
                    />
                )}

                {isEquipmentVisible && (
                    <StatCard
                        title="Техника"
                        count={division.equipment_count}
                        icon={Plug}
                        iconColor="#10b981"
                        details={[]}
                        onClick={() => handleSectionClick('equipment')}
                        loading={false}
                    />
                )}

                {isFacilitiesVisible && (
                    <StatCard
                        title="Объекты"
                        count={division.facilities_count}
                        icon={Building2}
                        iconColor="#888676"
                        details={[]}
                        onClick={() => handleSectionClick('facilities')}
                        loading={false}
                    />
                )}

                {isNetworksVisible && (
                    <StatCard
                        title="Сети связи"
                        count={division.networks_count}
                        icon={RadioTower}
                        iconColor="#70b3d0"
                        details={[]}
                        onClick={() => handleSectionClick('networks')}
                        loading={false}
                    />
                )}

                {isTasksVisible && (
                    <StatCard
                        title="Задачи"
                        count={tasksLoading ? null : incompleteTasksCount}
                        icon={ListTodo}
                        iconColor="#f97316"
                        details={[]}
                        onClick={() => handleSectionClick('tasks')}
                        loading={tasksLoading}
                    />
                )}
            </div>

            {!isExploitationEmp && <SubdivisionsList division={division} />}
        </div>
    );
}