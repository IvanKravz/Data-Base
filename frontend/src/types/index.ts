
export interface Employee {
  id: string;
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
  id: string;
  name: string;
  type: string;
  category: EquipmentCategory;
  status: 'in-operation' | 'in-storage' | 'defective' | 'for-disposal' | 'disposed';
  assigned_to?: string;
  serial_number: string;
  purchase_date: string;
  inventory_number: string;
  manufacturing_date: string;
  division: string;
  subdivision?: string;
  facilityId?: string;
  comments?: string;
  disposalInfo?: DisposalInfo;
}

export interface Division {
  id: string;
  name: string;
  employees_count: number;
  equipment_count: number;
  facilities_count: number;
  tasks_count: number;
}

export interface Facility {
  id: string;
  name: string;
  type: 'station' | 'shd';
  class: '1' | '2';
  address: string;
  division: string;
  subdivision?: string;
  comments?: string; // Added comment field
  acceptanceActNumber?: string;
  rimActNumber?: string;
  commissioningActNumber?: string;
  openingPermissionNumber?: string;
  kzSize?: string;
  hasTransformerInKz?: boolean;
  hasGroundingInKz?: boolean;
}