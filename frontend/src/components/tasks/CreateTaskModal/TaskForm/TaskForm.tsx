import React, { useState, useEffect } from 'react';
import { tasksApi } from '../../../../api/tasks';
import { TaskStepsList } from '../TaskStepsList';
import { DivisionSelector } from './DivisionSelector';
import { SubdivisionSelector } from './SubdivisionSelector';
import { TaskCategorySelector } from './TaskCategorySelector';
import { divisionsApi } from '../../../../api';
import '../style.css';

interface TaskFormProps {
  initialTask?: Task | null;
  divisionId?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCreate?: (task: Task) => void;
  onUpdate?: (task: Task) => void;
}

export function TaskForm({
  initialTask,
  divisionId,
  onSuccess,
  onError,
  onCreate,
  onUpdate
}: TaskFormProps) {
  const [isPrivate, setIsPrivate] = useState(initialTask?.is_private || false);
  const [title, setTitle] = useState(initialTask?.title || '');
  const [category, setCategory] = useState<TaskCategory>(initialTask?.category || 'planned');
  const [steps, setSteps] = useState<Omit<TaskStep, 'id' | 'isCompleted'>[]>(
    initialTask?.steps.map(step => ({
      name: step.name,
      comments: step.comments || '',
      startDate: step.start_date,
      endDate: step.end_date
    })) || []
  );

  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState(initialTask?.division?.id || divisionId || '');
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState<string | null>(
    initialTask?.subdivision?.id || null // Явно инициализируем null
  );
  const [currentSubdivisions, setCurrentSubdivisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchDivisions = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const divisionsData = await divisionsApi.getDivisions(token);
        setDivisions(divisionsData);

        const divisionToLoad = initialTask?.division?.id || divisionId;
        if (divisionToLoad) {
          const division = divisionsData.find(d => d.id == divisionToLoad);
          if (division?.subdivisions) {
            setCurrentSubdivisions(division.subdivisions);
          }
        }
      } catch (error) {
        onError('Не удалось загрузить список подразделений');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDivisions();
  }, [token, initialTask, divisionId]);

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivisionId(divisionId);
    const division = divisions.find(d => d.id == divisionId);
    setCurrentSubdivisions(division?.subdivisions || []);
    if (initialTask?.division?.id !== divisionId) {
      setSelectedSubdivisionId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDivisionId) {
      onError('Необходимо выбрать подразделение');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title,
        category,
        division_id: selectedDivisionId,
        subdivision_id: selectedSubdivisionId || null,
        is_private: isPrivate,
        steps: steps.map(step => ({
          name: step.name,
          comments: step.comments || '',
          start_date: step.startDate,
          end_date: step.endDate
        }))
      };

      if (initialTask && onUpdate) {
        await onUpdate({
          ...initialTask,
          title,
          category,
          division: { id: selectedDivisionId },
          subdivision: selectedSubdivisionId ? { id: selectedSubdivisionId } : null,
          is_private: isPrivate,
          steps: steps.map(step => ({
            ...step,
            start_date: step.startDate,
            end_date: step.endDate
          }))
        });
      } else if (onCreate) {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error('Authentication token missing');

        const newTask = await tasksApi.createTask(taskData);
        console.log('newTask', newTask)
        // onCreate(newTask);
      }

      onSuccess();
    } catch (error) {
      console.error('Task save error:', error);
      onError(error instanceof Error ? error.message : 'Не удалось сохранить задачу');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="task-form-section">
        <div className="task-form-basicinfo">
          <div>
            <label className="task-form-label">Название задачи</label>
            <input
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
            onDivisionChange={handleDivisionChange}
          />

          <SubdivisionSelector
            subdivisions={currentSubdivisions}
            selectedSubdivisionId={selectedSubdivisionId}
            onChange={(id) => setSelectedSubdivisionId(id)}
            isLoading={isLoading}
            hasDivision={!!selectedDivisionId}
          />
        </div>

        <TaskCategorySelector
          category={category}
          onChange={setCategory}
        />
      </div>
      <div className="task-form-section">
        <label className="task-form-label">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mr-2"
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