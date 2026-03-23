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

export function Overview({ division }: OverviewProps) {
  const { canAccessPersonnel, canAccessEquipment, canAccessFacilities, canAccessTasks, canAccessNetworks } = useAppPermissions();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [incompleteTasksCount, setIncompleteTasksCount] = useState<number | null>(null);
  const isExploitationEmp = isExploitationEmployee();

  const handleSectionClick = (section: string, subdivisionId?: string) => {
    const path = subdivisionId
      ? `/divisions/${id}/${section}?subdivision=${subdivisionId}`
      : `/divisions/${id}/${section}`;
    navigate(path);
  };

  // Загрузка сотрудников – только если есть права
  useEffect(() => {
    if (!canAccessPersonnel()) {
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
  }, [token, dispatch, division.id, canAccessPersonnel]);

  // Загрузка задач – всегда, так как у tech_section_1_1 есть права на Task
  useEffect(() => {
    const fetchTasksCount = async () => {
      try {
        const count = await tasksApi.getIncompleteTasksCount({ divisionId: division.id });
        setIncompleteTasksCount(count);
      } catch (err) {
        console.error('Failed to fetch incomplete tasks count', err);
        setIncompleteTasksCount(0);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasksCount();
  }, [division.id]);

  return (
    <div className="division-overview-container">
      <div className="division-stats-grid">
        {canAccessPersonnel() && (
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

        {canAccessEquipment() && (
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

        {canAccessFacilities() && (
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

        {canAccessNetworks() && (
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

        {canAccessTasks() && (
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