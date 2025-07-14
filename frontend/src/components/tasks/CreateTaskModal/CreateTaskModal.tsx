import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { TaskForm } from './TaskForm/TaskForm';
import './style.css';

interface CreateTaskModalProps {
  initialTask?: Task | null;
  divisionId?: string;
  onClose: () => void;
  onCreate?: (task: Task) => void;
  onUpdate?: (task: Task) => void;
}

export function CreateTaskModal({
  initialTask,
  divisionId,
  onClose,
  onCreate,
  onUpdate
}: CreateTaskModalProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!initialTask;

  return (
    <div className="task-modal">
      <div className="task-modal-content">
        <div className="task-modal-header">
          <div>
            <h2 className="task-modal-title">
              {isEditMode ? 'Редактирование задачи' : 'Новая задача'}
            </h2>
            <p className="task-modal-subtitle">
              {isEditMode
                ? 'Измените параметры задачи и её этапы'
                : 'Создайте новую задачу и добавьте этапы её выполнения'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="task-modal-close-btn"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="task-error-alert">
            <div className="flex-1">{error}</div>
            <button
              onClick={() => setError(null)}
              className="task-error-alert-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="task-form-container">
          <TaskForm
            initialTask={initialTask}
            divisionId={divisionId}
            onSuccess={onClose}
            onError={setError}
            onCreate={onCreate}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  );
}