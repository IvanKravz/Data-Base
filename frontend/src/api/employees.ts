import { api } from './client';
import { Employee } from '../types';

export interface EmployeeDictionaries {
  categories: { value: string; label: string }[];
  officer_positions: { value: string; label: string }[];
  warrant_officer_positions: { value: string; label: string }[];
  civilian_positions: { value: string; label: string }[];
  officer_ranks: { value: string; label: string }[];
  warrant_officer_ranks: { value: string; label: string }[];
}

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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 15000
      });

      // Проверяем, что фото действительно удалено
      if (data.photo_url) {
        throw new Error('Фото не было удалено на сервере');
      }

      return data;
    } catch (error) {
      throw new Error('Ошибка удаления фото: ' + error.message);
    }
  },

  // Get all personnel with optional filters
  getDictionaries: async (token: string): Promise<EmployeeDictionaries> => {
    const { data } = await api.get('/employees/dictionaries/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  getPersonnel: async (token: string, params?: any): Promise<Employee[]> => {
    // Добавляем сортировку по умолчанию в параметры
    const requestParams = {
      ordering: 'priority,full_name', // Сортировка по приоритету и ФИО
      ...params
    };

    let allEmployees: Employee[] = [];
    let nextUrl: string | null = '/employees/';
  
    while (nextUrl) {
      const response = await api.get<{ results: Employee[], next: string | null }>(nextUrl, {
        // Для первого запроса используем параметры, для последующих - не используем, так как nextUrl уже содержит параметры
        params: nextUrl.includes('/employees/') ? requestParams : undefined,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      // Обрабатываем разные форматы ответа (с пагинацией и без)
      let employees: Employee[];
      let next: string | null;
  
      if (Array.isArray(response.data)) {
        // Если ответ - массив (без пагинации)
        employees = response.data;
        next = null;
      } else {
        // Если ответ с пагинацией
        employees = response.data.results || [];
        next = response.data.next;
      }
  
      allEmployees = [...allEmployees, ...employees];
      nextUrl = next;
    }
  
    // Дополнительная сортировка на клиенте для гарантии
    return allEmployees.sort((a, b) => {
      // Сначала по приоритету (чем меньше число, тем выше приоритет)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Если приоритеты равны, сортируем по ФИО
      return a.full_name.localeCompare(b.full_name);
    });
  },

  // Get person by ID
  getPersonById: async (token: string, id: string): Promise<Employee> => {
    const { data } = await api.get(`/employees/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  // Create new person
  createPerson: async (token: string, personData: Omit<Employee, 'id'>) => {
    // Очищаем данные от любого возможного id
    const { id, ...cleanData } = personData as any;

    const { data } = await api.post('/employees/', cleanData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  // Update existing person
  updatePerson: async (token: string, id: string, personData: Partial<Employee>) => {
    const { data } = await api.patch(`/employees/${id}/`, personData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  // Delete person
  deletePerson: async (token: string, id: string) => {
    await api.delete(`/employees/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Update person's qualitative characteristics
  updateQualitativeCharacteristics: async (id: string, data: {
    personalNumber?: string;
    rank?: string;
    rankDate?: string;
    rankOrderNumber?: string;
    secretClearance?: {
      form?: string;
      number?: string;
      date?: string;
    };
    education?: {
      level?: string;
      institution?: string;
      graduationYear?: string;
      additionalInfo?: string;
    };
    workStartYear?: string;
  }) => {
    const response = await api.put(`/employees/${id}/qualitative/`, data);
    return response.data;
  },

  // Toggle material responsible status
  toggleMaterialResponsible: async (id: string) => {
    const { data } = await api.post(`/employees/${id}/toggle-material-responsible/`);
    return data;
  },

  // Toggle SHA worker status
  toggleShaWorker: async (id: string) => {
    const { data } = await api.post(`/employees/${id}/toggle-sha-worker/`);
    return data;
  },

  // Update SHA worker details
  updateShaDetails: async (id: string, shaDetails: Employee['shaDetails']) => {
    const { data } = await api.put(`/employees/${id}/sha-details/`, shaDetails);
    return data;
  },

  // Update person comments
  updateComments: async (personId: string, comments: string) => {
    const { data } = await api.patch(`/employees/${personId}/comments/`, {
      comments
    });
    return data;
  },
};

function formatDate(date: string | Date): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0]; // Формат YYYY-MM-DD
}