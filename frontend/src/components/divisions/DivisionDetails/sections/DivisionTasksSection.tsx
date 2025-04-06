import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState } from '../../../../store/store';
import { Division } from '../../../../types';
import { TaskCard } from '../../../tasks/TaskCard';
import { SearchBar } from '../../../common/SearchBar';
import { ArrowLeft } from 'lucide-react';
import './style.css';

interface TasksSectionProps {
  division: Division;
  activeSubdivision: string | null;
}

export function DivisionTasksSection({ activeSubdivision }: TasksSectionProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { divisions } = useSelector((state: RootState) => state.facilities);
  const division = divisions.results?.find(d => d.id == id);

  const [searchTerm, setSearchTerm] = useState('');
  const tasks = useSelector((state: RootState) => state.tasks.tasks);

  const onBack = () => {
    navigate(`/divisions/${division.id}`);
  };

  // Filter tasks by division and search term
  const filteredTasks = tasks.filter(task => {
    const matchesDivision = task.divisionId === division.id;
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.steps.some(step => 
        step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.comments.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesDivision && matchesSearch;
  });

  const handleDeleteTask = (taskId: string) => {
    // Implement task deletion logic here
    console.log('Deleting task:', taskId);
  };

  return (
    <div className="section-container">
      <h2 className="section-title">
        <button
          onClick={onBack}
          className="back-button"
        >
          <ArrowLeft className="back-button-icon" />
        </button>
        Задачи подразделения
      </h2>
      <div className="section-search-container">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Поиск по названию задачи или этапа..."
        />
      </div>
      <div className="section-list">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div key={task.id} className="section-list-item">
              <TaskCard
                task={task}
                onDelete={handleDeleteTask}
              />
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            {searchTerm 
              ? 'Нет задач, соответствующих поиску' 
              : 'Нет активных задач для этого подразделения'
            }
          </p>
        )}
      </div>
    </div>
  );
}