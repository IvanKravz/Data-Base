import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { DivisionTasks } from '../DivisionTasks';
import { divisions } from '../../../data/divisionsData';
import { TaskCategory, isTaskCompleted } from '../../../types/taskCategories';

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

  // Filter tasks based on all criteria
  const filteredTasks = tasks.filter(task => {
    // Match search term
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Match division - check both ID and name for compatibility
    const matchesDivision = selectedDivision === 'all' || 
      task.divisionId === selectedDivision || 
      divisions.find(d => d.id === task.divisionId)?.name === selectedDivision;
    
    // Check completion status
    const isTaskComplete = isTaskCompleted(task);
    
    // Match category
    let matchesCategory = false;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'completed') {
      matchesCategory = isTaskComplete;
    } else {
      matchesCategory = !isTaskComplete && task.category === selectedCategory;
    }

    return matchesSearch && matchesDivision && matchesCategory;
  });

  // Get relevant divisions based on filtered tasks and selection
  const relevantDivisions = selectedDivision === 'all'
    ? divisions.filter(div => filteredTasks.some(task => 
        task.divisionId === div.id || 
        task.divisionId === div.name
      ))
    : divisions.filter(div => 
        div.id === selectedDivision || 
        div.name === selectedDivision
      );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {searchTerm 
            ? 'Нет задач, соответствующих поиску' 
            : selectedCategory === 'completed'
              ? 'Нет выполненных задач'
              : selectedDivision !== 'all'
                ? 'Нет задач в выбранном подразделении'
                : 'Нет задач в выбранной категории'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {relevantDivisions.map((division) => {
        // Get tasks for this division
        const divisionTasks = filteredTasks.filter(task => 
          task.divisionId === division.id || 
          task.divisionId === division.name
        );
        
        if (divisionTasks.length === 0) {
          return null;
        }

        return (
          <DivisionTasks
            key={division.id}
            division={division}
            tasks={divisionTasks}
          />
        );
      })}
    </div>
  );
}