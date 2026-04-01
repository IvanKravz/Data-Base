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
            setIncompleteTasksCount(null);
            return;
        }
        const fetchTasksCount = async () => {
            try {
                const count = await tasksApi.getIncompleteTasksCount({ divisionId: division.id });
                setIncompleteTasksCount(count);
            } catch (err: any) {
                console.error('Failed to fetch incomplete tasks count', err);
                setIncompleteTasksCount(null);
            } finally {
                setTasksLoading(false);
            }
        };
        fetchTasksCount();
    }, [division.id, isTasksVisible]);

    // Определяем, какое число показывать в каждой карточке
    const getCount = (visible: boolean, value: number | null | undefined, isLoading: boolean): number | null => {
        if (!visible) return null;          // нет прав → прочерк
        if (isLoading) return null;         // идёт загрузка → спиннер
        return value !== undefined ? value : null;
    };

    return (
        <div className="division-overview-container">
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
                />

                <StatCard
                    title="Техника"
                    count={getCount(isEquipmentVisible, division.equipment_count, false)}
                    icon={Plug}
                    iconColor="#10b981"
                    details={[]}
                    onClick={() => handleSectionClick('equipment')}
                    loading={false}
                    disabled={!isEquipmentVisible}
                />

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

            {!isExploitationEmp && <SubdivisionsList division={division} />}
        </div>
    );
}