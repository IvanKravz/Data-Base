import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Users, HardDrive, Building2, ListTodo } from 'lucide-react';
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
  activeSubdivision,
  onSubdivisionClick
}: OverviewProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Получаем данные из Redux store
  const equipment = useSelector((state: RootState) => state.equipment.equipment);
  const personnel = useSelector((state: RootState) => state.personnel.personnel);
  const facilities = useSelector((state: RootState) => state.facilities.facilities);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);

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
  
  // Фильтрация данных для текущего подразделения и подразделения (если выбрано)
  const filteredData = {
    equipment: equipment.filter(item => {
      const matchesDivision = item.division === division.id;
      const matchesSubdivision = !activeSubdivision || item.subdivision === activeSubdivision;
      return matchesDivision && matchesSubdivision;
    }),
    personnel: personnel.filter(person => {
      const matchesDivision = person.division === division.id;
      const matchesSubdivision = !activeSubdivision || person.subdivision === activeSubdivision;
      return matchesDivision && matchesSubdivision;
    }),
    facilities: facilities.filter(facility => {
      const matchesDivision = facility.division === division.id;
      const matchesSubdivision = !activeSubdivision || facility.subdivision === activeSubdivision;
      return matchesDivision && matchesSubdivision;
    }),
    tasks: tasks.filter(task => task.divisionId === division.id)
  };

  // Подсчет количества объектов
  const facilityCounts = {
    total: filteredData.facilities.length,
    open: filteredData.facilities.filter(f => f.type === 'station').length,
    closed: filteredData.facilities.filter(f => f.type === 'shd').length
  };

  // Функция для перехода на страницу секции
  const handleSectionClick = (section: string) => {
    navigate(`/divisions/${division.id}/${section}`);
  };

  return (
    <>
      <div className="stats-grid">
        {/* Карточка "Персонал" */}
        <StatCard
          title="Персонал"
          count={division.employees_count}
          icon={Users}
          iconColor="icon--blue"
          gradientClass="stat-card--blue"
          details={[
            {
              label: "МОЛ",
              value: filteredData.personnel.filter(p => p.is_material_responsible).length
            },
            {
              label: "ШаРаботники",
              value: filteredData.personnel.filter(p => p.is_sha_worker).length
            }
          ]}
          onClick={() => handleSectionClick('personnel')}
        />

        {/* Карточка "Техника" */}
        <StatCard
          title="Техника"
          count={division.equipment_count}
          icon={HardDrive}
          iconColor="icon--purple"
          gradientClass="stat-card--purple"
          details={[
            {
              label: "Открытая",
              value: filteredData.equipment.filter(e => e.category !== 'closed').length
            },
            {
              label: "Закрытая",
              value: filteredData.equipment.filter(e => e.category === 'closed').length
            }
          ]}
          onClick={() => handleSectionClick('equipment')}
        />

        {/* Карточка "Объекты" */}
        <StatCard
          title="Объекты"
          count={division.facilities_count}
          icon={Building2}
          iconColor="icon--green"
          gradientClass="stat-card--green"
          details={[
            {
              label: "Открытые",
              value: facilityCounts.open
            },
            {
              label: "Закрытые",
              value: facilityCounts.closed
            }
          ]}
          onClick={() => handleSectionClick('facilities')}
        />

        {/* Карточка "Задачи" */}
        <StatCard
          title="Задачи"
          count={division.tasks_count}
          icon={ListTodo}
          iconColor="icon--orange"
          gradientClass="stat-card--orange"
          details={[
            {
              label: "В работе",
              value: filteredData.tasks.filter(t => !t.steps.every(s => s.isCompleted)).length
            },
            {
              label: "Завершено",
              value: filteredData.tasks.filter(t => t.steps.every(s => s.isCompleted)).length
            }
          ]}
          onClick={() => handleSectionClick('tasks')}
        />
      </div>

      {/* Список подразделений (если не выбрано активное подразделение) */}
      {!activeSubdivision && (
        <SubdivisionsList
          division={division}
          onSubdivisionClick={onSubdivisionClick}
          equipment={equipment}
          personnel={personnel}
          facilities={facilities}
          tasks={tasks}
        />
      )}
    </>
  );
}