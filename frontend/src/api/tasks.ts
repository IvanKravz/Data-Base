import { api } from './client';
import { Task, TaskStep } from '../types/tasks';

interface TaskParams {
  startDate?: string;
  endDate?: string;
  divisionId?: string;
}

export const tasksApi = {
  getTasks: async (params: {
    division?: string;
    subdivision?: string;
    show_completed: string;
    show_only_mine: boolean;
  }, token?: string) => {
    const { data } = await api.get('/tasks/', {
      params: {
        division: params.division,
        subdivision: params.subdivision,
        show_only_mine: params.show_only_mine ? 'true' : 'false'
      },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  getTaskById: async (id: string) => {
    const { data } = await api.get(`/tasks/${id}/`);
    return data;
  },

  getIncompleteTasksCount: async (options: { subdivisionId?: string; divisionId?: string } = {}) => {
    const params: Record<string, string> = {};
    if (options.subdivisionId) {
      params.subdivision = options.subdivisionId;
    }
    if (options.divisionId) {
      params.division = options.divisionId;
    }
    const { data } = await api.get('/tasks/incomplete-count/', { params });
    return data.count;
  },

  createTask: async (taskData: {
    title: string;
    category: string;
    division_id: string; // Должно быть строкой
    subdivision_id?: string | null;
    is_private: boolean;
    steps: Array<{
      name: string;
      comments?: string;
      start_date: string;
      end_date: string;
    }>;
  }, token: string) => {

    const { data } = await api.post('/tasks/', taskData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return data;
  },

  updateTask: async (token: string, id: string, taskData: {
    title?: string;
    category?: string;
    division_id?: string;
    subdivision_id?: string | null;
    is_private: boolean;
    steps?: Array<{
      id?: string;
      name: string;
      comments?: string;
      start_date: string;
      end_date: string;
    }>;
  }) => {
    if (!id || !/^\d+$/.test(id)) {
      throw new Error(`Invalid task ID format. Expected numeric string, got: ${id}`);
    }

    console.log('Updating task with data:', taskData);

    const { data } = await api.patch(`/tasks/${id}/`, taskData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    return data;
  },

  deleteTask: async (id: string, token: string) => {
    await api.delete(`/tasks/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  completeStep: async (stepId: string, token: string) => {
    const { data } = await api.post(`/tasks/steps/${stepId}/complete/`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  uncompleteStep: async (stepId: string, token: string) => {
    const { data } = await api.post(`/tasks/steps/${stepId}/uncomplete/`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateTaskStep: async (stepId: string, completed: boolean, token: string) => {
    if (completed) {
      return await tasksApi.completeStep(stepId, token);
    } else {
      return await tasksApi.uncompleteStep(stepId, token);
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