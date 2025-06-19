import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Users, Plug, Building2, ListTodo } from 'lucide-react';
import { Division, Employee } from '../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { StatCard } from './StatCard';
import { SubdivisionsList } from './SubdivisionsList';
import { employeesApi } from '../../../../api';
import { setPersonnel } from '../../../../store/slices/personnelSlice';
import './style.css'

interface OverviewProps {
  division: Division;
  activeSubdivision: string | null;
  onSubdivisionClick: (subdivisionName: string) => void;
}

export function Overview({
  division,
}: OverviewProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Получаем данные из Redux store
  const equipment = useSelector((state: RootState) => state.equipment.equipment);
  const personnel = useSelector((state: RootState) => state.personnel.personnel);
  const facilities = useSelector((state: RootState) => state.facilities.facilities);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const params = {
    division: division.id,
  };

  // Загрузка данных о персонале
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeesApi.getPersonnel(token, params);
        dispatch(setPersonnel(data));
      } catch (err) {
        setError('Не удалось загрузить подразделения');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [token, dispatch]);

  // Функция для перехода на страницу секции
  const handleSectionClick = (section: string, subdivisionId: string) => {{
    const path = subdivisionId 
      ? `/divisions/${id}/${section}?subdivision=${subdivisionId}`
      : `/divisions/${id}/${section}`;
    navigate(path);
  }}

  return (
    <>
      <div className="stats-grid">
        {/* Карточка "Персонал" */}
        <StatCard
          title="Персонал"
          count={loading ? null : division.employees_count}
          icon={Users}
          iconColor="icon--blue"
          gradientClass="stat-card--blue"
          onClick={() => handleSectionClick('personnel')}
          loading={loading}
          style={{ "--order": 0 }}
        />

        {/* Карточка "Техника" */}
        <StatCard
          title="Техника"
          count={loading ? null : division.equipment_count}
          icon={Plug}
          iconColor="icon--purple"
          gradientClass="stat-card--purple"
          onClick={() => handleSectionClick('equipment')}
          loading={loading}
          style={{ "--order": 1 }}
        />

        {/* Карточка "Объекты" */}
        <StatCard
          title="Объекты"
          count={loading ? null : division.facilities_count}
          icon={Building2}
          iconColor="icon--green"
          gradientClass="stat-card--green"
          onClick={() => handleSectionClick('facilities')}
          loading={loading}
          style={{ "--order": 2 }}
        />

        {/* Карточка "Задачи" */}
        <StatCard
          title="Задачи"
          count={loading ? null : division.tasks_count}
          icon={ListTodo}
          iconColor="icon--orange"
          gradientClass="stat-card--orange"
          onClick={() => handleSectionClick('tasks')}
          loading={loading}
          style={{ "--order": 3 }}
        />
      </div>

      {/* Список подразделений (если не выбрано активное подразделение) */}
        <SubdivisionsList
          division={division}
          handleSectionClick={handleSectionClick}
          equipment={equipment}
          personnel={personnel}
          facilities={facilities}
          tasks={tasks}
        />
    </>
  );
}