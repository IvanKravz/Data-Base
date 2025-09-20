
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
  comments?: string; // Added comment field
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

export type EquipmentCategory = 'tko' | 'closed' | 'radio' | 'computer' | 'battery' | 'antenna' | 'power' | 'materials';

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
  open_category?: 'tko' | 'radio' | 'computer' | 'battery' | 'antenna' | 'power' | 'materials' | null;
  closed_category?: number | null;  // ID of ClosedEquipmentCategory
  status: 'in-operation' | 'in-storage' | 'defective' | 'for-disposal' | 'disposed';
  serial_number: string;
  inventory_number: string;
  manufacturing_date: string;  // ISO date string
  exploitation_date: string;       // ISO date string
  division: number;            // ID of Division
  subdivision?: number | null; // ID of Subdivision
  facility?: number | null;    // ID of Facility
  assigned_to?: number | null; // ID of Employee
  comments?: string | null;
  disposal_act_number?: string | null;
  disposal_act_date?: string | null;
  disposal_cert_number?: string | null;
  disposal_cert_date?: string | null;
  disposal_comments?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClosedEquipmentCategory {
  id: number;
  name: string;
}

export interface Division {
  id: string;
  name: string;
  employees_count: number;
  equipment_count: number;
  facilities_count: number;
  tasks_count: number;
  networks_count: number;
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
  comments?: string; // Added comment field
  acceptance_act_number?: string | null;
  rim_act_number?: string | null;;
  commissioning_act_number?: string | null;
  opening_permission_number?: string | null;
  communication_posts: Array<{
    name: string;
    division: number;
    subdivision: number;
  }>;
  communication_post_ids?: number;
  type_id?: number;

  kz_size?: string | null;;
  has_transformer_in_kz?: boolean;
  has_grounding_in_kz?: boolean;
  inn?:string;
  is_closed?: boolean;
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
  subdivisions: Subdivisions[];
  facilities: Facility[];
  equipment: Equipment[];
  created_at: string;
  updated_at: string;
  ip_range: string;
  bandwidth: string;
  throughput?: number;
  protocol: 'TCP/IP' | 'UDP' | 'MPLS' | 'Other';
};

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