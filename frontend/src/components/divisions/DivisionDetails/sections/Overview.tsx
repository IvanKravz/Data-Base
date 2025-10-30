// Overview.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Users, Plug, Building2, ListTodo, RadioTower } from 'lucide-react';
import { Division } from '../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { StatCard } from './StatCard';
import { SubdivisionsList } from './SubdivisionsList';
import { employeesApi, tasksApi } from '../../../../api';
import { setPersonnel } from '../../../../store/slices/personnelSlice';
import { isExploitationEmployee } from '../../../../api/utils/permissions';
import './style.css';

interface OverviewProps {
  division: Division;
}

export function Overview({ division }: OverviewProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [incompleteTasksCount, setIncompleteTasksCount] = useState<number | null>(null);

  // Проверяем, является ли пользователь сотрудником эксплуатации
  const isExploitationEmp = isExploitationEmployee();

  const handleSectionClick = (section: string, subdivisionId?: string) => {
    const path = subdivisionId
      ? `/divisions/${id}/${section}?subdivision=${subdivisionId}`
      : `/divisions/${id}/${section}`;
    navigate(path);
  };

  useEffect(() => {
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
  }, [token, dispatch, division.id]);

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
        <StatCard
          title="Сотрудники"
          count={loading ? null : division.employees_count}
          icon={Users}
          iconColor="#4d5edb"
          details={[]}
          onClick={() => handleSectionClick('personnel')}
          loading={loading}
        />

        <StatCard
          title="Техника"
          count={loading ? null : division.equipment_count}
          icon={Plug}
          iconColor="#727fdf"
          details={[]}
          onClick={() => handleSectionClick('equipment')}
          loading={loading}
        />

        <StatCard
          title="Объекты"
          count={loading ? null : division.facilities_count}
          icon={Building2}
          iconColor="#4b974a"
          details={[]}
          onClick={() => handleSectionClick('facilities')}
          loading={loading}
        />

        <StatCard
          title="Сети связи"
          count={loading ? null : division.networks_count}
          icon={RadioTower}
          iconColor="#70b3d0"
          details={[]}
          onClick={() => handleSectionClick('networks')}
          loading={loading}
        />

        <StatCard
          title="Задачи"
          count={tasksLoading ? null : incompleteTasksCount}
          icon={ListTodo}
          iconColor="#f97316"
          details={[]}
          onClick={() => handleSectionClick('tasks')}
          loading={tasksLoading}
        />
      </div>

      {/* Скрываем SubdivisionsList для сотрудника эксплуатации */}
      {!isExploitationEmp && <SubdivisionsList division={division} />}
    </div>
  );
}