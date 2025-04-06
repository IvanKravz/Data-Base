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
    label: 'Обратить внимание',
    color: 'yellow'
  }
};

export const isTaskCompleted = (task: { steps: { isCompleted: boolean }[] }): boolean => {
  return task.steps.length > 0 && task.steps.every(step => step.isCompleted);
};