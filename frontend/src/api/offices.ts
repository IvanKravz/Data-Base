import { api } from './client';

export const officesApi = {
  // Get all offices
  getOffices: async (token: string) => {
    const { data } = await api.get('/map/offices/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('data', data);
    return data;
  },

  // Get office by ID
  getOfficeById: async (id: string, token: string) => {
    const { data } = await api.get(`/map/offices/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  // Create new office
  createOffice: async (officeData: {
    name: string;
    region: string;
    address: string;
    latitude: number;
    longitude: number;
    contact_phone: string;
    email: string;
    description: string;
  }, token: string) => {
    const { data } = await api.post('/map/offices/', officeData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  // Update entire office (PUT)
  updateOffice: async (id: string, officeData: {
    name: string;
    region: string;
    address: string;
    latitude: number;
    longitude: number;
    contact_phone: string;
    email: string;
    description: string;
  }, token: string) => {
    const { data } = await api.put(`/map/offices/${id}/`, officeData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  // Partially update office (PATCH)
  patchOffice: async (id: string, partialData: Partial<{
    name: string;
    region: string;
    address: string;
    latitude: number;
    longitude: number;
    contact_phone: string;
    email: string;
    description: string;
  }>, token: string) => {
    const { data } = await api.patch(`/map/offices/${id}/`, partialData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  // Delete office
  deleteOffice: async (id: string, token: string) => {
    await api.delete(`/map/offices/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get offices with filtering
  getOfficesWithFilters: async (params?: {
    region?: string;
    search?: string;
  }, token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await api.get('/map/offices/', { 
      params,
      headers
    });
    return data;
  }
};