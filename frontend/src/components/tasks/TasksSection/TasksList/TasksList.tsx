import React, { useState, useMemo } from 'react';
import { TaskItem } from '../TaskItem/TaskItem';
import { Task } from '../../../../types/tasks';
import './TasksList.css';

interface TasksListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStep: (taskId: string, stepId: string, isCompleted: boolean) => void;
}

interface GroupedTasks {
  [divisionId: string]: {
    division: { id: string; name: string };
    noSubdivisionTasks: Task[];
    subdivisions: {
      [subdivisionId: string]: {
        subdivision: { id: string; name: string };
        tasks: Task[];
      };
    };
  };
}

type SubdivisionTabKey = string | 'no-subdivision' | 'all';

export function TasksList({
  tasks,
  onEditTask,
  onDeleteTask,
  onToggleStep,
}: TasksListProps) {
  const [activeDivisionId, setActiveDivisionId] = useState<string | null>(null);
  const [activeSubdivisionTab, setActiveSubdivisionTab] = useState<SubdivisionTabKey>('all');

  const groupedTasks: GroupedTasks = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const divisionId = task.division?.id || 'no-division';
      const divisionName = task.division?.name || 'Без подразделения';
      const subdivisionId = task.subdivision?.id || 'no-subdivision';
      const subdivisionName = task.subdivision?.name || '';

      if (!acc[divisionId]) {
        acc[divisionId] = {
          division: { id: divisionId, name: divisionName },
          noSubdivisionTasks: [],
          subdivisions: {}
        };
      }

      if (!task.subdivision?.id) {
        acc[divisionId].noSubdivisionTasks.push(task);
      } else {
        if (!acc[divisionId].subdivisions[subdivisionId]) {
          acc[divisionId].subdivisions[subdivisionId] = {
            subdivision: { id: subdivisionId, name: subdivisionName },
            tasks: []
          };
        }
        acc[divisionId].subdivisions[subdivisionId].tasks.push(task);
      }

      return acc;
    }, {} as GroupedTasks);
  }, [tasks]);

  const divisionIds = useMemo(() => Object.keys(groupedTasks), [groupedTasks]);

  // При первом рендере выбираем первое подразделение и вкладку "Все задачи"
  useState(() => {
    if (divisionIds.length > 0 && !activeDivisionId) {
      setActiveDivisionId(divisionIds[0]);
      setActiveSubdivisionTab('all');
    }
  });

  const handleDivisionChange = (divisionId: string) => {
    setActiveDivisionId(divisionId);
    setActiveSubdivisionTab('all'); // при смене подразделения переключаемся на "Все задачи"
  };

  if (tasks.length === 0) {
    return (
      <div className="tasks-empty-state">
        <h3>Задачи отсутствуют</h3>
        <p>Попробуйте изменить параметры фильтрации</p>
      </div>
    );
  }

  const activeGroup = activeDivisionId ? groupedTasks[activeDivisionId] : null;

  // Получаем список вкладок для второго уровня: "Все задачи" + отделения
  const subdivisionTabs = useMemo(() => {
    if (!activeGroup) return [];
    const tabs: Array<{ key: SubdivisionTabKey; label: string; count: number }> = [
      { key: 'all', label: 'Все задачи', count: tasks.length } // общее количество задач в подразделении
    ];
    if (activeGroup.noSubdivisionTasks.length > 0) {
      tabs.push({ key: 'no-subdivision', label: 'Задачи подразделения', count: activeGroup.noSubdivisionTasks.length });
    }
    Object.keys(activeGroup.subdivisions).forEach(subId => {
      const sub = activeGroup.subdivisions[subId];
      tabs.push({ key: subId, label: sub.subdivision.name, count: sub.tasks.length });
    });
    return tabs;
  }, [activeGroup, tasks]);

  // Получаем задачи для активной вкладки второго уровня
  const activeTasks = useMemo(() => {
    if (!activeGroup) return [];
    if (activeSubdivisionTab === 'all') {
      // Все задачи подразделения: задачи без отделения + задачи из всех отделений
      const allTasks = [...activeGroup.noSubdivisionTasks];
      Object.values(activeGroup.subdivisions).forEach(sub => {
        allTasks.push(...sub.tasks);
      });
      return allTasks;
    }
    if (activeSubdivisionTab === 'no-subdivision') {
      return activeGroup.noSubdivisionTasks;
    }
    const sub = activeGroup.subdivisions[activeSubdivisionTab];
    return sub ? sub.tasks : [];
  }, [activeGroup, activeSubdivisionTab]);

  return (
    <div className="tasks-list">
      {/* Вкладки подразделений (первый уровень) */}
      <div className="tasks-tabs">
        {divisionIds.map(id => {
          const group = groupedTasks[id];
          const totalCount = group.noSubdivisionTasks.length +
            Object.values(group.subdivisions).reduce((sum, sub) => sum + sub.tasks.length, 0);
          return (
            <button
              key={id}
              className={`tasks-tab ${activeDivisionId === id ? 'tasks-tab-active' : ''}`}
              onClick={() => handleDivisionChange(id)}
            >
              <span>{group.division.name}</span>
              <span className="tasks-tab-count">{totalCount}</span>
            </button>
          );
        })}
      </div>

      {/* Внутренние вкладки (второй уровень): "Все задачи" + отделения */}
      {activeGroup && subdivisionTabs.length > 0 && (
        <div className="tasks-subdivision-tabs">
          {subdivisionTabs.map(tab => (
            <button
              key={tab.key}
              className={`tasks-subdivision-tab ${activeSubdivisionTab === tab.key ? 'tasks-subdivision-tab-active' : ''}`}
              onClick={() => setActiveSubdivisionTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="tasks-subdivision-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Список задач */}
      <div className="tasks-tab-content">
        <div className="tasks-tab-panel">
          {activeTasks.length > 0 ? (
            <div className="tasks-subdivision-list">
              {activeTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onToggleStep={onToggleStep}
                  index={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="tasks-empty-state">
              <p>Нет задач для отображения</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}