import React, { useState } from 'react';
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
    noSubdivisionTasks: Task[]; // Задачи без отделения
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
  // Состояния для отслеживания развернутых/свернутых групп
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const [expandedSubdivisions, setExpandedSubdivisions] = useState<Record<string, Record<string, boolean>>>({});
  const [expandedNoSubdivision, setExpandedNoSubdivision] = useState<Record<string, boolean>>({});

  // Группируем задачи по подразделениям и отделениям
  const groupedTasks: GroupedTasks = tasks.reduce((acc, task) => {
    const divisionId = task.division?.id || 'no-division';
    const divisionName = task.division?.name || 'Без подразделения';
    const subdivisionId = task.subdivision?.id || 'no-subdivision';
    const subdivisionName = task.subdivision?.name || '';

    // Создаем структуру для подразделения, если её нет
    if (!acc[divisionId]) {
      acc[divisionId] = {
        division: {
          id: divisionId,
          name: divisionName
        },
        noSubdivisionTasks: [],
        subdivisions: {}
      };
    }

    // Если задача без отделения, добавляем в отдельный список
    if (!task.subdivision?.id) {
      acc[divisionId].noSubdivisionTasks.push(task);
    } else {
      // Создаем структуру для отделения, если её нет
      if (!acc[divisionId].subdivisions[subdivisionId]) {
        acc[divisionId].subdivisions[subdivisionId] = {
          subdivision: {
            id: subdivisionId,
            name: subdivisionName
          },
          tasks: []
        };
      }

      // Добавляем задачу в соответствующее отделение
      acc[divisionId].subdivisions[subdivisionId].tasks.push(task);
    }
    
    return acc;
  }, {} as GroupedTasks);

  // Функции для переключения состояния развертывания/свертывания
  const toggleDivision = (divisionId: string) => {
    setExpandedDivisions(prev => ({
      ...prev,
      [divisionId]: prev[divisionId] === undefined ? false : !prev[divisionId]
    }));
  };

  const toggleSubdivision = (divisionId: string, subdivisionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Останавливаем всплытие события
    setExpandedSubdivisions(prev => ({
      ...prev,
      [divisionId]: {
        ...prev[divisionId],
        [subdivisionId]: prev[divisionId]?.[subdivisionId] === undefined ? false : !prev[divisionId]?.[subdivisionId]
      }
    }));
  };

  const toggleNoSubdivision = (divisionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Останавливаем всплытие события
    setExpandedNoSubdivision(prev => ({
      ...prev,
      [divisionId]: prev[divisionId] === undefined ? false : !prev[divisionId]
    }));
  };

  // Если нет задач, показываем сообщение
  if (tasks.length === 0) {
    return (
      <div className="tasks-empty-state">
        <h3>Задачи отсутствуют</h3>
        <p>Попробуйте изменить параметры фильтрации</p>
      </div>
    );
  }

  // Проверяем, сколько всего подразделений
  const divisionCount = Object.keys(groupedTasks).length;

  return (
    <div className="tasks-list">
      {Object.keys(groupedTasks).map(divisionId => {
        const divisionGroup = groupedTasks[divisionId];
        const divisionTasksCount = divisionGroup.noSubdivisionTasks.length + 
          Object.values(divisionGroup.subdivisions)
            .reduce((total, sub) => total + sub.tasks.length, 0);
        const isDivisionExpanded = expandedDivisions[divisionId] === undefined ? true : expandedDivisions[divisionId];
        const hasNoSubdivisionTasks = divisionGroup.noSubdivisionTasks.length > 0;
        const isNoSubdivisionExpanded = expandedNoSubdivision[divisionId] === undefined ? true : expandedNoSubdivision[divisionId];

        // Проверяем, нужно ли показывать заголовок подразделения
        const showDivisionHeader = divisionCount > 1;

        return (
          <div key={divisionId} className="tasks-division-group">
            {/* Показываем заголовок подразделения только если подразделений больше одного */}
            {showDivisionHeader && (
              <div 
                className="tasks-division-header"
                onClick={() => toggleDivision(divisionId)}
              >
                <button className="tasks-expand-button">
                  {isDivisionExpanded ? (
                    <ChevronDown size={20} className="tasks-chevron" />
                  ) : (
                    <ChevronRight size={20} className="tasks-chevron" />
                  )}
                </button>
                <h3 className="tasks-division-title">
                  {divisionGroup.division.name}
                  <span className="tasks-division-count">{divisionTasksCount}</span>
                </h3>
              </div>
            )}

            {/* Если подразделение одно, всегда показываем его содержимое без свертывания */}
            {(showDivisionHeader ? isDivisionExpanded : true) && (
              <>
                {/* Задачи без отделения - показываем сверху */}
                {hasNoSubdivisionTasks && (
                  <div className="tasks-no-subdivision-group">
                    <div 
                      className="tasks-no-subdivision-header"
                      onClick={(e) => toggleNoSubdivision(divisionId, e)}
                    >
                      <button className="tasks-expand-button">
                        {isNoSubdivisionExpanded ? (
                          <ChevronDown size={18} className="tasks-chevron" />
                        ) : (
                          <ChevronRight size={18} className="tasks-chevron" />
                        )}
                      </button>
                      <h4 className="tasks-no-subdivision-title">
                        Задачи подразделения
                        <span className="tasks-no-subdivision-count">
                          {divisionGroup.noSubdivisionTasks.length}
                        </span>
                      </h4>
                    </div>
                    {isNoSubdivisionExpanded && (
                      <div className="tasks-no-subdivision-list">
                        {divisionGroup.noSubdivisionTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onEditTask={onEditTask}
                            onDeleteTask={onDeleteTask}
                            onToggleStep={onToggleStep}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Отделения с задачами */}
                {Object.keys(divisionGroup.subdivisions).map(subdivisionId => {
                  const subdivisionGroup = divisionGroup.subdivisions[subdivisionId];
                  const isSubdivisionExpanded = expandedSubdivisions[divisionId]?.[subdivisionId] === undefined ? true : expandedSubdivisions[divisionId]?.[subdivisionId];
                  
                  return (
                    <div key={subdivisionId} className="tasks-subdivision-group">
                      <div 
                        className="tasks-subdivision-header"
                        onClick={(e) => toggleSubdivision(divisionId, subdivisionId, e)}
                      >
                        <button className="tasks-expand-button">
                          {isSubdivisionExpanded ? (
                            <ChevronDown size={18} className="tasks-chevron" />
                          ) : (
                            <ChevronRight size={18} className="tasks-chevron" />
                          )}
                        </button>
                        <h4 className="tasks-subdivision-title">
                          {subdivisionGroup.subdivision.name}
                          <span className="tasks-subdivision-count">
                            {subdivisionGroup.tasks.length}
                          </span>
                        </h4>
                      </div>
                      {isSubdivisionExpanded && (
                        <div className="tasks-subdivision-list">
                          {subdivisionGroup.tasks.map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              onEditTask={onEditTask}
                              onDeleteTask={onDeleteTask}
                              onToggleStep={onToggleStep}
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