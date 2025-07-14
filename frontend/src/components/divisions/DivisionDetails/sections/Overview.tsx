// Overview.tsx
import React from 'react';
import { useState, useEffect } from 'react';
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
  // Состояния для отслеживания загрузки и количества задач
  const [tasksLoading, setTasksLoading] = useState(true);
  const [incompleteTasksCount, setIncompleteTasksCount] = useState<number | null>(null);

  const params = {
    division: division.id,
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeesApi.getPersonnel(token, params);
        dispatch(setPersonnel(data));
      } catch (err) {
        setError('Failed to load personnel');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [token, dispatch]);

  //эффект для загрузки количества незавершенных задач
  useEffect(() => {
    const fetchTasksCount = async () => {
      try {
        const count = await tasksApi.getIncompleteTasksCount({ divisionId: division.id });
        setIncompleteTasksCount(count);
      } catch (err) {
        console.error('Failed to fetch incomplete tasks count', err);
        setIncompleteTasksCount(0); // В случае ошибки показываем 0
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasksCount();
  }, [division.id]);

  const handleSectionClick = (section: string, subdivisionId?: string) => {
    const path = subdivisionId
      ? `/divisions/${id}/${section}?subdivision=${subdivisionId}`
      : `/divisions/${id}/${section}`;
    navigate(path);
  };

  return (
    <div className="overview-container">
      <div className="stats-grid">
        <StatCard
          title="Сотрудники"
          count={loading ? null : division.employees_count}
          icon={Users}
          iconColor="blue"
          onClick={() => handleSectionClick('personnel')}
          loading={loading}
          order={0}
        />

        <StatCard
          title="Техника"
          count={loading ? null : division.equipment_count}
          icon={Plug}
          iconColor="purple"
          onClick={() => handleSectionClick('equipment')}
          loading={loading}
          order={1}
        />

        <StatCard
          title="Объекты"
          count={loading ? null : division.facilities_count}
          icon={Building2}
          iconColor="green"
          onClick={() => handleSectionClick('facilities')}
          loading={loading}
          order={2}
        />

        <StatCard
          title="Сети связи"
          count={loading ? null : division.facilities_count}
          icon={RadioTower}
          iconColor="yellow"
          onClick={() => handleSectionClick('networks')}
          loading={loading}
          order={3}
        />

        <StatCard
          title="Задачи"
          count={tasksLoading ? null : incompleteTasksCount}
          icon={ListTodo}
          iconColor="orange"
          onClick={() => handleSectionClick('tasks')}
          loading={tasksLoading}
          order={4}
        />
      </div>

      <SubdivisionsList
        division={division}
        handleSectionClick={handleSectionClick}
      />
    </div>
  );
}