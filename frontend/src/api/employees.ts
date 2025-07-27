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
  // Get all personnel with optional filters

  getDictionaries: async (token: string): Promise<EmployeeDictionaries> => {
    const { data } = await api.get('users/employees/dictionaries/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  getPersonnel: async (token: string, params?: {
    division?: string | null;
    isMaterialResponsible?: boolean;
    isShaWorker?: boolean;
    accessLevel?: string;
    search?: string;
  }): Promise<Employee[]> => {
    const response = await api.get<Employee[]>('users/employees/', {
      params: params || {}, // Просто передаем params как есть
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.data;
  },

  // Get person by ID
  getPersonById: async (token: string, id: string) => {
    const { data } = await api.get(`users/employees/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Передача токена в заголовке
      },
    });
    return data;
  },

  // Create new person
  createPerson: async (token: string, personData: Omit<Employee, 'id'>) => {
    const { data } = await api.post('users/employees/', personData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  // Update existing person
  updatePerson: async (token: string, id: string, personData: Partial<Employee>) => {
    // Подготавливаем данные для отправки
    const dataToSend = {
      ...personData,
      // Преобразуем даты в строки, если они есть
      birth_date: personData.birth_date ? formatDate(personData.birth_date) : undefined,
      contract_date: personData.contract_date ? formatDate(personData.contract_date) : undefined,
      data_state_secrets: personData.data_state_secrets ? formatDate(personData.data_state_secrets) : undefined,
      year_graduation: personData.year_graduation ? formatDate(personData.year_graduation) : undefined,
      date_start_work: personData.date_start_work ? formatDate(personData.date_start_work) : undefined,
      date_end_work: personData.date_end_work ? formatDate(personData.date_end_work) : undefined,
      order_rank: personData.order_rank || null,
      // Убираем лишние поля, которые бэкенд не ожидает
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      division: undefined,
      subdivision: undefined,
      // Обрабатываем подразделения
      division_id: personData.division?.id || null,
      subdivision_id: personData.subdivision?.id || null,
      // Обрабатываем sha_details
      sha_details: personData.is_sha_worker ? personData.sha_details : null
    };

    const { data } = await api.patch(`users/employees/${id}/`, dataToSend, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  // Delete person
  deletePerson: async (token: string, id: string) => {
    await api.delete(`users/employees/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Передача токена в заголовке
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
    const response = await api.put(`users/employees/${id}/qualitative/`, data);
    return response.data;
  },

  // Toggle material responsible status
  toggleMaterialResponsible: async (id: string) => {
    const { data } = await api.post(`users/employees/${id}/toggle-material-responsible/`);
    return data;
  },

  // Toggle SHA worker status
  toggleShaWorker: async (id: string) => {
    const { data } = await api.post(`users/employees/${id}/toggle-sha-worker/`);
    return data;
  },

  // Update SHA worker details
  updateShaDetails: async (id: string, shaDetails: Employee['shaDetails']) => {
    const { data } = await api.put(`users/employees/${id}/sha-details/`, shaDetails);
    return data;
  },

  // Update person comments
  updateComments: async (personId: string, comments: string) => {
    const { data } = await api.patch(`users/employees/${personId}/comments/`, {
      comments
    });
    return data;
  }
};

function formatDate(date: string | Date): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0]; // Формат YYYY-MM-DD
}