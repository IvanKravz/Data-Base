// SubdivisionsList.tsx
import React, { useEffect, useState } from 'react';
import { Users, Plug, Building2, ListTodo } from 'lucide-react';
import { Division } from '../../../../types';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../../../../api/tasks';

interface SubdivisionsListProps {
  division: Division;
  handleSectionClick: (section: string, subdivisionId?: string) => void;
}

export function SubdivisionsList({
  division,
  handleSectionClick
}: SubdivisionsListProps) {
  const navigate = useNavigate();
  const subdivisions = division.subdivisions || [];
  const [tasksCounts, setTasksCounts] = useState<Record<string, number>>({});

  if (subdivisions.length === 0) {
    return null;
  }

  useEffect(() => {
    const fetchTasksCounts = async () => {
      const counts: Record<string, number> = {};
      for (const sub of subdivisions) {
        // Используем обновленный API-вызов
        const count = await tasksApi.getIncompleteTasksCount({ subdivisionId: sub.id });
        counts[sub.id] = count;
      }
      setTasksCounts(counts);
    };
    
    fetchTasksCounts();
  }, [subdivisions]);

  const handleTasksClick = (subdivisionId: string) => {
    navigate(`/divisions/${division.id}/tasks?subdivision=${subdivisionId}`);
  };

  return (
    <div className="subdivisions-container">
      <h2 className="subdivisions-title">Отделения</h2>
      <div className="subdivisions-grid">
        {subdivisions.map(subdivision => (
          <div key={subdivision.id} className="subdivision-card">
            <h3 className="subdivision-card-title">{subdivision.name}</h3>
            <div className="subdivision-metrics">
              <div
                className="metric-card"
                onClick={() => handleSectionClick('personnel', subdivision.id)}
              >
                <Users className="metric-icon blue" />
                <span className="metric-label">Сотрудники</span>
                <span className="metric-value">{subdivision.employees_count}</span>
              </div>

              <div
                className="metric-card"
                onClick={() => handleSectionClick('equipment', subdivision.id)}
              >
                <Plug className="metric-icon green" />
                <span className="metric-label">Техника</span>
                <span className="metric-value">{subdivision.equipment_count}</span>
              </div>

              <div
                className="metric-card"
                onClick={() => handleSectionClick('facilities', subdivision.id)}
              >
                <Building2 className="metric-icon purple" />
                <span className="metric-label">Объекты</span>
                <span className="metric-value">{subdivision.facilities_count}</span>
              </div>

              <div
                className="metric-card"
                onClick={() => handleTasksClick(subdivision.id)}
              >
                <ListTodo className="metric-icon orange" />
                <span className="metric-label">Задачи</span>
                <span className="metric-value">
                  {tasksCounts[subdivision.id] || 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

