import { api } from './client';
import { Employee } from '../types';

export const employeesApi = {
  // Get all personnel with optional filters
  getPersonnel: async (token: string, params?: {
    division?: string;
    isMaterialResponsible?: boolean;
    isShaWorker?: boolean;
    accessLevel?: string;
    search?: string;
  }) => {
    const { data } = await api.get('users/employees/', { params, 
      headers: {
        'Authorization': `Bearer ${token}`, // Передача токена в заголовке
      },
    });
    return data;
  },

  // Get person by ID
  getPersonById: async (token: string, id: string) => {
    const { data } = await api.get(`users/employees/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Передача токена в заголовке
      },
    });
    return data;
  },

  // Create new person
  createPerson: async (personData: Omit<Employee, 'id'>) => {
    const { data } = await api.post('users/employees/', personData);
    return data;
  },

  // Update existing person
  updatePerson: async (token: string, id: string, personData: Partial<Employee>) => {
    console.log('personData', personData)
    const { data } = await api.patch(`users/employees/${id}/`, personData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Передача токена в заголовке 
      },
    });;
    return data;
  },

  // Delete person
  deletePerson: async (token: string, id: string) => {
    await api.delete(`users/employees/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Передача токена в заголовке
      },
    });
  },

  // Update person's qualitative characteristics
  updateQualitativeCharacteristics: async (id: string, data: {
    personalNumber?: string;
    rank?: string;
    rankDate?: string;
    rankOrderNumber?: string;
    secretClearance?: {
      form?: string;
      number?: string;
      date?: string;
    };
    education?: {
      level?: string;
      institution?: string;
      graduationYear?: string;
      additionalInfo?: string;
    };
    workStartYear?: string;
  }) => {
    const response = await api.put(`users/employees/${id}/qualitative/`, data);
    return response.data;
  },

  // Toggle material responsible status
  toggleMaterialResponsible: async (id: string) => {
    const { data } = await api.post(`users/employees/${id}/toggle-material-responsible/`);
    return data;
  },

  // Toggle SHA worker status
  toggleShaWorker: async (id: string) => {
    const { data } = await api.post(`users/employees/${id}/toggle-sha-worker/`);
    return data;
  },

  // Update SHA worker details
  updateShaDetails: async (id: string, shaDetails: Employee['shaDetails']) => {
    const { data } = await api.put(`users/employees/${id}/sha-details/`, shaDetails);
    return data;
  },

  // Update person comments
  updateComments: async (personId: string, comments: string) => {
    const { data } = await api.patch(`users/employees/${personId}/comments/`, {
      comments
    });
    return data;
  }
};