import { TaskCategory } from './taskCategories';

export interface TaskStep {
  id: string;
  name: string;
  comments: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  divisionId: string;
  steps: TaskStep[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}