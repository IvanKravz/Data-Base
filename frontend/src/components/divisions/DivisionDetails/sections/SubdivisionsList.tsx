// SubdivisionsList.tsx
import React, { useEffect, useState } from 'react';
import { Users, Plug, Building2, ListTodo, ChevronRight } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasksCounts = async () => {
      const counts: Record<string, number> = {};
      try {
        for (const sub of subdivisions) {
          const count = await tasksApi.getIncompleteTasksCount({ subdivisionId: sub.id });
          counts[sub.id] = count;
        }
        setTasksCounts(counts);
      } catch (error) {
        console.error('Ошибка загрузки количества задач:', error);
      } finally {
        setLoading(false);
      }
    };

    if (subdivisions.length > 0) {
      fetchTasksCounts();
    } else {
      setLoading(false);
    }
  }, [subdivisions]);

  const handleTasksClick = (subdivisionId: string) => {
    navigate(`/divisions/${division.id}/tasks?subdivision=${subdivisionId}`);
  };

  if (subdivisions.length === 0) {
    return null;
  }

  return (
    <div className="division-subdivisions-section">
      <h2 className="division-section-title">Отделения</h2>
      <div className="division-subdivisions-grid">
        {subdivisions.map(subdivision => (
          <div key={subdivision.id} className="division-subdivision-card">
            <div className="division-subdivision-header">
              <h3 className="division-subdivision-name">{subdivision.name}</h3>
            </div>

            <div className="division-subdivision-metrics">
              <div
                className="division-metric-item"
                onClick={() => handleSectionClick('personnel', subdivision.id)}
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
                className="division-metric-item"
                onClick={() => handleSectionClick('equipment', subdivision.id)}
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
                className="division-metric-item"
                onClick={() => handleSectionClick('facilities', subdivision.id)}
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
                className="division-metric-item"
                onClick={() => handleTasksClick(subdivision.id)}
              >
                <div className="division-metric-icon-container">
                  <ListTodo className="division-metric-icon" />
                </div>
                <div className="division-metric-info">
                  <span className="division-metric-label">Задачи</span>
                  <span className="division-metric-value">
                    {loading ? '...' : tasksCounts[subdivision.id] || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}