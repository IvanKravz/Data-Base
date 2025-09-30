import { api } from './client';
import { Equipment } from '../types';

export const equipmentApi = {
  getEquipment: async (token: string, params?: {
    division?: string;
    category?: string;
    status?: string;
    type?: string;
    search?: string;
    facility?: string;
  }) => {
    const { data } = await api.get('/equipment/', {
      params,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
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
    return data || [];
  },

  createEquipment: async (token: string, data: any) => {
    try {
      const response = await api.post('/equipment/', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('response data', response)
      return response.data;
    } catch (error: any) {
      console.error('Error creating equipment:', error.response?.data);
      throw error;
    }
  },

  updateEquipment: async (token: string, id: string, equipmentData: Partial<Equipment>) => {
    console.log('equipmentData', equipmentData)
    const { data } = await api.put(`/equipment/${id}/`, equipmentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return data;
  },

  deleteEquipment: async (id: string) => {
    const token = localStorage.getItem('accessToken');
    await api.delete(`/equipment/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  getEquipmentCategories: async (token: string): Promise<{ value: string; name: string; is_closed: boolean }[]> => {
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
  
  getInterestOrgans: async (token: string): Promise<{ id: string; name: string }[]> => {
    try {
      const { data } = await api.get('/equipment/interest-organs/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return data;
    } catch (error) {
      console.error('Error fetching interest organs:', error);
      return [];
    }
  },
};