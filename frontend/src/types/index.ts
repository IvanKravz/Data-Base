// types/index.ts
export interface User {
  id: string;
  username: string;
  roles: string[];
  permissions: {
    canEditEquipmentBasicInfo?: boolean;
    canEditEquipmentFullInfo?: boolean;
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
  division: {
    id: number;
    name: string;
    order?: number;
  } | null;
  subdivision: {
    id: number;
    name: string;
    order?: number;
  } | null;
  facility: {
    id: number;
    name: string;
  } | null;
  assigned_to: {
    id: number;
    full_name: string;
    position?: string;
  } | null;
  comments: string | null;
  disposal_act_number: string | null;
  disposal_act_date: string | null;
  disposal_cert_number: string | null;
  disposal_cert_date: string | null;
  disposal_comments: string | null;
  created_at: string;
  updated_at: string;
  service_life: string | null;
  interest_organ: {
    id: number;
    name: string;
    created_at: string;
  } | null;
  secret_level: 'OV' | 'SS' | 'SECRET' | 'DSP' | null;
  secret_level_display?: string;
  is_free_use: boolean;
  free_use_act_number: string | null;
  category: EquipmentCategory | null;
  category_display?: string;
  status_display?: string;
  product_structures: ProductStructure[];
  network_interfaces: NetworkInterface[];
  vlans: VLAN[];
  ip_addresses: IPAddress[];
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
}

export interface ClosedEquipmentCategory {
  id: number;
  name: string;
}

export interface Division {
  id: string;
  name: string;
  subdivisions: { id: string; name: string; order?: number }[];
  facilities: {
    id: string;
    name: string;
    type: {
      id: string;
      name: string;
      description?: string;
    };
    type_display: string;
    facility_class: string;
    class_display: string;
    employees_count: number;
    equipment_count: number;
    facilities_count: number;
    tasks_count: number;
    networks_count: number;
  }[];
  // дополнительные поля для Overview
  employees_count?: number;
  equipment_count?: number;
  facilities_count?: number;
  networks_count?: number;
  order?: number;
}

export interface Facility {
  id: string;
  name: string;
  type: {
    name: string;
    description: string;
  };
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
  communication_posts: Array<{
    name: string;
    division: number;
    subdivision: number;
  }>;
  communication_post_ids?: number;
  type_id?: number;
  kz_size?: string | null;
  has_transformer_in_kz?: boolean;
  has_grounding_in_kz?: boolean;
  inn?: string;
  is_closed?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CommunicationPost {
  id: string;
  name: string;
  division: string;
  division_name: string;
  subdivision?: string;
  subdivision_name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Network {
  id: number;
  name: string;
  description?: string;
  network_class: string;
  security_level: 'public' | 'confidential' | 'secret' | 'top_secret';
  divisions: Division[];
  subdivisions: Subdivision[];
  facilities: Facility[];
  equipment: Equipment[];
  created_at: string;
  updated_at: string;
  ip_range: string;
  bandwidth: string;
  throughput?: number;
  protocol: 'TCP/IP' | 'UDP' | 'MPLS' | 'Other';
}

// Импорт Subdivision из другого места – будем считать, что он определён
export interface Subdivision {
  id: string;
  name: string;
  order?: number;
}

export interface VLAN {
  id: string;
  vlan_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface NetworkInterface {
  id: string;
  equipment: Equipment;
  name: string;
  interface_type: string;
  physical_type: string | null;
  port_number: number | null;
  slot: number | null;
  module: number | null;
  enabled: boolean;
  mac_address: string;
  mtu: number;
  speed: string | null;
  vlan: VLAN | null;
  is_trunk: boolean;
  native_vlan: VLAN | null;
  connected_to: NetworkInterface | null;
}

export interface IPAddress {
  id: string;
  interface: NetworkInterface;
  address: string;
  netmask: string;
  version: string;
  is_primary: boolean;
  gateway: string | null;
  dns_servers: string | null;
  description: string | null;
}

export interface IPRange {
  id: string;
  network: string;
  description: string;
  vlan: VLAN | null;
  devices: Equipment[];
  created_at: string;
}

export interface NetworkDirection {
  from_membership: number;
  to_membership: number;
  bandwidth?: number;
  latency?: number;
  description?: string;
}

export interface ProductStructure {
  id: string;
  name: string;
  model?: string;
  serial_number?: string;
  note?: string;
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
}

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