// types/index.ts

// ============================================================
// Пользователи
// ============================================================
export interface User {
  id: string;
  username: string;
  roles: string[];
  division_info?: { id: string; name: string } | null;
  permissions: {
    canEditEquipmentBasicInfo?: boolean;
    canEditEquipmentFullInfo?: boolean;
    models?: Record<string, string[]>;
    filters?: Record<string, any>;
  };
}

export interface Employee {
  id: string;
  photo?: string;
  photo_url?: string;
  full_name: string;
  position: string;
  department: string;
  email: string;
  personal_phone: string;
  work_phone: string;
  birth_date: string;
  contract_date: string;
  division: string;
  personal_number: string;
  subdivision?: string;
  is_material_responsible: boolean;
  is_sha_worker: boolean;
  comments?: string;
  sha_details?: {
    conclusion_number: string;
    start_date: string;
    access_level: '1' | '2';
    equipment_conclusions: Array<{
      equipment_type: string;
      conclusion_number: string;
    }>;
  };
  personalNumber?: string;
  rank?: string;
  order_rank?: string;
  form_state_secrets?: string;
  number_state_secrets?: string;
  data_state_secrets?: string;
  institution?: string;
  year_graduation?: string;
  education?: string;
  date_start_work?: string;
  date_end_work?: string;
  description?: string;
}

// ============================================================
// Оборудование
// ============================================================
export interface EquipmentCategory {
  value: string;
  name: string;
  is_closed: boolean;
}

export interface DisposalInfo {
  actNumber: string;
  actDate: string;
  disposalCertNumber: string;
  disposalCertDate: string;
  comments: string;
}

export interface ProductStructure {
  id: string;
  name: string;
  model?: string;
  serial_number?: string;
  note?: string;
}

export interface Equipment {
  id: number;
  name: string;
  type: string;
  is_closed: boolean;
  is_network: boolean;
  status: 'in-operation' | 'in-storage' | 'defective' | 'for-disposal' | 'disposed';
  serial_number: string;
  inventory_number: string;
  manufacturing_date: string | null;
  exploitation_date: string | null;
  division: { id: number; name: string; order?: number } | null;
  subdivision: { id: number; name: string; order?: number } | null;
  facility: { id: number; name: string } | null;
  assigned_to: { id: number; full_name: string; position?: string } | null;
  comments: string | null;
  disposal_act_number: string | null;
  disposal_act_date: string | null;
  disposal_cert_number: string | null;
  disposal_cert_date: string | null;
  disposal_comments: string | null;
  created_at: string;
  updated_at: string;
  service_life: string | null;
  interest_organ: { id: number; name: string; created_at: string } | null;
  secret_level: 'OV' | 'SS' | 'SECRET' | 'DSP' | null;
  secret_level_display?: string;
  is_free_use: boolean;
  free_use_act_number: string | null;
  category: EquipmentCategory | null;
  category_display?: string;
  status_display?: string;
  product_structures: ProductStructure[];
  network_interfaces: any[];
  vlans: VLAN[];
  ip_addresses: any[];
  routing_table: any[];
  acls: any[];
  network_interfaces_count: number;
  ip_addresses_count: number;
  disposal_info?: DisposalInfo | null;
  division_id?: number;
  subdivision_id?: number;
  facility_id?: number;
  assigned_to_id?: number;
  interest_organ_id?: number;

  is_szi?: boolean;
  szi_certificate_number?: string | null;
  szi_certificate_date?: string | null;
}

export interface ClosedEquipmentCategory {
  id: number;
  name: string;
}

export interface EquipmentFieldPermissions {
  canEditName: boolean;
  canEditCategory: boolean;
  canEditModel: boolean;
  canEditStatus: boolean;
  canEditSoftwareVersion: boolean;
  canEditManufacturingDate: boolean;
  canEditExploitationDate: boolean;
  canEditServiceLife: boolean;
  canEditSecretLevel: boolean;
  canEditInterestOrgan: boolean;
  canEditFreeUse: boolean;
  canEditDivision: boolean;
  canEditSubdivision: boolean;
  canEditAssignedTo: boolean;
  canEditFacility: boolean;
  canEditComments: boolean;
  canEditProductStructure: boolean;
  canEditDocuments: boolean;
  canEditIdentification: boolean;
  canEditIsNetwork: boolean;
  canEditSzi: boolean;
}

