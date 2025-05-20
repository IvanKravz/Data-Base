import { api } from './client';
import { Equipment } from '../types';

export const equipmentApi = {
  // Get all equipment with optional filters
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
        'Authorization': `Bearer ${token}`, // Передача токена в заголовке
      },
    });
    return data.results;
  },

  // Get equipment by ID
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

  // Create new equipment
  createEquipment: async (equipmentData: Omit<Equipment, 'id'>) => {
    const { data } = await api.post('/equipment/', equipmentData);
    return data;
  },

  // Update existing equipment
  updateEquipment: async (token: string, id: string, equipmentData: Partial<Equipment>) => {
    const { data } = await api.put(`/equipment/${id}/`, equipmentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return data;
  },

  // Delete equipment
  deleteEquipment: async (id: string) => {
    await api.delete(`/equipment/${id}/`);
  },

  getEquipmentCategories: async (token: string): Promise<{
    open: {value: string; name: string}[];
    closed: {value: string; name: string}[];
  }> => {
    try {
      const { data } = await api.get('/equipment/categories/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return data;
    } catch (error) {
      console.error('Error fetching equipment categories:', error);
      return { open: [], closed: [] };
    }
  },

  // Get equipment statistics
  getEquipmentStats: async (params?: {
    division?: string;
    type?: 'open' | 'closed';
  }) => {
    const { data } = await api.get('/equipment/stats/', { params });
    return data;
  },

  // Assign equipment to a person
  assignEquipment: async (equipmentId: string, userId: string) => {
    const { data } = await api.post(`/equipment/${equipmentId}/assign/`, {
      user_id: userId
    });
    return data;
  },

  // Move equipment to a facility
  moveEquipment: async (equipmentId: string, facilityId: string | null) => {
    const { data } = await api.post(`/equipment/${equipmentId}/move/`, {
      facility_id: facilityId
    });
    return data;
  },

  // Update equipment comments
  updateComments: async (equipmentId: string, comments: string) => {
    const { data } = await api.patch(`/equipment/${equipmentId}/comments/`, {
      comments
    });
    return data;
  }
};