import { api } from './client';
import { Facility } from '../types';

export const facilitiesApi = {
  // Get all facilities with optional filters
  getFacilities: async (params?: {
    token?: string;
    division?: string;
    type?: 'station' | 'shd';
    class?: '1' | '2';
    search?: string;
  }) => {
    const { data } = await api.get('/facilities/', {
      params: {
        division: params?.division,
        type: params?.type,
        class: params?.class,
        search: params?.search
      },
      headers: params?.token ? {
        Authorization: `Bearer ${params.token}`,
      } : undefined
    });
    return data.results;
  },

  // Get facility by ID
  getFacilityById: async (id: string, token: string) => {
    const { data } = await api.get(`/facilities/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    return data;
  },

  // Create new facility
  createFacility: async (facilityData: Omit<Facility, 'id'>) => {
    const { data } = await api.post('/facilities/', facilityData);
    return data;
  },

  // Update existing facility
  updateFacility: async (id: string, facilityData: Partial<Facility>) => {
    const { data } = await api.put(`/facilities/${id}/`, facilityData);
    return data;
  },

  // Delete facility
  deleteFacility: async (id: string) => {
    await api.delete(`/facilities/${id}/`);
  },

  // Get facility equipment
  getFacilityEquipment: async (id: string, params?: {
    type?: 'open' | 'closed';
    status?: string;
  }) => {
    const { data } = await api.get(`/facilities/${id}/equipment/`, { params });
    return data;
  },

  // Get facility personnel
  getFacilityPersonnel: async (id: string) => {
    const { data } = await api.get(`/facilities/${id}/personnel/`);
    return data;
  },

  // Get facility statistics
  getFacilityStats: async (id: string) => {
    const { data } = await api.get(`/facilities/${id}/stats/`);
    return data;
  },

  // Update facility comments
  updateComments: async (facilityId: string, comments: string) => {
    const { data } = await api.patch(`/facilities/${facilityId}/comments/`, {
      comments
    });
    return data;
  }
};