// ============================================================
// Подразделения, объекты, посты связи
// ============================================================
export interface Division {
  id: string;
  name: string;
  subdivisions: Subdivision[];
  facilities: Facility[];
  employees_count?: number;
  equipment_count?: number;
  facilities_count?: number;
  networks_count?: number;
  order?: number;
}

export interface Subdivision {
  id: string;
  name: string;
  order?: number;
}

export type CommunicationPostKind = 'P' | 'KP' | 'PS' | 'NDR';

export interface CommunicationPostRef {
  id: string;
  name: string;
  kind: CommunicationPostKind;
  kind_display?: string;
}

export interface CommunicationPost {
  id: string;
  name: string;
  kind: CommunicationPostKind;
  kind_display?: string;

  division: string;
  division_name?: string;
  subdivision?: string | null;
  subdivision_name?: string | null;

  parent?: CommunicationPostRef | null;
  parent_name?: string | null;
  parent_id?: string | number | null;

  children?: CommunicationPostRef[];
  children_count?: number;
  full_path?: string;

  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: { name: string; description: string };
  class: '1' | '2';
  address: string;
  division: string;
  division_name: string;
  subdivision_name: string;
  subdivision?: string;
  facility_class?: string | null;
  comments?: string;
  acceptance_act_number?: string | null;
  rim_act_number?: string | null;
  commissioning_act_number?: string | null;
  opening_permission_number?: string | null;

  communication_posts: CommunicationPost[];
  communication_post_ids?: number[];

  type_id?: number;
  kz_size?: string | null;
  has_transformer_in_kz?: boolean;
  has_grounding_in_kz?: boolean;
  inn?: string;
  is_closed?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

// ============================================================
// Сети связи
// ============================================================
export type SecurityLevel = 'public' | 'confidential' | 'secret' | 'top_secret';
export type NetworkClass = '1' | '2';
export type Protocol = 'TCP/IP' | 'UDP' | 'MPLS' | 'Other';

export interface NetworkMembership {
  id: string;
  network: string;
  division: { id: string; name: string };
  facility: { id: string; name: string };
  equipment: { id: string; name: string; serial_number?: string };
}

export interface CommunicationNetwork {
  id: string;
  name: string;
  description: string;
  network_class: NetworkClass | null;
  security_level: SecurityLevel;
  ip_range: string;
  throughput: number | null;
  protocol: Protocol;
  created_at: string;
  updated_at: string;
  memberships?: NetworkMembership[];
}

/** Алиас для обратной совместимости — старый код импортирует `Network` */
export type Network = CommunicationNetwork;

// ============================================================
// VLAN
// ============================================================
export interface VLAN {
  id: string;
  vlan_id: number;
  name: string;
  description: string;
  created_at: string;
}

// ============================================================
// Сетевой интерфейс (единственное объявление!)
// ============================================================
export type InterfaceType =
  | 'physical' | 'bond' | 'bridge' | 'vlan' | 'loopback'
  | 'port-channel' | 'tunnel' | 'virtual' | 'other';

export type PhysicalPortType =
  | 'rj45' | 'sfp' | 'sfp+' | 'qsfp' | 'console' | 'usb';

export type PortMode = 'access' | 'trunk' | 'general' | 'hybrid';

export interface NetworkInterface {
  id: string;
  equipment: string;
  equipment_name: string;
  name: string;
  interface_type: InterfaceType;
  physical_type: PhysicalPortType | null;
  port_number: number | null;
  slot: number | null;
  module: number | null;
  enabled: boolean;
  mode: PortMode;
  mac_address: string;
  mtu: number;
  speed: string;
  access_vlan: string | null;
  access_vlan_name?: string | null;
  is_trunk: boolean;
  native_vlan: string | null;
  native_vlan_name?: string | null;
  connected_to: string | null;
  connected_to_name?: string | null;
  connected_to_equipment_name?: string | null;
  vlan_configurations?: any[];
  ip_addresses?: IPAddress[];
}

export type NetworkInterfaceInput = Omit<
  NetworkInterface,
  | 'id'
  | 'equipment_name'
  | 'access_vlan_name'
  | 'native_vlan_name'
  | 'connected_to_name'
  | 'connected_to_equipment_name'
  | 'vlan_configurations'
  | 'ip_addresses'
>;

// ============================================================
// Подсети
// ============================================================
export interface Subnet {
  id: string;
  network: string;
  network_name?: string;
  vlan: string | null;
  vlan_name?: string | null;
  vlan_id_num?: number | null;
  parent: string | null;

