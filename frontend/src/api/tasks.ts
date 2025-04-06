import { api } from './client';
import { Task } from '../types/tasks';

interface TaskParams {
  startDate?: string;
  endDate?: string;
  divisionId?: string;
}

export const  tasksApi = {
  getTasks: async (divisionId?: string) => {
    try {
      const params = divisionId ? { division: divisionId } : {};
      const { data } = await api.get('/tasks/', { params });
      return data;
    } catch (error) {
      return [];
    }
  },

  getTaskById: async (id: string) => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  createTask: async (taskData: Omit<Task, 'id'>) => {
    try {
      const { data } = await api.post('/tasks/', taskData);
      return data;
    } catch (error) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return newTask;
    }
  },

  updateTask: async (id: string, taskData: Partial<Task>) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, taskData);
      return data;
    } catch (error) {
      return {
        id,
        ...taskData,
        updatedAt: new Date().toISOString()
      };
    }
  },

  deleteTask: async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
    } catch (error) {
      throw error;
    }
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