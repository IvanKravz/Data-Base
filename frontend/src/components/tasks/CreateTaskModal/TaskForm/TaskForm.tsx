import React, { useState, useEffect } from 'react';
import { TaskStepsList } from '../TaskStepsList';
import { DivisionSelector } from './DivisionSelector';
import { SubdivisionSelector } from './SubdivisionSelector';
import { TaskCategorySelector } from './TaskCategorySelector';
import { divisionsApi } from '../../../../api';
import '../style.css';
import { TaskCategory } from '../../../../types/taskCategories';
import { TaskStep } from '../../../../types/tasks';

interface TaskFormProps {
  initialTask?: Task | null;
  divisionId?: string;
  restrictedDivisionId?: string | null; // Новый пропс
  restrictedSubdivisionId?: string | null;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCreate?: (task: Omit<Task, 'id'>) => void;
  onUpdate?: (task: Task) => void;
}

export function TaskForm({
  initialTask,
  divisionId,
  restrictedDivisionId, // Принимаем новый пропс
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

  // Инициализируем selectedDivisionId с учетом restrictedDivisionId
  const [selectedDivisionId, setSelectedDivisionId] = useState(
    initialTask?.division?.id || restrictedDivisionId || divisionId || ''
  );

  // Инициализируем selectedSubdivisionId с учетом restrictedSubdivisionId
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState<string | null>(
    initialTask?.subdivision?.id || restrictedSubdivisionId || null
  );

  const [currentSubdivisions, setCurrentSubdivisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const fetchDivisions = async () => {
      setIsLoading(true);
      try {
        const divisionsData = await divisionsApi.getDivisions(token);

        // Если есть ограничение по подразделению, фильтруем список только до этого подразделения
        let filteredDivisions = divisionsData;
        if (restrictedDivisionId) {
          filteredDivisions = divisionsData.filter(
            (div: any) => div.id.toString() === restrictedDivisionId.toString()
          );
        }

        setDivisions(filteredDivisions);

        const divisionToLoad = initialTask?.division?.id || restrictedDivisionId || divisionId;
        if (divisionToLoad) {
          const division = filteredDivisions.find(d => d.id == divisionToLoad);
          if (division?.subdivisions) {
            // Если есть ограничение по отделению, фильтруем список только до этого отделения
            let filteredSubdivisions = division.subdivisions;
            if (restrictedSubdivisionId) {
              filteredSubdivisions = division.subdivisions.filter(
                (sub: any) => sub.id.toString() === restrictedSubdivisionId.toString()
              );
            }
            setCurrentSubdivisions(filteredSubdivisions);

            // Автоматически выбираем ограниченное отделение, если оно доступно
            if (restrictedSubdivisionId && !initialTask) {
              const restrictedSubdivisionExists = division.subdivisions.some(
                (sub: any) => sub.id.toString() === restrictedSubdivisionId.toString()
              );
              if (restrictedSubdivisionExists) {
                setSelectedSubdivisionId(restrictedSubdivisionId);
              }
            }
          }
        }
      } catch (error) {
        onError('Не удалось загрузить список подразделений');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDivisions();
  }, [initialTask, divisionId, restrictedDivisionId, restrictedSubdivisionId, onError]);

  const handleDivisionChange = (divisionId: string) => {
    // Если есть ограничение по подразделению, не позволяем менять его
    if (restrictedDivisionId) {
      return;
    }

    setSelectedDivisionId(divisionId);
    const division = divisions.find(d => d.id == divisionId);

    if (division?.subdivisions) {
      // Если есть ограничение по отделению, фильтруем список только до этого отделения
      let filteredSubdivisions = division.subdivisions;
      if (restrictedSubdivisionId) {
        filteredSubdivisions = division.subdivisions.filter(
          (sub: any) => sub.id.toString() === restrictedSubdivisionId.toString()
        );
      }
      setCurrentSubdivisions(filteredSubdivisions);

      // Автоматически выбираем ограниченное отделение, если оно доступно
      if (restrictedSubdivisionId) {
        const restrictedSubdivisionExists = division.subdivisions.some(
          (sub: any) => sub.id.toString() === restrictedSubdivisionId.toString()
        );
        if (restrictedSubdivisionExists) {
          setSelectedSubdivisionId(restrictedSubdivisionId);
          return;
        }
      }
    } else {
      setCurrentSubdivisions([]);
    }

    // Сбрасываем выбор отделения только если нет ограничения
    if (!restrictedSubdivisionId && initialTask?.division?.id !== divisionId) {
      setSelectedSubdivisionId(null);
    }
  };

  // Остальной код остается без изменений...
  // Функция для проверки, является ли ID временным
  const isTempId = (id: string | undefined): boolean => {
    return !id || id.toString().startsWith('temp-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDivisionId) {
      onError('Необходимо выбрать подразделение');
      return;
    }

    // Валидация этапов
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
              is_completed: step.is_completed || false   // передаём текущее значение
            };
            if (step.id && !isTempId(step.id) && !isNaN(Number(step.id))) {
              stepData.id = step.id; // строка
            }
            return stepData;
          })
        };
        await onUpdate(updatedTaskData);
      } else if (onCreate) {
        // Для создания передаем данные в родительский компонент
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
            restrictedDivisionId={restrictedDivisionId} // Передаем в DivisionSelector
          />

          <SubdivisionSelector
            subdivisions={currentSubdivisions}
            selectedSubdivisionId={selectedSubdivisionId}
            onChange={(id) => setSelectedSubdivisionId(id)}
            isLoading={isLoading}
            hasDivision={!!selectedDivisionId}
            restrictedSubdivisionId={restrictedSubdivisionId}
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