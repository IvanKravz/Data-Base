import { api } from './client';
import { Division, Subdivision } from '../types';

export const divisionsApi = {
  // Получить все подразделения
  getDivisions: async (token: string) => {
    const { data } = await api.get('/facilities/divisions/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Получить подразделение по ID
  getDivisionById: async (id: string | number, token: string) => {
    const { data } = await api.get(`/facilities/divisions/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Создать подразделение
  createDivision: async (divisionData: Partial<Division>, token: string) => {
    const { data } = await api.post('/facilities/divisions/', divisionData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Обновить подразделение
  updateDivision: async (id: string | number, divisionData: Partial<Division>, token: string) => {
    const payload: any = { ...divisionData };
    // Преобразуем поля head и deputy_head
    if (payload.head !== undefined) {
      payload.head_id = payload.head;
      delete payload.head;
    }
    if (payload.deputy_head !== undefined) {
      payload.deputy_head_id = payload.deputy_head;
      delete payload.deputy_head;
    }
    const { data } = await api.patch(`/facilities/divisions/${id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Удалить подразделение
  deleteDivision: async (id: string | number, token: string) => {
    await api.delete(`/facilities/divisions/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Получить отделения подразделения
  getSubdivisions: async (divisionId: string | number, token: string) => {
    const { data } = await api.get(`/facilities/subdivisions/?division=${divisionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Создать отделение
  createSubdivision: async (subdivisionData: Partial<Subdivision>, token: string) => {
    const { data } = await api.post('/facilities/subdivisions/', subdivisionData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Обновить отделение
  updateSubdivision: async (id: string | number, subdivisionData: Partial<Subdivision>, token: string) => {
    const payload: any = { ...subdivisionData };
    if (payload.head !== undefined) {
      payload.head_id = payload.head;
      delete payload.head;
    }
    if (payload.deputy_head !== undefined) {
      payload.deputy_head_id = payload.deputy_head;
      delete payload.deputy_head;
    }
    const { data } = await api.patch(`/facilities/subdivisions/${id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Удалить отделение
  deleteSubdivision: async (id: string | number, token: string) => {
    await api.delete(`/facilities/subdivisions/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Получить все отделения (без фильтра)
  getAllSubdivisions: async (token: string) => {
    const { data } = await api.get('/facilities/subdivisions/', {
      headers: { Authorization: `Bearer ${token}` },
    });
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