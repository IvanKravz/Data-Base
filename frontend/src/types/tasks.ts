import { Division, Subdivision, User } from '.';
import { TaskCategory } from './taskCategories';

export interface TaskStep {
  id: string;
  name: string;
  comments?: string;
  start_date: string; 
  end_date: string;   
  is_completed: boolean;
  completed_by?: User;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  division: Division;
  subdivision?: Subdivision;
  steps: TaskStep[];
  created_by: User;
  created_at: string;
  updated_by?: User;
  updated_at?: string;
  is_private: boolean;
  is_completed?: boolean;
  progress?: number;
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}