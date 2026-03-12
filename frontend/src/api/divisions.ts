import { api } from './client';

export const divisionsApi = {
  // Get all divisions
  getDivisions: async (token: string) => {
    const { data } = await api.get('/facilities/divisions/', {
      headers: {
        Authorization: `Bearer ${token}`, // Передача токена в заголовке
      },
    });
    return data;
  },

   // Получить отделения по ID подразделения (предполагается наличие такого эндпоинта)
   getSubdivisions: async (divisionId: number) => {
    const { data } = await api.get(`/facilities/subdivisions/?division=${divisionId}`);
    return data;
  },

  // Get division by ID
  getDivisionById: async (id: string, token: string) => {
    const { data } = await api.get(`/facilities/divisions/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`, // Передача токена в заголовке
      },
    });;
    return data;
  },

  // Get division equipment
  getDivisionEquipment: async (id: string, params?: {
    type?: 'open' | 'closed';
    category?: string;
    status?: string;
    search?: string;
  }) => {
    const { data } = await api.get(`/facilities/divisions/${id}/equipment/`, { params });
    return data;
  },

  // Get division personnel
  getDivisionPersonnel: async (id: string, params?: {
    isMaterialResponsible?: boolean;
    isShaWorker?: boolean;
    accessLevel?: string;
    search?: string;
  }) => {
    const { data } = await api.get(`/facilities/divisions/${id}/personnel/`, { params });
    return data;
  },

  // Get division facilities
  getDivisionFacilities: async (id: string, params?: {
    type?: 'station' | 'shd';
    class?: '1' | '2';
    search?: string;
  }) => {
    const { data } = await api.get(`/facilities/divisions/${id}/facilities/`, { params });
    return data;
  },

  // Get division tasks
  getDivisionTasks: async (id: string, params?: {
    search?: string;
  }) => {
    const { data } = await api.get(`/facilities/divisions/${id}/tasks/`, { params });
    return data;
  },

  // Get division statistics
  getDivisionStats: async (id: string) => {
    const { data } = await api.get(`/facilities/divisions/${id}/stats/`);
    return data;
  }
};