  network_address: string;
  prefix_length: number;

  cidr: string;
  netmask: string;
  broadcast: string;
  first_host: string;
  last_host: string;
  host_count: number;

  used_count: number;
  reserved_count: number;
  free_count: number;
  children_count: number;

  purpose: string;
  gateway: string | null;
  description: string;
  dhcp_enabled: boolean;
  dhcp_pool_start: string | null;
  dhcp_pool_end: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// IP-адреса (единственное объявление!)
// ============================================================
export type IPStatus = 'free' | 'reserved' | 'in_use' | 'deprecated';

export interface IPAddress {
  id: string;
  subnet: string;
  subnet_cidr?: string;
  network_id?: number | null;
  address: string;
  status: IPStatus;
  is_primary: boolean;
  hostname: string;
  purpose: string;
  assigned_to: string;
  description: string;
  interface: string | null;
  interface_name?: string | null;
  equipment_id?: string | null;
  equipment_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubnetHost {
  address: string;
  ip_id: string | null;
  status: IPStatus;
  hostname: string;
  purpose: string;
  assigned_to: string;
  description: string;
  is_primary: boolean;
  interface_id: string | null;
  interface_name: string | null;
  equipment_name: string | null;
}

// ============================================================
// Направления
// ============================================================
export interface NetworkDirection {
  id?: string;
  network?: string;
  from_membership: number;
  to_membership: number;
  bandwidth?: number;
  latency?: number;
  description?: string;
}

// ============================================================
// Auth / прочее (как у вас было)
// ============================================================
export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    name: string;
    position: string;
    department: string;
    division: string;
    subdivision?: string;
    is_global_view: boolean;
    module_permissions: {
      employees: { can_view: boolean; can_edit: boolean };
      equipment: { can_view: boolean; can_edit: boolean };
      facilities: { can_view: boolean; can_edit: boolean };
      tasks: { can_view: boolean; can_edit: boolean };
      networks: { can_view: boolean; can_edit: boolean };
    };
  };
}

export interface RegisterData {
  username: string;
  password: string;
  name: string;
  position: string;
  department: string;
  division: string;
}

export interface ModulePermissions {
  employees: { can_view: boolean; can_edit: boolean };
  equipment: { can_view: boolean; can_edit: boolean };
  facilities: { can_view: boolean; can_edit: boolean };
  tasks: { can_view: boolean; can_edit: boolean };
  networks: { can_view: boolean; can_edit: boolean };
}

export interface EmployeeDictionaries {
  categories: { value: string; label: string }[];
  subcategories?: { value: string; label: string }[];
  management_positions: { value: string; label: string }[];
  officer_positions: { value: string; label: string }[];
  warrant_officer_positions: { value: string; label: string }[];
  civilian_positions: { value: string; label: string }[];
  management_officer_ranks: { value: string; label: string }[];
  officer_ranks: { value: string; label: string }[];
  warrant_officer_ranks: { value: string; label: string }[];
}

export interface ScheduleEvent {
  id?: number;
  employee: number;
  employee_id: number;
  employee_name: string;
  date: string;
  event_type: string;
  comment?: string;
}

// ============================================================
// Wizard: свободные подсети
// ============================================================

export interface AvailableSlot {
  network_address: string;
  prefix_length: number;
  cidr: string;
  parent_cidr: string;
}

export type AvailableSlotsHint =
  | 'no_ip_range'
  | 'invalid_ip_range'
  | 'parent_too_small';

export interface AvailableSlotsResponse {
  results: AvailableSlot[];
  parent_cidr?: string;
  requested_prefix?: number;
  hint?: AvailableSlotsHint;
  detail?: string;
}