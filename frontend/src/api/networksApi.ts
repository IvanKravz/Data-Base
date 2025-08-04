import { api } from './client';
import { CommunicationNetwork } from '../types';

export const networksApi = {
  getNetworks: async (token: string): Promise<CommunicationNetwork[]> => {
    const { data } = await api.get<{ results?: CommunicationNetwork[] }>('/networks/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data.results || [];
  },

  createNetwork: async (token: string, networkData: Omit<CommunicationNetwork, 'id'>) => {
    const { data } = await api.post('/networks/', networkData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateNetwork: async (token: string, id: string, networkData: Partial<CommunicationNetwork>) => {
    const { data } = await api.patch(`/networks/${id}/`, networkData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteNetwork: async (token: string, id: string) => {
    await api.delete(`/networks/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};