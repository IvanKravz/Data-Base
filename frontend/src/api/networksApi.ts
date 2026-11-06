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
  NetworkSchemaPayload,
  NetworkNodePosition,
} from '../types';

// ================================================================
// Фильтры
// ================================================================

export interface InterfaceFilters {
  equipment?: number | string;
  interface_type?: string;
  mode?: string;
  enabled?: boolean;
  access_vlan?: number | string;
  native_vlan?: number | string;
  search?: string;
}

export interface IPAddressFilters {
  subnet?: number | string;
  interface?: number | string;
  interface__equipment?: number | string;
  subnet__network?: number | string;
  status?: 'free' | 'reserved' | 'in_use' | 'deprecated';
  is_primary?: boolean;
  search?: string;
}

export interface SubnetHostFilters {
  search?: string;
  status?: 'free' | 'reserved' | 'in_use' | 'deprecated';
  limit?: number;
  offset?: number;
}

export interface VLANFilters {
  search?: string;
  vlan_id?: number;
}

export interface DirectionFilters {
  network?: number | string;
}

export interface CreateIPAddressPayload {
  subnet: number;
  address: string;
  status?: 'free' | 'reserved' | 'in_use' | 'deprecated';
  interface?: number | null;
  hostname?: string;
  purpose?: string;
  assigned_to?: string;
  is_primary?: boolean;
  description?: string;
}

export interface CreateDirectionPayload {
  network: number;
  from_membership: number;
  to_membership: number;
  from_interface?: number | null;
  to_interface?: number | null;
  label?: string;
  cable_type?: string;
  bandwidth?: number | null;
  latency?: number | null;
  description?: string;
  from_handle?: string;
  to_handle?: string;
}

export interface ACLPayload {
  equipment: number | string;
  name: string;
  sequence: number;
  action: 'permit' | 'deny';
  protocol?: 'ip' | 'tcp' | 'udp' | 'icmp';
  source_network?: string;
  destination_network?: string;
  source_port?: number | null;
  destination_port?: number | null;
  description?: string;
}

export interface RoutingTablePayload {
  equipment: number | string;
  network: string;
  netmask: string;
  gateway: string;
  interface?: number | null;
  metric?: number;
  description?: string;
}

