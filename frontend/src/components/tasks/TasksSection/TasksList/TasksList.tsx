import React, { useState, useMemo, useRef, useEffect } from 'react';
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

  const divisionTabsRef = useRef<HTMLDivElement>(null);
  const subdivisionTabsRef = useRef<HTMLDivElement>(null);

  const [divisionIndicatorStyle, setDivisionIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const [subdivisionIndicatorStyle, setSubdivisionIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  // 1. Группировка задач
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

  // 2. Список ID подразделений
  const divisionIds = useMemo(() => Object.keys(groupedTasks), [groupedTasks]);

  // 3. Активная группа (подразделение)
  const activeGroup = useMemo(() => {
    return activeDivisionId ? groupedTasks[activeDivisionId] : null;
  }, [groupedTasks, activeDivisionId]);

  // 4. Вкладки отделений (второй уровень)
  const subdivisionTabs = useMemo(() => {
    if (!activeGroup) return [];
    const tabs: Array<{ key: SubdivisionTabKey; label: string; count: number }> = [
      { key: 'all', label: 'Все задачи', count: tasks.length }
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

  // 5. Активные задачи для текущей вкладки
  const activeTasks = useMemo(() => {
    if (!activeGroup) return [];
    if (activeSubdivisionTab === 'all') {
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

  // 6. Инициализация активного подразделения при первом рендере
  useEffect(() => {
    if (divisionIds.length > 0 && !activeDivisionId) {
      setActiveDivisionId(divisionIds[0]);
      setActiveSubdivisionTab('all');
    }
  }, [divisionIds, activeDivisionId]);

  // 7. Обновление индикатора для вкладок подразделений
  useEffect(() => {
    if (!divisionTabsRef.current || !activeDivisionId) return;
    const activeButton = divisionTabsRef.current.querySelector('.tasks-tab-active') as HTMLElement;
    if (activeButton) {
      const { offsetLeft, offsetWidth } = activeButton;
      setDivisionIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeDivisionId, divisionIds]);

  // 8. Обновление индикатора для вкладок отделений
  useEffect(() => {
    if (!subdivisionTabsRef.current || !activeDivisionId) return;
    const activeButton = subdivisionTabsRef.current.querySelector('.tasks-subdivision-tab-active') as HTMLElement;
    if (activeButton) {
      const { offsetLeft, offsetWidth } = activeButton;
      setSubdivisionIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeSubdivisionTab, activeDivisionId, subdivisionTabs]);

  // Обработчик смены подразделения
  const handleDivisionChange = (divisionId: string) => {
    setActiveDivisionId(divisionId);
    setActiveSubdivisionTab('all');
  };

  if (tasks.length === 0) {
    return (
      <div className="tasks-empty-state">
        <h3>Задачи отсутствуют</h3>
        <p>Попробуйте изменить параметры фильтрации</p>
      </div>
    );
  }

  return (
    <div className="tasks-list">
      {/* Вкладки подразделений (первый уровень) */}
      <div className="tasks-tabs" ref={divisionTabsRef}>
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
        <div
          className="tasks-tabs-indicator"
          style={{
            left: `${divisionIndicatorStyle.left}px`,
            width: `${divisionIndicatorStyle.width}px`,
          }}
        />
      </div>

      {/* Внутренние вкладки (второй уровень): "Все задачи" + отделения */}
      {activeGroup && subdivisionTabs.length > 0 && (
        <div className="tasks-subdivision-tabs" ref={subdivisionTabsRef}>
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
          <div
            className="tasks-subdivision-tabs-indicator"
            style={{
              left: `${subdivisionIndicatorStyle.left}px`,
              width: `${subdivisionIndicatorStyle.width}px`,
            }}
          />
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