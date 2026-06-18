import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TaskItem } from '../TaskItem/TaskItem';
import { Task } from '../../../../types/tasks';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './TasksList.css';

interface TasksListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStep: (taskId: string, stepId: string, isCompleted: boolean) => void;
}

interface GroupedTasks {
  [divisionId: string]: {
    division: any;
    noSubdivisionTasks: Task[];
    subdivisions: {
      [subdivisionId: string]: {
        subdivision: any;
        tasks: Task[];
      };
    };
  };
}

export function TasksList({
  tasks,
  onEditTask,
  onDeleteTask,
  onToggleStep,
}: TasksListProps) {
  const location = useLocation();

  // Ключ для sessionStorage на основе текущего URL
  const storageKey = useMemo(() => {
    return `tasksListExpandState_${location.pathname}${location.search}`;
  }, [location.pathname, location.search]);

  // Загрузка сохранённых состояний из sessionStorage
  const loadSavedState = () => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          expandedDivisions: parsed.expandedDivisions || {},
          expandedSubdivisions: parsed.expandedSubdivisions || {},
          expandedNoSubdivision: parsed.expandedNoSubdivision || {},
        };
      }
    } catch (e) {
      console.warn('Failed to load expand state from sessionStorage', e);
    }
    return {
      expandedDivisions: {},
      expandedSubdivisions: {},
      expandedNoSubdivision: {},
    };
  };

  const savedState = loadSavedState();

  // Состояния: подразделения по умолчанию открыты (true), остальные закрыты (false)
  // но если есть сохранённые значения, используем их
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>(
    savedState.expandedDivisions
  );
  const [expandedSubdivisions, setExpandedSubdivisions] = useState<Record<string, Record<string, boolean>>>(
    savedState.expandedSubdivisions
  );
  const [expandedNoSubdivision, setExpandedNoSubdivision] = useState<Record<string, boolean>>(
    savedState.expandedNoSubdivision
  );

  // Сохраняем состояния в sessionStorage при каждом их изменении
  useEffect(() => {
    const stateToSave = {
      expandedDivisions,
      expandedSubdivisions,
      expandedNoSubdivision,
    };
    sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [storageKey, expandedDivisions, expandedSubdivisions, expandedNoSubdivision]);

  // Группируем задачи
  const groupedTasks: GroupedTasks = tasks.reduce((acc, task) => {
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

  // Переключение подразделения
  const toggleDivision = (divisionId: string) => {
    setExpandedDivisions(prev => ({
      ...prev,
      [divisionId]: !(prev[divisionId] ?? true)
    }));
  };

  // Переключение отделения
  const toggleSubdivision = (divisionId: string, subdivisionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSubdivisions(prev => ({
      ...prev,
      [divisionId]: {
        ...prev[divisionId],
        [subdivisionId]: !(prev[divisionId]?.[subdivisionId] ?? false)
      }
    }));
  };

  // Переключение блока "Задачи подразделения" (без отделения)
  const toggleNoSubdivision = (divisionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNoSubdivision(prev => ({
      ...prev,
      [divisionId]: !(prev[divisionId] ?? false)
    }));
  };

  if (tasks.length === 0) {
    return (
      <div className="tasks-empty-state">
        <h3>Задачи отсутствуют</h3>
        <p>Попробуйте изменить параметры фильтрации</p>
      </div>
    );
  }

  const divisionCount = Object.keys(groupedTasks).length;

  return (
    <div className="tasks-list">
      {Object.keys(groupedTasks).map(divisionId => {
        const divisionGroup = groupedTasks[divisionId];
        const divisionTasksCount = divisionGroup.noSubdivisionTasks.length +
          Object.values(divisionGroup.subdivisions).reduce((total, sub) => total + sub.tasks.length, 0);

        // Подразделение открыто по умолчанию (true), если нет сохранённого значения
        const isDivisionExpanded = expandedDivisions[divisionId] ?? true;
        const hasNoSubdivisionTasks = divisionGroup.noSubdivisionTasks.length > 0;
        const isNoSubdivisionExpanded = expandedNoSubdivision[divisionId] ?? false;

        const showDivisionHeader = divisionCount > 1;

        return (
          <div key={divisionId} className="tasks-division-group">
            {showDivisionHeader && (
              <div className="tasks-division-header" onClick={() => toggleDivision(divisionId)}>
                <button className="tasks-expand-button">
                  {isDivisionExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                <h3 className="tasks-division-title">
                  {divisionGroup.division.name}
                  <span className="tasks-division-count">{divisionTasksCount}</span>
                </h3>
              </div>
            )}

            {(showDivisionHeader ? isDivisionExpanded : true) && (
              <>
                {/* Задачи без отделения */}
                {hasNoSubdivisionTasks && (
                  <div className="tasks-no-subdivision-group">
                    <div
                      className="tasks-no-subdivision-header"
                      onClick={(e) => toggleNoSubdivision(divisionId, e)}
                    >
                      <button className="tasks-expand-button">
                        {isNoSubdivisionExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <h4 className="tasks-no-subdivision-title">
                        Задачи подразделения
                        <span className="tasks-no-subdivision-count">{divisionGroup.noSubdivisionTasks.length}</span>
                      </h4>
                    </div>
                    {isNoSubdivisionExpanded && (
                      <div className="tasks-no-subdivision-list">
                        {divisionGroup.noSubdivisionTasks.map((task, index) => (
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
                    )}
                  </div>
                )}

                {/* Отделения */}
                {Object.keys(divisionGroup.subdivisions).map(subdivisionId => {
                  const subdivisionGroup = divisionGroup.subdivisions[subdivisionId];
                  const isSubdivisionExpanded = expandedSubdivisions[divisionId]?.[subdivisionId] ?? false;

                  return (
                    <div key={subdivisionId} className="tasks-subdivision-group">
                      <div
                        className="tasks-subdivision-header"
                        onClick={(e) => toggleSubdivision(divisionId, subdivisionId, e)}
                      >
                        <button className="tasks-expand-button">
                          {isSubdivisionExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <h4 className="tasks-subdivision-title">
                          {subdivisionGroup.subdivision.name}
                          <span className="tasks-subdivision-count">{subdivisionGroup.tasks.length}</span>
                        </h4>
                      </div>
                      {isSubdivisionExpanded && (
                        <div className="tasks-subdivision-list">
                          {subdivisionGroup.tasks.map((task, index) => (
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
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}