// src/api/networksApi.ts
import { api } from './client';
import {
  CommunicationNetwork,
  VLAN,
  NetworkInterface,
  IPAddress,
  Subnet,
  SubnetHost,
  AvailableSlotsResponse,
  Equipment,
  NetworkDirection,
} from '../types';

export const networksApi = {
  // ================================================================
  // Сети связи
  // ================================================================
  getNetworks: async (token: string, divisionId?: string): Promise<CommunicationNetwork[]> => {
    const params = divisionId ? { division: divisionId } : {};
    const { data } = await api.get('/networks/', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return Array.isArray(data) ? data : data || [];
  },

  getNetwork: async (token: string, id: string): Promise<CommunicationNetwork> => {
    const { data } = await api.get(`/networks/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  createNetwork: async (token: string, networkData: Omit<CommunicationNetwork, 'id'>) => {
    const { data } = await api.post('/networks/', networkData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateNetwork: async (token: string, id: string, networkData: Partial<CommunicationNetwork>) => {
    const { data } = await api.put(`/networks/${id}/`, networkData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteNetwork: async (token: string, id: string) => {
    await api.delete(`/networks/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ================================================================
  // Принадлежности
  // ================================================================
  getNetworkMemberships: async (token: string, networkId: string) => {
    const { data } = await api.get(`/networks/network-memberships/?network=${networkId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : data || [];
  },

  bulkUpdateNetworkMemberships: async (token: string, networkId: string, memberships: any[]) => {
    const { data } = await api.post(
      '/networks/network-memberships/bulk_create/',
      { network: networkId, memberships },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },

  // ================================================================
  // Направления
  // ================================================================
  getNetworkDirections: async (token: string, networkId: string) => {
    const { data } = await api.get(`/networks/network-directions/?network=${networkId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : data || [];
  },

  bulkUpdateNetworkDirections: async (token: string, networkId: string, directions: NetworkDirection[]) => {
    const { data } = await api.post(
      '/networks/network-directions/bulk_create/',
      { network: parseInt(networkId), directions },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },

  // ================================================================
  // VLAN
  // ================================================================
  getVlans: async (token: string): Promise<VLAN[]> => {
    const { data } = await api.get('/networks/vlans/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : data || [];
  },

  createVlan: async (token: string, vlanData: Omit<VLAN, 'id'>) => {
    const { data } = await api.post('/networks/vlans/', vlanData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateVlan: async (token: string, id: string, vlanData: Partial<VLAN>) => {
    const { data } = await api.patch(`/networks/vlans/${id}/`, vlanData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteVlan: async (token: string, id: string) => {
    await api.delete(`/networks/vlans/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ================================================================
  // Сетевые интерфейсы
  // ================================================================
  getNetworkInterfaces: async (token: string): Promise<NetworkInterface[]> => {
    const { data } = await api.get('/networks/network-interfaces/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : data || [];
  },

  createNetworkInterface: async (token: string, interfaceData: any) => {
    const { data } = await api.post('/networks/network-interfaces/', interfaceData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateNetworkInterface: async (token: string, id: string, interfaceData: any) => {
    const { data } = await api.patch(`/networks/network-interfaces/${id}/`, interfaceData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteNetworkInterface: async (token: string, id: string) => {
    await api.delete(`/networks/network-interfaces/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ================================================================
  // Подсети (IPAM)
  // ================================================================
  getSubnets: async (token: string, networkId?: string): Promise<Subnet[]> => {
    const params = networkId ? { network: networkId } : {};
    const { data } = await api.get('/networks/subnets/', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return Array.isArray(data) ? data : data?.results ?? [];
  },

  getSubnet: async (token: string, id: string): Promise<Subnet> => {
    const { data } = await api.get(`/networks/subnets/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  createSubnet: async (token: string, payload: Partial<Subnet>): Promise<Subnet> => {
    const { data } = await api.post('/networks/subnets/', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateSubnet: async (token: string, id: string, payload: Partial<Subnet>): Promise<Subnet> => {
    const { data } = await api.patch(`/networks/subnets/${id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteSubnet: async (token: string, id: string) => {
    await api.delete(`/networks/subnets/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  splitSubnet: async (token: string, id: string, childPrefix: number): Promise<Subnet[]> => {
    const { data } = await api.post(
      `/networks/subnets/${id}/split/`,
      { child_prefix: childPrefix },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },

  getSubnetHosts: async (token: string, id: string): Promise<SubnetHost[]> => {
    const { data } = await api.get(`/networks/subnets/${id}/hosts/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  saveSubnetHosts: async (token: string, id: string, hosts: Partial<SubnetHost>[]) => {
    const { data } = await api.post(
      `/networks/subnets/${id}/hosts/bulk/`,
      { hosts },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },

  /** Найти свободные подсети заданного префикса (для Wizard) */
  getAvailableSlots: async (
    token: string,
    networkId: string,
    prefix: number,
    limit = 10,
  ): Promise<AvailableSlotsResponse> => {
    const { data } = await api.get('/networks/subnets/available/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { network: networkId, prefix, limit },
    });
    return data;
  },

  // ================================================================
  // IP-адреса (глобальный CRUD)
  // ================================================================
  getIPAddresses: async (token: string): Promise<IPAddress[]> => {
    const { data } = await api.get('/networks/ip-addresses/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : data || [];
  },

  deleteIPAddress: async (token: string, id: string) => {
    await api.delete(`/networks/ip-addresses/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ================================================================
  // Оборудование
  // ================================================================
  getEquipment: async (token: string): Promise<Equipment[]> => {
    const { data } = await api.get('/equipment/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : data || [];
  },

  getNetworksByDivision: async (token: string, divisionId: string): Promise<CommunicationNetwork[]> => {
    const { data } = await api.get(`/networks/?division=${divisionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : data || [];
  },

  getDivisionInfo: async (divisionId: string): Promise<{ id: string; name: string }> => {
    const { data } = await api.get(`/divisions/${divisionId}/`);
    return data;
  },


};