// ================================================================
// Хелпер «массив или пагинатор»
// ================================================================
const unwrapArray = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
};

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
    return unwrapArray<CommunicationNetwork>(data);
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
  // Схема сети
  // ================================================================
  getNetworkSchema: async (
    token: string,
    networkId: string | number,
  ): Promise<NetworkSchemaPayload> => {
    const { data } = await api.get(`/networks/${networkId}/schema/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // ================================================================
  // Позиции узлов
  // ================================================================
  getNodePositions: async (
    token: string,
    networkId: string | number,
  ): Promise<NetworkNodePosition[]> => {
    const { data } = await api.get(`/networks/${networkId}/node-positions/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return unwrapArray<NetworkNodePosition>(data);
  },

  saveNodePositions: async (
    token: string,
    networkId: string | number,
    positions: NetworkNodePosition[],
  ): Promise<NetworkNodePosition[]> => {
    const { data } = await api.post(
      `/networks/${networkId}/node-positions/bulk/`,
      { positions },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return unwrapArray<NetworkNodePosition>(data);
  },

  resetNodePositions: async (
    token: string,
    networkId: string | number,
  ): Promise<void> => {
    await api.post(
      `/networks/${networkId}/node-positions/reset/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },

  /**
   * «Удаление» узла со схемы.
   *
   * Реализовано через `/bulk/` (единственный роут, реально зарегистрированный
   * в `networks/urls.py`). Снимаем флаг `is_explicit` и ставим sentinel-координаты.
   * Узел пропадает из ответа `schema`, если у него больше нет членств —
   * см. `CommunicationNetworkViewSet.schema`.
   *
   * Имя метода сохранено (`deleteNodePosition`), чтобы не менять вызовы.
   */
  deleteNodePosition: async (
    token: string,
    networkId: string | number,
    nodeType: 'division' | 'facility' | 'equipment',
    nodeId: number,
  ): Promise<void> => {
    await api.post(
      `/networks/${networkId}/node-positions/bulk/`,
      {
        positions: [{
          node_type: nodeType,
          node_id: nodeId,
          x: -99999,
          y: -99999,
          is_explicit: false,
        }],
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },

  // ================================================================
  // Принадлежности
  // ================================================================
  getNetworkMemberships: async (token: string, networkId: string) => {
    const { data } = await api.get(
      `/networks/network-memberships/?network=${networkId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return unwrapArray<any>(data);
  },

  bulkUpdateNetworkMemberships: async (token: string, networkId: string, memberships: any[]) => {
    const { data } = await api.post(
      '/networks/network-memberships/bulk_create/',
      { network: networkId, memberships },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return unwrapArray<any>(data);
  },

  createNetworkMembership: async (
    token: string,
    payload: {
      network: number;
      division_id: number;
      facility_id: number;
      equipment_id: number;
    },
  ): Promise<any> => {
    const { data } = await api.post('/networks/network-memberships/', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteNetworkMembership: async (token: string, membershipId: number): Promise<void> => {
    await api.delete(`/networks/network-memberships/${membershipId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ================================================================
  // Направления
  // ================================================================
  getNetworkDirections: async (
    token: string,
    networkId: string | number,
    filters: Omit<DirectionFilters, 'network'> = {},
  ): Promise<NetworkDirection[]> => {
    const { data } = await api.get('/networks/network-directions/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { network: networkId, ...filters },
    });
    return unwrapArray<NetworkDirection>(data);
  },

  createNetworkDirection: async (
    token: string,
    payload: CreateDirectionPayload,
  ): Promise<NetworkDirection> => {
    const { data } = await api.post('/networks/network-directions/', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateNetworkDirection: async (
    token: string,
    id: string | number,
    payload: Partial<CreateDirectionPayload>,
  ): Promise<NetworkDirection> => {
    const { data } = await api.patch(`/networks/network-directions/${id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteNetworkDirection: async (token: string, id: string | number): Promise<void> => {
    await api.delete(`/networks/network-directions/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  bulkUpdateNetworkDirections: async (
    token: string,
    networkId: string,
    directions: Array<Partial<CreateDirectionPayload>>,
  ) => {
    const { data } = await api.post(
      '/networks/network-directions/bulk_create/',
      { network: parseInt(networkId, 10), directions },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return unwrapArray<NetworkDirection>(data);
  },

  // ================================================================
  // VLAN
  // ================================================================
  getVlans: async (token: string, filters: VLANFilters = {}): Promise<VLAN[]> => {
    const { data } = await api.get('/networks/vlans/', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
    });
    return unwrapArray<VLAN>(data);
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
  getNetworkInterfaces: async (
    token: string,
    filters: InterfaceFilters = {},
  ): Promise<NetworkInterface[]> => {
    const { data } = await api.get('/networks/network-interfaces/', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
    });
    return unwrapArray<NetworkInterface>(data);
  },

  createNetworkInterface: async (token: string, interfaceData: any) => {
    const { data } = await api.post('/networks/network-interfaces/', interfaceData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateNetworkInterface: async (token: string, id: string | number, interfaceData: any) => {
    const { data } = await api.patch(`/networks/network-interfaces/${id}/`, interfaceData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteNetworkInterface: async (token: string, id: string | number) => {
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
    return unwrapArray<Subnet>(data);
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
    return unwrapArray<Subnet>(data);
  },

  getSubnetHosts: async (
    token: string,
    id: string | number,
    filters: SubnetHostFilters = {},
  ): Promise<SubnetHost[]> => {
    const { data } = await api.get(`/networks/subnets/${id}/hosts/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
    });
    return unwrapArray<SubnetHost>(data);
  },

  saveSubnetHosts: async (token: string, id: string, hosts: Partial<SubnetHost>[]) => {
    const { data } = await api.post(
      `/networks/subnets/${id}/hosts/bulk/`,
      { hosts },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },

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
  // IP-адреса
  // ================================================================
  getIPAddresses: async (
    token: string,
    filters: IPAddressFilters = {},
  ): Promise<IPAddress[]> => {
    const { data } = await api.get('/networks/ip-addresses/', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
    });
    return unwrapArray<IPAddress>(data);
  },

  createIPAddress: async (
    token: string,
    payload: CreateIPAddressPayload,
  ): Promise<IPAddress> => {
    const { data } = await api.post('/networks/ip-addresses/', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateIPAddress: async (
    token: string,
    id: string | number,
    payload: Partial<CreateIPAddressPayload>,
  ): Promise<IPAddress> => {
    const { data } = await api.patch(`/networks/ip-addresses/${id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteIPAddress: async (token: string, id: string | number) => {
    await api.delete(`/networks/ip-addresses/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  assignIpToInterface: async (
    token: string,
    interfaceId: number,
    payload: CreateIPAddressPayload,
  ): Promise<IPAddress> => {
    const existing = await networksApi.getIPAddresses(token, {
      subnet: payload.subnet,
      search: payload.address,
    });
    const match = existing.find(
      (ip) => ip.address === payload.address,
    );
    if (match) {
      return networksApi.updateIPAddress(token, match.id, {
        ...payload,
        interface: interfaceId,
        status: payload.status ?? 'in_use',
      });
    }
    return networksApi.createIPAddress(token, {
      ...payload,
      interface: interfaceId,
      status: payload.status ?? 'in_use',
    });
  },

  releaseIpFromInterface: async (
    token: string,
    ipId: number,
  ): Promise<IPAddress> => {
    return networksApi.updateIPAddress(token, ipId, {
      interface: null,
      status: 'free',
    });
  },

  // ================================================================
  // Оборудование
  // ================================================================
  getEquipment: async (token: string): Promise<Equipment[]> => {
    const { data } = await api.get('/equipment/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return unwrapArray<Equipment>(data);
  },

  getNetworksByDivision: async (token: string, divisionId: string): Promise<CommunicationNetwork[]> => {
    const { data } = await api.get(`/networks/?division=${divisionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return unwrapArray<CommunicationNetwork>(data);
  },

  // ================================================================
  // Справочники для модалок добавления на схему
  // ================================================================

  /** Список подразделений (для модалки «+ Подразделение»). */
  getDivisions: async (token: string): Promise<any[]> => {
    const { data } = await api.get('/facilities/divisions/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return unwrapArray<any>(data);
  },

  /** Список объектов подразделения (для модалки «+ Объект»). */
  getFacilities: async (token: string, divisionId?: number): Promise<any[]> => {
    const params = divisionId ? { division: divisionId } : {};
    const { data } = await api.get('/facilities/', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return unwrapArray<any>(data);
  },

  // ================================================================
  // Метаданные
  // ================================================================
  getEquipmentCategories: async (token: string) => {
    const { data } = await api.get('/equipment/equipment_categories/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return unwrapArray<{ value: string; name: string; is_closed: boolean }>(data);
  },

  // ================================================================
  // Маршрутизация
  // ================================================================
  getRoutingTable: async (token: string, equipmentId: number | string) => {
    const { data } = await api.get('/networks/routing-table/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { equipment: equipmentId },
    });
    return unwrapArray<any>(data);
  },

  // ================================================================
  // ACL
  // ================================================================
  getAcls: async (token: string, equipmentId: number | string) => {
    const { data } = await api.get('/networks/acls/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { equipment: equipmentId },
    });
    return unwrapArray<any>(data);
  },

  // ================================================================
  // ACL — CRUD
  // ================================================================
  createACL: async (token: string, payload: ACLPayload): Promise<any> => {
    const { data } = await api.post('/networks/acls/', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateACL: async (
    token: string,
    id: string | number,
    payload: Partial<ACLPayload>,
  ): Promise<any> => {
    const { data } = await api.patch(`/networks/acls/${id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteACL: async (token: string, id: string | number): Promise<void> => {
    await api.delete(`/networks/acls/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ================================================================
  // Маршрутизация — CRUD
  // ================================================================
  createRoutingTable: async (token: string, payload: RoutingTablePayload): Promise<any> => {
    const { data } = await api.post('/networks/routing-table/', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateRoutingTable: async (
    token: string,
    id: string | number,
    payload: Partial<RoutingTablePayload>,
  ): Promise<any> => {
    const { data } = await api.patch(`/networks/routing-table/${id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteRoutingTable: async (token: string, id: string | number): Promise<void> => {
    await api.delete(`/networks/routing-table/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ================================================================
  // VLAN Configuration (tagged VLANs на trunk-порту)
  // ================================================================
  createVlanConfiguration: async (
    token: string,
    payload: { interface: string | number; vlan: string | number; is_tagged?: boolean; priority?: number },
  ): Promise<any> => {
    const { data } = await api.post('/networks/vlan-configurations/', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateVlanConfiguration: async (
    token: string,
    id: string | number,
    payload: { vlan?: string | number; is_tagged?: boolean; priority?: number },
  ): Promise<any> => {
    const { data } = await api.patch(`/networks/vlan-configurations/${id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteVlanConfiguration: async (token: string, id: string | number): Promise<void> => {
    await api.delete(`/networks/vlan-configurations/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ================================================================
  // Все интерфейсы (для выбора connected_to в модалке)
  // ================================================================
  getAllInterfaces: async (
    token: string,
    search?: string,
  ): Promise<NetworkInterface[]> => {
    const { data } = await api.get('/networks/network-interfaces/', {
      headers: { Authorization: `Bearer ${token}` },
      params: search ? { search } : {},
    });
    return unwrapArray<NetworkInterface>(data);
  },
};