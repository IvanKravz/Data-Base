import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import './style.css';

interface TasksHeaderProps {
  divisionName: string;
  subdivisionName: string;
  onBack: () => void;
  onCreateTask: () => void;
  showBackButton: boolean;
  headerTitle: string;
}

export function TasksHeader({ 
  divisionName, 
  subdivisionName, 
  onBack, 
  onCreateTask,
  showBackButton,
  headerTitle
}: TasksHeaderProps) {
  return (
    <div className="tasks-header">
      <div className="tasks-header-left">
        {showBackButton && (
          <button onClick={onBack} className="tasks-back-button">
            <ArrowLeft className="tasks-back-icon" />
          </button>
        )}
        <div>
          <h1 className="tasks-title">{headerTitle}</h1>
        </div>
      </div>
      <button onClick={onCreateTask} className="tasks-create-button">
        <Plus className="tasks-create-icon" />
        <span>Создать задачу</span>
      </button>
    </div>
  );
}