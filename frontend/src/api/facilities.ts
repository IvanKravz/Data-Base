import { api } from './client';
import { Facility } from '../types';

export const facilitiesApi = {
  // Get all facilities with optional filters
  getFacilities: async (params?: {
    token?: string;
    division?: string | string[];
    subdivision?: string;
    type?: 'station' | 'shd';
    class?: '1' | '2';
    search?: string;
    is_closed?: boolean;
  }): Promise<Facility[]> => {
    // Обрабатываем случай, когда division - массив
    let divisionParam = params?.division;
    if (Array.isArray(divisionParam) && divisionParam.length === 0) {
      divisionParam = undefined;
    }
    
    // Формируем параметры запроса
    const queryParams = {
      ...(divisionParam && { division: Array.isArray(divisionParam) ? divisionParam.join(',') : divisionParam }),
      ...(params?.subdivision && { subdivision: params.subdivision }),
      ...(params?.type && { type: params.type }),
      ...(params?.class && { class: params.class }),
      ...(params?.search && { search: params.search }),
      ...(typeof params?.is_closed !== 'undefined' && { is_closed: params.is_closed }),
    };
  
    const { data } = await api.get<{ results: Facility[] }>('/facilities/', {
      params: queryParams,
      headers: params?.token ? {
        Authorization: `Bearer ${params.token}`,
      } : undefined
    });
  
    return data.results;
  },

  // Get facility by ID
  getFacilityById: async (id: string, token: string) => {
    const { data } = await api.get(`/facilities/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    return data;
  },

  // Create new facility
  createFacility: async (facilityData: Omit<Facility, 'id'>) => {
    const { data } = await api.post('/facilities/', facilityData);
    return data;
  },

  // Update existing facility
  updateFacility: async (id: string, facilityData: Partial<Facility>, token: string) => {
    try {
      // Формируем правильный запрос
      const { data } = await api.patch(`/facilities/${id}/`, {
        ...facilityData,
        type: facilityData.type_id, // Используем type_id
        communication_posts: facilityData.communication_post_ids, // Используем массив ID
        facility_class: facilityData.facility_class
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return data;
    } catch (error) {
      console.error('Ошибка при обновлении объекта:', error);
      throw error;
    }
  },

  // Delete facility
  deleteFacility: async (id: string) => {
    await api.delete(`/facilities/${id}/`);
  },

  // Get facility equipment
  getFacilityEquipment: async (id: string, params?: {
    type?: 'open' | 'closed';
    status?: string;
  }) => {
    const { data } = await api.get(`/facilities/${id}/equipment/`, { params });
    return data;
  },

  // Get facility personnel
  getFacilityPersonnel: async (id: string) => {
    const { data } = await api.get(`/facilities/${id}/personnel/`);
    return data;
  },

  // Get facility statistics
  getFacilityStats: async (id: string) => {
    const { data } = await api.get(`/facilities/${id}/stats/`);
    return data;
  },

  // Update facility comments
  updateComments: async (facilityId: string, comments: string) => {
    const { data } = await api.patch(`/facilities/${facilityId}/comments/`, {
      comments
    });
    return data;
  }
};

export const communicationPostsApi = {
  getCommunicationPosts: async (params?: {
    token?: string;
    division?: string;
    subdivision?: string;
  }) => {
    const { data } = await api.get('facilities/communication-posts/', {
      params: {
        division: params?.division,
        subdivision: params?.subdivision
      },
      headers: params?.token ? {
        Authorization: `Bearer ${params.token}`,
      } : undefined
    });
    return data.results;
  },

  createCommunicationPost: async (postData: {
    name: string;
    division: string;
    subdivision?: string;
    description?: string;
  }, token: string) => {
    const { data } = await api.post('facilities/communication-posts/', postData, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    return data;
  },

  deleteCommunicationPost: async (id: string, token: string) => {
    await api.delete(`facilities/communication-posts/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
  }
};