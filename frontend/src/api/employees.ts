import { api } from './client';
import { Employee } from '../types';

export const employeesApi = {

  uploadPhoto: async (token: string, id: string, photoFile: File): Promise<Employee> => {
    const formData = new FormData();
    formData.append('photo', photoFile);

    const { data } = await api.patch(`/employees/${id}/photo/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  deletePhoto: async (token: string, id: string): Promise<Employee> => {
    try {
      const { data } = await api.delete<Employee>(`/employees/${id}/photo/`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000,
      });

      if (data.photo_url) {
        throw new Error('Фото не было удалено на сервере');
      }
      return data;
    } catch (error) {
      throw new Error('Ошибка удаления фото: ' + error.message);
    }
  },

  getDictionaries: async (token: string): Promise<EmployeeDictionaries> => {
    const { data } = await api.get('/employees/dictionaries/', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return data;
  },

  getPersonnel: async (token: string, params?: any): Promise<Employee[]> => {
    const requestParams = { ordering: 'priority,full_name', ...params };

    let allEmployees: Employee[] = [];
    let nextUrl: string | null = '/employees/';

    while (nextUrl) {
      const response = await api.get<{ results: Employee[], next: string | null }>(nextUrl, {
        params: nextUrl.includes('/employees/') ? requestParams : undefined,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      let employees: Employee[];
      let next: string | null;

      if (Array.isArray(response.data)) {
        employees = response.data;
        next = null;
      } else {
        employees = response.data.results || [];
        next = response.data.next;
      }

      allEmployees = [...allEmployees, ...employees];
      nextUrl = next;
    }

    return allEmployees.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.full_name.localeCompare(b.full_name);
    });
  },

  getPersonById: async (token: string, id: string): Promise<Employee> => {
    const { data } = await api.get(`/employees/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return data;
  },

  createPerson: async (token: string, personData: Omit<Employee, 'id'>) => {
    const { id, ...cleanData } = personData as any;
    const { data } = await api.post('/employees/', cleanData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  updatePerson: async (token: string, id: string, personData: Partial<Employee>) => {
    const { data } = await api.patch(`/employees/${id}/`, personData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  deletePerson: async (token: string, id: string) => {
    await api.delete(`/employees/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  updateQualitativeCharacteristics: async (id: string, data: {
    personalNumber?: string;
    rank?: string;
    rankDate?: string;
    rankOrderNumber?: string;
    secretClearance?: { form?: string; number?: string; date?: string };
    education?: { level?: string; institution?: string; graduationYear?: string; additionalInfo?: string };
    workStartYear?: string;
  }) => {
    const response = await api.put(`/employees/${id}/qualitative/`, data);
    return response.data;
  },

  toggleMaterialResponsible: async (id: string) => {
    const { data } = await api.post(`/employees/${id}/toggle-material-responsible/`);
    return data;
  },

  toggleShaWorker: async (id: string) => {
    const { data } = await api.post(`/employees/${id}/toggle-sha-worker/`);
    return data;
  },

  updateShaDetails: async (id: string, shaDetails: Employee['shaDetails']) => {
    const { data } = await api.put(`/employees/${id}/sha-details/`, shaDetails);
    return data;
  },

  updateComments: async (personId: string, comments: string) => {
    const { data } = await api.patch(`/employees/${personId}/comments/`, { comments });
    return data;
  },

  getEmployeesBrief: async (token: string, params?: { position?: string }) => {
    const { data } = await api.get('/employees/', {
      params: { ...params, brief: true },
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getEmployeesByDivision: async (token: string, divisionId: number) => {
    const { data } = await api.get('/employees/', {
      params: { division: divisionId },
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getScheduleEvents: async (
    token: string,
    params: { year: number; month: number; division?: number; subdivision?: number },
  ): Promise<ScheduleEvent[]> => {
    const { data } = await api.get('/employees/schedule-events/by_month/', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  createScheduleEvent: async (
    token: string,
    event: Omit<ScheduleEvent, 'id' | 'employee_name' | 'employee_id'>,
  ) => {
    const { data } = await api.post('/employees/schedule-events/', event, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateScheduleEvent: async (token: string, id: number, event: Partial<ScheduleEvent>) => {
    const { data } = await api.patch(`/employees/schedule-events/${id}/`, event, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteScheduleEvent: async (token: string, id: number) => {
    await api.delete(`/employees/schedule-events/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  bulkUpdateScheduleEvents: async (token: string, payload: {
    employee_ids: number[];
    start_date: string;
    end_date: string;
    event_type: string;
    comment?: string;
  }) => {
    const { data } = await api.post('/employees/schedule-events/bulk_update/', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  /**
   * Список сотрудников для страницы графика.
   * Бэкенд применяет фильтры ролей по ScheduleEvent — этот список
   * может отличаться от общего /employees/.
   */
  getScheduleEmployees: async (
    token: string,
    params?: { division?: number; subdivision?: number },
  ): Promise<Employee[]> => {
    const { data } = await api.get('/employees/schedule-events/available_employees/', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};

function formatDate(date: string | Date): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}