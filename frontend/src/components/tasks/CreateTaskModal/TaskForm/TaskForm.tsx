import React, { useState, useEffect } from 'react';
import { TaskStepsList } from '../TaskStepsList';
import { DivisionSelector } from './DivisionSelector';
import { SubdivisionSelector } from './SubdivisionSelector';
import { TaskCategorySelector } from './TaskCategorySelector';
import { tasksApi } from '../../../../api/tasks';
import '../style.css';
import { TaskCategory } from '../../../../types/taskCategories';

interface TaskFormProps {
  initialTask?: Task | null;
  divisionId?: string;
  restrictedDivisionId?: string | null; // сохраняем для совместимости, но не используем
  restrictedSubdivisionId?: string | null;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCreate?: (task: Omit<Task, 'id'>) => void;
  onUpdate?: (task: Task) => void;
}

export function TaskForm({
  initialTask,
  divisionId,
  restrictedDivisionId,
  restrictedSubdivisionId,
  onSuccess,
  onError,
  onCreate,
  onUpdate
}: TaskFormProps) {
  const [isPrivate, setIsPrivate] = useState(initialTask?.is_private || false);
  const [title, setTitle] = useState(initialTask?.title || '');
  const [category, setCategory] = useState<TaskCategory>(initialTask?.category || 'planned');
  const [steps, setSteps] = useState<StepFormData[]>(
    initialTask?.steps.map(step => ({
      id: step.id ? String(step.id) : undefined,
      name: step.name,
      comments: step.comments || '',
      startDate: step.start_date,
      endDate: step.end_date,
      is_completed: step.is_completed,
      completed_by: step.completed_by,
      completed_at: step.completed_at
    })) || []
  );

  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState(
    initialTask?.division?.id || divisionId || ''
  );
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState<string | null>(
    initialTask?.subdivision?.id || null
  );
  const [availableSubdivisions, setAvailableSubdivisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAvailableDivisions = async () => {
      setIsLoading(true);
      try {
        const data = await tasksApi.getAvailableDivisions();
        setDivisions(data.divisions);
        setAvailableSubdivisions(data.subdivisions);

        // Если есть начальное значение (при редактировании), проверяем, что оно в списке
        if (initialTask?.division?.id) {
          const divisionExists = data.divisions.some(d => d.id == initialTask.division.id);
          if (divisionExists) {
            setSelectedDivisionId(initialTask.division.id);
            const filteredSubdivisions = data.subdivisions.filter(
              s => s.division_id == initialTask.division.id
            );
            setAvailableSubdivisions(filteredSubdivisions);
            if (initialTask.subdivision?.id) {
              setSelectedSubdivisionId(initialTask.subdivision.id);
            } else if (filteredSubdivisions.length === 1) {
              // Если у задачи нет отделения, но в списке одно, выбираем его
              setSelectedSubdivisionId(filteredSubdivisions[0].id);
            }
          } else {
            setSelectedDivisionId('');
          }
        } else if (data.divisions.length === 1 && !initialTask) {
          // Если только одно подразделение доступно, выбираем его автоматически
          const firstDivision = data.divisions[0];
          setSelectedDivisionId(firstDivision.id);
          const filteredSubdivisions = data.subdivisions.filter(
            s => s.division_id == firstDivision.id
          );
          setAvailableSubdivisions(filteredSubdivisions);
          // Если есть только одно отделение, выбираем его автоматически
          if (filteredSubdivisions.length === 1) {
            setSelectedSubdivisionId(filteredSubdivisions[0].id);
          }
        }
      } catch (error) {
        onError('Не удалось загрузить доступные подразделения');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAvailableDivisions();
  }, [initialTask, divisionId, onError]);

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivisionId(divisionId);
    const filtered = availableSubdivisions.filter(s => s.division_id == divisionId);
    setAvailableSubdivisions(filtered);
    if (filtered.length === 1) {
      setSelectedSubdivisionId(filtered[0].id);
    } else {
      setSelectedSubdivisionId(null);
    }
  };

  const isTempId = (id: string | undefined): boolean => {
    return !id || id.toString().startsWith('temp-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDivisionId) {
      onError('Необходимо выбрать подразделение');
      return;
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.name.trim()) {
        onError(`Название этапа ${i + 1} не может быть пустым`);
        return;
      }
      if (!step.startDate || !step.endDate) {
        onError(`Даты начала и окончания этапа ${i + 1} обязательны`);
        return;
      }
      if (new Date(step.startDate) > new Date(step.endDate)) {
        onError(`Дата начала этапа ${i + 1} не может быть позже даты окончания`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title,
        category,
        division_id: selectedDivisionId,
        subdivision_id: selectedSubdivisionId,
        is_private: isPrivate,
        steps: steps.map(step => ({
          name: step.name,
          comments: step.comments || '',
          start_date: step.startDate,
          end_date: step.endDate
        }))
      };

      if (initialTask && onUpdate) {
        const updatedTaskData: Task = {
          ...initialTask,
          title,
          category,
          division: { id: selectedDivisionId, name: '' },
          subdivision: selectedSubdivisionId ? { id: selectedSubdivisionId, name: '' } : null,
          is_private: isPrivate,
          steps: steps.map(step => {
            const stepData: any = {
              name: step.name,
              comments: step.comments || '',
              start_date: step.startDate,
              end_date: step.endDate,
              is_completed: step.is_completed || false
            };
            if (step.id && !isTempId(step.id) && !isNaN(Number(step.id))) {
              stepData.id = step.id;
            }
            return stepData;
          })
        };
        await onUpdate(updatedTaskData);
      } else if (onCreate) {
        await onCreate(taskData);
      }

      onSuccess();
    } catch (error) {
      console.error('Task save error:', error);
      onError(error instanceof Error ? error.message : 'Не удалось сохранить задачу');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если список подразделений пуст и загрузка завершена, показываем сообщение
  if (!isLoading && divisions.length === 0) {
    return (
      <div className="task-form-empty">
        <p>У вас нет прав на создание задач в этом разделе.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="task-form-section">
        <div className="task-form-basicinfo">
          <div className="task-form-field">
            <label htmlFor="task-title" className="task-form-label">Название задачи</label>
            <input
              id="task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="task-form-input"
              placeholder="Введите название задачи"
            />
          </div>

          <DivisionSelector
            divisions={divisions}
            selectedDivisionId={selectedDivisionId}
            onChange={handleDivisionChange}
            isLoading={isLoading}
          />

          <SubdivisionSelector
            subdivisions={availableSubdivisions}
            selectedSubdivisionId={selectedSubdivisionId}
            onChange={(id) => setSelectedSubdivisionId(id)}
            isLoading={isLoading}
            hasDivision={!!selectedDivisionId}
          />
        </div>

        <TaskCategorySelector category={category} onChange={setCategory} />
      </div>

      <div className="task-form-section">
        <label className="task-privacy-checkbox">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Приватная задача (видна только вам)
        </label>
      </div>

      <TaskStepsList steps={steps} onStepsChange={setSteps} />

      <div className="task-form-footer">
        <button type="button" onClick={onSuccess} className="task-form-cancel-btn">
          Отмена
        </button>
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="task-form-submit-btn"
        >
          {initialTask ? 'Сохранить изменения' : 'Создать задачу'}
          {isSubmitting && '...'}
        </button>
      </div>
    </form>
  );
}