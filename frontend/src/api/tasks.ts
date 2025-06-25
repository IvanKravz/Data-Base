import { api } from './client';
import { Task, TaskStep } from '../types/tasks';

interface TaskParams {
  startDate?: string;
  endDate?: string;
  divisionId?: string;
}

export const tasksApi = {
  getTasks: async (divisionId?: string) => {
    const params = divisionId ? { division: divisionId } : {};
    const { data } = await api.get('/tasks/', { params });
    return data;
  },

  getTaskById: async (id: string) => {
    const { data } = await api.get(`/tasks/${id}/`);
    return data;
  },

  createTask: async (taskData: {
    title: string;
    category: string;
    division: string;
    subdivision?: string;
    steps: Array<{
      name: string;
      comments?: string;
      start_date: string;
      end_date: string;
    }>;
  }) => {
    const { data } = await api.post('/tasks/', taskData);
    return data;
  },

  updateTask: async (id: string, taskData: Partial<typeof tasksApi.createTask extends (arg: infer P) => any ? P : never>) => {
    const { data } = await api.patch(`/tasks/${id}/`, taskData);
    return data;
  },

  deleteTask: async (id: string) => {
    await api.delete(`/tasks/${id}/`);
  },

  completeStep: async (stepId: string) => {
    const { data } = await api.post(`/tasks/steps/${stepId}/complete/`);
    return data;
  },

  uncompleteStep: async (stepId: string) => {
    const { data } = await api.post(`/tasks/steps/${stepId}/uncomplete/`);
    return data;
  },

  

  updateTaskStep: async (taskId: string, stepId: string, completed: boolean) => {
    try {
      const { data } = await api.post(`/tasks/steps/${stepId}/toggle/`, {
        completed
      });
      return data;
    } catch (error) {
      return { success: true };
    }
  },

  getCalendarTasks: async (params: TaskParams) => {
    try {
      const { data } = await api.get('/tasks/calendar/', { params });
      return data;
    } catch (error) {
      return [];
    }
  }
};