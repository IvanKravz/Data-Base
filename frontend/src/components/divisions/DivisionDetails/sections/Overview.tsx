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
import { employeesApi } from '../../../../api';
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
          count={loading ? null : division.tasks_count}
          icon={ListTodo}
          iconColor="orange"
          onClick={() => handleSectionClick('tasks')}
          loading={loading}
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