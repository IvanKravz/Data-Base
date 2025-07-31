import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import './DivisionTasksSection.css';

interface TasksHeaderProps {
  divisionName: string;
  subdivisionName: string;
  onBack: () => void;
  onCreateTask: () => void;
}

export function TasksHeader({ divisionName, subdivisionName, onBack, onCreateTask }: TasksHeaderProps) {
  return (
    <div className="tasks-header">
      <div className="tasks-header-left">
        <button onClick={onBack} className="tasks-back-button">
          <ArrowLeft className="tasks-back-icon" />
        </button>
        <div>
          <h1 className="tasks-title">Задачи подразделения: {divisionName ? ` ${divisionName}` : ''} {subdivisionName ? ` / ${subdivisionName}` : ''}</h1>
        </div>
      </div>
      <button onClick={onCreateTask} className="tasks-create-button">
        <Plus className="tasks-create-icon" />
        <span>Создать задачу</span>
      </button>
    </div>
  );
}