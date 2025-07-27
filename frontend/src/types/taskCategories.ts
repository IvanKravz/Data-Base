import { Task } from "./tasks";

export type TaskCategory = 'urgent' | 'planned' | 'attention';

export const taskCategories: Record<TaskCategory, { label: string; color: string }> = {
  urgent: {
    label: 'Срочно',
    color: 'red'
  },
  planned: {
    label: 'Плановая',
    color: 'blue'
  },
  attention: {
    label: 'Внимание',
    color: 'yellow'
  },
};

export const isTaskCompleted = (task: Task) => {
  return task.is_completed; // Теперь используем поле задачи
};
