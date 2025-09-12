import { api } from './client';
import { Equipment } from '../types';

export const equipmentApi = {
  getEquipment: async (token: string, params?: {
    division?: string;
    category?: string;
    status?: string;
    type?: 'open' | 'closed';
    search?: string;
    facility?: string;
  }) => {
    const { data } = await api.get('/equipment/', { params , 
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data.results;
  },

  getEquipmentByEmployee: async (token: string, employeeId: string) => {
    const { data } = await api.get(`/equipment/assigned_to/${employeeId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  getEquipmentById: async (token: string, id: string) => {
    const { data } = await api.get(`/equipment/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  getShdEquipment: async (token: string, divisionId?: string, facilityId?: string): Promise<Equipment[]> => {
    const params: any = { category: 'shd' };
    if (divisionId) params.division = divisionId;
    if (facilityId) params.facility = facilityId;
    
    const { data } = await api.get('/equipment/', { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data.results || [];
  },

  createEquipment: async (equipmentData: Omit<Equipment, 'id'>) => {
    const { data } = await api.post('/equipment/', equipmentData);
    return data;
  },

  updateEquipment: async (token: string, id: string, equipmentData: Partial<Equipment>) => {
    const { data } = await api.put(`/equipment/${id}/`, equipmentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return data;
  },

  deleteEquipment: async (id: string) => {
    await api.delete(`/equipment/${id}/`);
  },

  getEquipmentCategories: async (token: string): Promise<{value: string; name: string; is_closed: boolean}[]> => {
    try {
      const { data } = await api.get('/equipment/categories/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return data;
    } catch (error) {
      console.error('Error fetching equipment categories:', error);
      return [];
    }
  },

  getEquipmentStats: async (params?: {
    division?: string;
    type?: 'open' | 'closed';
  }) => {
    const { data } = await api.get('/equipment/stats/', { params });
    return data;
  },

  assignEquipment: async (equipmentId: string, userId: string) => {
    const { data } = await api.post(`/equipment/${equipmentId}/assign/`, {
      user_id: userId
    });
    return data;
  },

  moveEquipment: async (equipmentId: string, facilityId: string | null) => {
    const { data } = await api.post(`/equipment/${equipmentId}/move/`, {
      facility_id: facilityId
    });
    return data;
  },

  updateComments: async (equipmentId: string, comments: string) => {
    const { data } = await api.patch(`/equipment/${equipmentId}/comments/`, {
      comments
    });
    return data;
  },

  getNetworkConfig: async (token: string, equipmentId: string) => {
    const { data } = await api.get(`/equipment/${equipmentId}/network_config/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },
};