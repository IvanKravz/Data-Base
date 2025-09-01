import { api } from './client';
import { 
  CommunicationNetwork, 
  VLAN, 
  NetworkInterface, 
  IPAddress, 
  IPRange,
  Equipment 
} from '../types';

export const networksApi = {
  // Методы для сетей связи
  getNetworks: async (token: string): Promise<CommunicationNetwork[]> => {
    const { data } = await api.get('/networks/', {
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
  },

  // Методы для VLAN
  getVlans: async (token: string): Promise<VLAN[]> => {
    const { data } = await api.get('/vlans/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data.results || [];
  },

  createVlan: async (token: string, vlanData: Omit<VLAN, 'id'>) => {
    const { data } = await api.post('/vlans/', vlanData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateVlan: async (token: string, id: string, vlanData: Partial<VLAN>) => {
    const { data } = await api.patch(`/vlans/${id}/`, vlanData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteVlan: async (token: string, id: string) => {
    await api.delete(`/vlans/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Методы для сетевых интерфейсов
  getNetworkInterfaces: async (token: string): Promise<NetworkInterface[]> => {
    const { data } = await api.get('/network-interfaces/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data.results || [];
  },

  createNetworkInterface: async (token: string, interfaceData: Omit<NetworkInterface, 'id'>) => {
    const { data } = await api.post('/network-interfaces/', interfaceData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateNetworkInterface: async (token: string, id: string, interfaceData: Partial<NetworkInterface>) => {
    const { data } = await api.patch(`/network-interfaces/${id}/`, interfaceData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteNetworkInterface: async (token: string, id: string) => {
    await api.delete(`/network-interfaces/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Методы для IP-адресов
  getIPAddresses: async (token: string): Promise<IPAddress[]> => {
    const { data } = await api.get('/ip-addresses/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data.results || [];
  },

  createIPAddress: async (token: string, ipData: Omit<IPAddress, 'id'>) => {
    const { data } = await api.post('/ip-addresses/', ipData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateIPAddress: async (token: string, id: string, ipData: Partial<IPAddress>) => {
    const { data } = await api.patch(`/ip-addresses/${id}/`, ipData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteIPAddress: async (token: string, id: string) => {
    await api.delete(`/ip-addresses/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Методы для диапазонов IP
  getIPRanges: async (token: string): Promise<IPRange[]> => {
    const { data } = await api.get('/ip-ranges/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data.results || [];
  },

  createIPRange: async (token: string, rangeData: Omit<IPRange, 'id'>) => {
    const { data } = await api.post('/ip-ranges/', rangeData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateIPRange: async (token: string, id: string, rangeData: Partial<IPRange>) => {
    const { data } = await api.patch(`/ip-ranges/${id}/`, rangeData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteIPRange: async (token: string, id: string) => {
    await api.delete(`/ip-ranges/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Метод для получения оборудования (для привязки к интерфейсам и диапазонам IP)
  getEquipment: async (token: string): Promise<Equipment[]> => {
    const { data } = await api.get('/equipment/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data.results || [];
  },
};