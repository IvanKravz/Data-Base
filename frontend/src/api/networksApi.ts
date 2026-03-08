import { api } from './client';
import {
  CommunicationNetwork,
  VLAN,
  NetworkInterface,
  IPAddress,
  IPRange,
  Equipment,
  NetworkDirection
} from '../types';

export const networksApi = {
  // Методы для сетей связи
  getNetworks: async (token: string, divisionId?: string): Promise<CommunicationNetwork[]> => {
    const params = divisionId ? { division: divisionId } : {};
    const { data } = await api.get('/networks/', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return Array.isArray(data) ? data : data || [];
  },

  getNetwork: async (token: string, id: string): Promise<CommunicationNetwork> => {
    const { data } = await api.get(`/networks/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  createNetwork: async (token: string, networkData: Omit<CommunicationNetwork, 'id'>) => {
    const { data } = await api.post('/networks/', networkData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateNetwork: async (token: string, id: string, networkData: Partial<CommunicationNetwork>) => {
    const { data } = await api.put(`/networks/${id}/`, networkData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteNetwork: async (token: string, id: string) => {
    await api.delete(`/networks/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Методы для управления членствами сети
  getNetworkMemberships: async (token: string, networkId: string) => {
    const { data } = await api.get(`/networks/network-memberships/?network=${networkId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data || [];
  },

  createNetworkMembership: async (token: string, membershipData: any) => {
    const { data } = await api.post('/networks/network-memberships/', membershipData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateNetworkMembership: async (token: string, id: string, membershipData: any) => {
    const { data } = await api.patch(`/networks/network-memberships/${id}/`, membershipData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteNetworkMembership: async (token: string, id: string) => {
    await api.delete(`/networks/network-memberships/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  bulkUpdateNetworkMemberships: async (token: string, networkId: string, memberships: any[]) => {
    // Используем существующий bulk_create эндпоинт
    const { data } = await api.post('/networks/network-memberships/bulk_create/', {
      network: networkId,
      memberships: memberships
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  // Методы для управления направлениями сети
  getNetworkDirections: async (token: string, networkId: string) => {
    const { data } = await api.get(`/networks/network-directions/?network=${networkId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data || [];
  },

  createNetworkDirection: async (token: string, directionData: any) => {
    const { data } = await api.post('/networks/network-directions/', directionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateNetworkDirection: async (token: string, id: string, directionData: any) => {
    const { data } = await api.patch(`/networks/network-directions/${id}/`, directionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteNetworkDirection: async (token: string, id: string) => {
    await api.delete(`/networks/network-directions/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  bulkUpdateNetworkDirections: async (token: string, networkId: string, directions: NetworkDirection[]) => {
    const { data } = await api.post('/networks/network-directions/bulk_create/', {
      network: parseInt(networkId),
      directions: directions
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  // Методы для VLAN
  getVlans: async (token: string): Promise<VLAN[]> => {
    const { data } = await api.get('/networks/vlans/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data || [];
  },

  createVlan: async (token: string, vlanData: Omit<VLAN, 'id'>) => {
    const { data } = await api.post('/networks/vlans/', vlanData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateVlan: async (token: string, id: string, vlanData: Partial<VLAN>) => {
    const { data } = await api.patch(`/networks/vlans/${id}/`, vlanData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteVlan: async (token: string, id: string) => {
    await api.delete(`/networks/vlans/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Методы для сетевых интерфейсов
  getNetworkInterfaces: async (token: string): Promise<NetworkInterface[]> => {
    const { data } = await api.get('/networks/network-interfaces/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data || [];
  },

  createNetworkInterface: async (token: string, interfaceData: Omit<NetworkInterface, 'id'>) => {
    const { data } = await api.post('/networks/network-interfaces/', interfaceData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteNetworkInterface: async (token: string, id: string) => {
    await api.delete(`/networks/network-interfaces/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Методы для IP-адресов
  getIPAddresses: async (token: string): Promise<IPAddress[]> => {
    const { data } = await api.get('/networks/ip-addresses/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data || [];
  },

  createIPAddress: async (token: string, ipData: Omit<IPAddress, 'id'>) => {
    const { data } = await api.post('/networks/ip-addresses/', ipData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateIPAddress: async (token: string, id: string, ipData: Partial<IPAddress>) => {
    const { data } = await api.patch(`/networks/ip-addresses/${id}/`, ipData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteIPAddress: async (token: string, id: string) => {
    await api.delete(`/networks/ip-addresses/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Методы для диапазонов IP
  getIPRanges: async (token: string): Promise<IPRange[]> => {
    const { data } = await api.get('/networks/ip-ranges/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data || [];
  },

  createIPRange: async (token: string, rangeData: Omit<IPRange, 'id'>) => {
    const { data } = await api.post('/networks/ip-ranges/', rangeData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateIPRange: async (token: string, id: string, rangeData: Partial<IPRange>) => {
    const { data } = await api.patch(`/networks/ip-ranges/${id}/`, rangeData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  deleteIPRange: async (token: string, id: string) => {
    await api.delete(`/networks/ip-ranges/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Метод для получения оборудования (для привязки к интерфейсам и диапазонам IP)
  getEquipment: async (token: string): Promise<Equipment[]> => {
    const { data } = await api.get('/equipment/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data || [];
  },

  updateRoutingTable: async (token: string, id: string, routeData: Partial<RoutingTable>) => {
    const { data } = await api.patch(`/networks/routing-table/${id}/`, routeData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  updateACL: async (token: string, id: string, aclData: Partial<ACL>) => {
    const { data } = await api.patch(`/networks/acls/${id}/`, aclData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  // Метод для получения сетей по подразделению
  getNetworksByDivision: async (token: string, divisionId: string): Promise<Network[]> => {
    const { data } = await api.get(`/networks/?division=${divisionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : data || [];
  },

  // Метод для получения информации о подразделении
  getDivisionInfo: async (divisionId: string): Promise<{ id: string; name: string }> => {
    const { data } = await api.get(`/divisions/${divisionId}/`);
    return data;
  },
};

