import React from 'react';
import { TaskItem } from './TaskItem/TaskItem';
import { Task } from '../../../types/tasks';
import './style.css';

interface TasksListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStep: (taskId: string, stepId: string, isCompleted: boolean) => void;
}

interface GroupedTasks {
  [divisionId: string]: {
    division: any;
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
        subdivisions: {}
      };
    }

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
    
    return acc;
  }, {} as GroupedTasks);

  // Если нет задач, показываем сообщение
  if (tasks.length === 0) {
    return (
      <div className="tasks-empty-state">
        <h3>Задачи не найдены</h3>
        <p>Попробуйте изменить параметры фильтрации</p>
      </div>
    );
  }

  return (
    <div className="tasks-list">
      {Object.keys(groupedTasks).map(divisionId => {
        const divisionGroup = groupedTasks[divisionId];
        const divisionTasksCount = Object.values(divisionGroup.subdivisions)
          .reduce((total, sub) => total + sub.tasks.length, 0);

        return (
          <div key={divisionId} className="tasks-division-group">
            <div className="tasks-division-header">
              <h3 className="tasks-division-title">
                {divisionGroup.division.name}
                <span className="tasks-division-count">{divisionTasksCount}</span>
              </h3>
            </div>

            {Object.keys(divisionGroup.subdivisions).map(subdivisionId => {
              const subdivisionGroup = divisionGroup.subdivisions[subdivisionId];
              
              // Если есть название отделения, показываем его как подгруппу
              if (subdivisionGroup.subdivision.name) {
                return (
                  <div key={subdivisionId} className="tasks-subdivision-group">
                    <div className="tasks-subdivision-header">
                      <h4 className="tasks-subdivision-title">
                        {subdivisionGroup.subdivision.name}
                        <span className="tasks-subdivision-count">
                          {subdivisionGroup.tasks.length}
                        </span>
                      </h4>
                    </div>
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
                  </div>
                );
              }

              // Если отделения нет, показываем задачи напрямую
              return (
                <div key={subdivisionId} className="tasks-subdivision-list">
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
              );
            })}
          </div>
        );
      })}
    </div>
  );
}