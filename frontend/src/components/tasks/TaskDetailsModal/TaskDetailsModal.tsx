import React, { useState } from 'react';
import { Task } from '../../../types/tasks';
import { Header } from './sections/Header';
import { TaskInfo } from './sections/TaskInfo';
import { StepsList } from './sections/StepsList';
import { EditTaskForm } from './sections/EditTaskForm';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  isEditing?: boolean;
  onDelete?: (taskId: string) => void;
}

export function TaskDetailsModal({ 
  task, 
  onClose, 
  isEditing: initialEditMode = false,
  onDelete 
}: TaskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(task.id);
      onClose();
    }
    setShowDeleteModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-h-[90vh] overflow-y-auto md:max-w-3xl lg:max-w-4xl">
        <Header
          task={task}
          isEditing={isEditing}
          onClose={onClose}
          onEdit={() => setIsEditing(true)}
          onDelete={onDelete ? handleDelete : undefined}
        />
        
        <div className="p-6 space-y-6">
          {isEditing ? (
            <EditTaskForm
              task={task}
              onSubmit={(updatedTask) => {
                console.log('Updated task:', updatedTask);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <TaskInfo task={task} />
              <StepsList task={task} />
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление задачи"
          message="Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}