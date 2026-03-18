import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { TaskForm } from './TaskForm/TaskForm';
import './style.css';
import { Task } from '../../../types/tasks';

interface CreateTaskModalProps {
  initialTask?: Task | null;
  divisionId?: string;
  restrictedDivisionId?: string | null;
  restrictedSubdivisionId?: string | null;
  onClose: () => void;
  onCreate?: (task: Omit<Task, 'id'>) => void;
  onUpdate?: (task: Task) => void;
}

export function CreateTaskModal({
  initialTask,
  divisionId,
  restrictedDivisionId,
  restrictedSubdivisionId,
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
          <div className="task-modal-header-left">
            <h2 className="task-modal-title">
              {isEditMode ? 'Редактирование задачи' : 'Новая задача'}
            </h2>
            <p className="task-modal-subtitle">
              {isEditMode
                ? 'Измените параметры задачи и её этапы'
                : 'Создайте новую задачу и добавьте этапы её выполнения'}
            </p>
          </div>
          <button onClick={onClose} className="task-modal-close-btn" aria-label="Закрыть">
            <X className="task-modal-close-icon" />
          </button>
        </div>

        {error && (
          <div className="task-error-alert" role="alert">
            <div className="task-error-alert-content">{error}</div>
            <button
              onClick={() => setError(null)}
              className="task-error-alert-close"
              aria-label="Закрыть уведомление"
            >
              <X className="task-error-alert-close-icon" />
            </button>
          </div>
        )}

        <div className="task-form-container">
          <TaskForm
            initialTask={initialTask}
            divisionId={divisionId}
            restrictedDivisionId={restrictedDivisionId}
            restrictedSubdivisionId={restrictedSubdivisionId}
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