import React, { useState } from 'react';
import { Task, TaskCategory, Step } from '../../../types/tasks';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './style.css';

interface TasksCalendarSidebarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStepClick: (step: Step) => void; // Новая функция для обработки клика на этапе
}

export function TasksCalendarSidebar({ tasks, onTaskClick, onStepClick }: TasksCalendarSidebarProps) {
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);

  // Функция для получения класса категории
  const getCategoryClass = (category: TaskCategory) => {
    switch (category) {
      case 'urgent': return 'tasks-sidebar-item-urgent';
      case 'planned': return 'tasks-sidebar-item-planned';
      case 'attention': return 'tasks-sidebar-item-attention';
      default: return '';
    }
  };

  // Переключение видимости этапов задачи
  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  // Обработчик клика на этапе
  const handleStepClick = (step: Step, e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем срабатывание клика на задаче
    onStepClick(step);
  };

  return (
    <div className="tasks-calendar-sidebar">
      <div className="tasks-sidebar-content">
        <h3 className="tasks-sidebar-title">Предстоящие задачи</h3>
        <div className="tasks-sidebar-list">
          {tasks.slice(0, 5).map((task) => {
            const isExpanded = expandedTaskIds.includes(task.id);
            const completedSteps = task.steps.filter(s => s.is_completed).length;
            
            return (
              <div
                key={task.id}
                className={`tasks-sidebar-item ${getCategoryClass(task.category)}`}
              >
                <div 
                  className="tasks-sidebar-item-header"
                  onClick={() => toggleTaskExpanded(task.id)}
                >
                  <div className="tasks-sidebar-item-text">
                    <h4 className="tasks-sidebar-item-title">{task.title}</h4>
                    <p className="tasks-sidebar-item-details">
                    Этапов: {task.steps.length}  • Завершено: {completedSteps} 
                    </p>
                  </div>
                  <button 
                    className="tasks-sidebar-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskExpanded(task.id);
                    }}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="tasks-sidebar-steps">
                    {task.steps.map((step, index) => (
                      <div 
                        key={step.id} 
                        className="tasks-sidebar-step"
                        onClick={(e) => handleStepClick(step, e)}
                      >
                        <div className="tasks-sidebar-step-info">
                          <span className="tasks-sidebar-step-name">
                            Этап {index + 1}: {step.name}
                          </span>
                          <span className="tasks-sidebar-step-date">
                            {format(new Date(step.start_date), 'dd.MM.yyyy')}
                          </span>
                        </div>
                        {step.is_completed && (
                          <div className="tasks-sidebar-step-completed">
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}