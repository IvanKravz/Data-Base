import React, { useState, useEffect } from 'react';
import { Task } from '../../../types';
import { Header } from './sections/Header';
import { Progress } from './sections/Progress';
import { StepsList } from './sections/StepsList';
import { TaskDetailsModal } from '../TaskDetailsModal';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { taskCategories } from '../../../types/taskCategories';
import { useDispatch } from 'react-redux';
import { updateTaskStepStatus, deleteTaskThunk } from '../../../store/thunks/tasksThunks';

interface TaskCardProps {
  task: Task;
  onDelete?: (taskId: string) => void;
}

const categoryStyles = {
  urgent: {
    border: 'border-red-200',
    background: 'bg-gradient-to-br from-red-50/80 to-red-100/80',
    badge: 'bg-red-100 text-red-700 border border-red-200',
    progress: 'bg-red-500'
  },
  planned: {
    border: 'border-blue-200',
    background: 'bg-gradient-to-br from-blue-50/80 to-blue-100/80',
    badge: 'bg-blue-100 text-blue-700 border border-blue-200',
    progress: 'bg-blue-500'
  },
  attention: {
    border: 'border-yellow-200',
    background: 'bg-gradient-to-br from-yellow-50/80 to-yellow-100/80',
    badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    progress: 'bg-yellow-500'
  }
};

export function TaskCard({ task }: TaskCardProps) {
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const completedSteps = task.steps.filter(step => step.isCompleted).length;
  const progress = (completedSteps / task.steps.length) * 100;

  useEffect(() => {
    const completed = task.steps.length > 0 && task.steps.every(step => step.isCompleted);
    setIsCompleted(completed);
  }, [task.steps]);

  const handleStepToggle = async (stepId: string) => {
    const step = task.steps.find(s => s.id === stepId);
    if (step) {
      await dispatch(updateTaskStepStatus({
        taskId: task.id,
        stepId,
        completed: !step.isCompleted
      }));
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteTaskThunk(task.id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const styles = isCompleted 
    ? {
        border: 'border-green-200',
        background: 'bg-gradient-to-br from-green-50/80 to-green-100/80',
        badge: 'bg-green-100 text-green-700 border border-green-200',
        progress: 'bg-green-500'
      }
    : categoryStyles[task.category];

  return (
    <>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative border rounded-xl overflow-hidden transition-all duration-500 ease-in-out transform 
          ${isCompleted ? 'scale-[0.98] opacity-90' : isHovered ? 'scale-[1.01] shadow-md' : ''}
          ${styles.border} ${styles.background}
          hover:shadow-lg hover:border-opacity-75
        `}
      >
        {/* Animated gradient background on hover */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
            transition-transform duration-1000 ease-in-out
            ${isHovered ? 'translate-x-full' : '-translate-x-full'}
          `} 
          style={{ backgroundSize: '200% 100%' }}
        />

        <div className="relative p-4">
          <Header
            title={task.title}
            category={task.category}
            isCompleted={isCompleted}
            styles={styles}
            onEdit={() => setShowDetails(true)}
            onDelete={handleDelete}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />

          <Progress
            completedSteps={completedSteps}
            totalSteps={task.steps.length}
            progress={progress}
            styles={styles}
          />

          <StepsList
            steps={task.steps}
            isExpanded={isExpanded}
            onStepToggle={handleStepToggle}
          />
        </div>
      </div>

      {showDetails && (
        <TaskDetailsModal
          task={task}
          onClose={() => setShowDetails(false)}
          isEditing={true}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление задачи"
          message="Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}