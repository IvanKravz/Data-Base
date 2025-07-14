import { api } from './client';
import { Task, TaskStep } from '../types/tasks';

interface TaskParams {
  startDate?: string;
  endDate?: string;
  divisionId?: string;
}

interface DivisionRef {
  id: string;
  name: string;
}

interface SubdivisionRef {
  id: string;
  name: string;
}

export const tasksApi = {
  getTasks: async (params: {
    division?: string;
    subdivision?: string;
  }) => {
    const { data } = await api.get('/tasks/', {
      params: {
        division: params.division,
        subdivision: params.subdivision
      }
    });
    return data.results;
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
    division: string;  // Теперь просто строка (ID)
    subdivision?: string | null;
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
  
  updateTask: async (token: string, id: string, taskData: {
    title?: string;
    category?: string;
    division_id?: string;
    subdivision_id?: string | null; // Явно указываем что может быть null
    steps?: Array<{
      name: string;
      comments?: string;
      start_date: string;
      end_date: string;
    }>;
  }) => {
    if (!id || !/^\d+$/.test(id)) {
      throw new Error(`Invalid task ID format. Expected numeric string, got: ${id}`);
    }

    // console.log('taskData', taskData)
  
    const { data } = await api.patch(`/tasks/${id}/`, {
      ...taskData,
      // Убедитесь что бэкенд ожидает именно такие названия полей
      division: taskData.division_id,
      subdivision: taskData.subdivision_id === null ? null : taskData.subdivision_id
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log('data', data)
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

  updateTaskStep: async (stepId: string, completed: boolean) => {
    if (completed) {
      return await tasksApi.completeStep(stepId);
    } else {
      return await tasksApi.uncompleteStep(stepId);
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