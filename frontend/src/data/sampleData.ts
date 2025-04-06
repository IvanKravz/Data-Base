import { Equipment, Person, Facility } from '../types';

export const sampleEquipment: Equipment[] = [
  {
    id: '1',
    name: 'MacBook Pro',
    type: 'Laptop',
    category: 'closed',
    status: 'in-operation',
    assignedTo: 'John Doe',
    serialNumber: 'MBP2023001',
    purchaseDate: '2023-01-15',
    inventoryNumber: 'INV-2023-001',
    manufacturingDate: '2022-12-01',
    division: '1 отдел'
  },
  {
    id: '2',
    name: 'Dell Monitor',
    type: 'Display',
    category: 'ТКО',
    status: 'in-storage',
    serialNumber: 'DM2023002',
    purchaseDate: '2023-02-20',
    inventoryNumber: 'INV-2023-002',
    manufacturingDate: '2022-11-15',
    division: '1 отдел'
  },
  {
    id: '3',
    name: 'HP Printer',
    type: 'Printer',
    category: 'Радио',
    status: 'defective',
    serialNumber: 'HP2023003',
    purchaseDate: '2023-03-10',
    inventoryNumber: 'INV-2023-003',
    manufacturingDate: '2022-10-20',
    division: '1 отдел'
  }
];

export const samplePersonnel: Person[] = [
  {
    id: '1',
    name: 'John Doe',
    position: 'Software Engineer',
    department: 'Engineering',
    email: 'john.doe@company.com',
    phone: '+1 234-567-8901',
    birthDate: '1990-05-15',
    contractDate: '2022-01-10',
    division: '1 отдел',
    subdivision: 'Отделение A',
    isMaterialResponsible: true
  },
  {
    id: '2',
    name: 'Jane Smith',
    position: 'Project Manager',
    department: 'Management',
    email: 'jane.smith@company.com',
    phone: '+1 234-567-8902',
    birthDate: '1985-08-22',
    contractDate: '2021-03-15',
    division: '2 отдел',
    isMaterialResponsible: false
  },
  {
    id: '3',
    name: 'Bob Johnson',
    position: 'IT Specialist',
    department: 'IT',
    email: 'bob.johnson@company.com',
    phone: '+1 234-567-8903',
    birthDate: '1988-11-30',
    contractDate: '2022-06-01',
    division: '3 отдел',
    isMaterialResponsible: true
  }
];

export const sampleFacilities: Facility[] = [
  {
    id: '1',
    name: 'Главный офис',
    type: 'station',
    class: '1',
    address: 'ул. Ленина, 1',
    division: '1 отдел',
    subdivision: 'Отделение A'
  },
  {
    id: '2',
    name: 'Склад №1',
    type: 'shd',
    class: '2',
    address: 'ул. Складская, 15',
    division: '2 отдел'
  },
  {
    id: '3',
    name: 'Производственный цех',
    type: 'station',
    class: '1',
    address: 'ул. Заводская, 7',
    division: '3 отдел'
  }
];