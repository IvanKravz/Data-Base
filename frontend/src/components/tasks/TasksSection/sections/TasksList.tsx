import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { DivisionTasks } from '../../DivisionTasks';
import { divisions } from '../../../../data/divisionsData';
import { TaskCategory, isTaskCompleted } from '../../../../types/taskCategories';
import '../style.css';

interface TasksListProps {
  selectedDivision: string;
  selectedCategory: TaskCategory | 'all' | 'completed';
  searchTerm: string;
}

export function TasksList({ 
  selectedDivision, 
  selectedCategory, 
  searchTerm 
}: TasksListProps) {
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const loading = useSelector((state: RootState) => state.tasks.loading);

  const filteredDivisions = selectedDivision === 'all'
    ? divisions
    : divisions.filter(d => d.id === selectedDivision);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const isCompleted = isTaskCompleted(task);
    
    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'completed' ? isCompleted : 
        !isCompleted && task.category === selectedCategory);
        
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="tasks-loading">
        <div className="tasks-spinner"></div>
      </div>
    );
  }

  return (
    <div className="tasks-list-container">
      {filteredDivisions.map((division) => (
        <DivisionTasks
          key={division.id}
          division={division}
          tasks={filteredTasks.filter(task => task.divisionId === division.id)}
        />
      ))}
    </div>
  );
}