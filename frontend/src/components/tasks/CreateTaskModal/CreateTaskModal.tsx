import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  onUpdate,
}: CreateTaskModalProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!initialTask;

  // Блокируем скролл body, пока модалка открыта
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  // Закрытие по Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const modalContent = (
    <div className="task-modal" onClick={onClose}>
      <div
        className="task-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <header className="task-modal-header">
          <div className="task-modal-header-text">
            <h2 id="task-modal-title" className="task-modal-title">
              {isEditMode ? 'Редактирование задачи' : 'Новая задача'}
            </h2>
            <p className="task-modal-subtitle">
              {isEditMode
                ? 'Измените параметры задачи и её этапы'
                : 'Создайте задачу и добавьте этапы её выполнения'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="task-modal-close-btn"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </header>

        {error && (
          <div className="task-error-alert" role="alert">
            <div className="task-error-alert-content">{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="task-error-alert-close"
              aria-label="Закрыть уведомление"
            >
              <X size={14} />
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

  if (typeof document === 'undefined') return modalContent;
  return createPortal(modalContent, document.body);
}