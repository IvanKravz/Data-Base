// facilities.ts
import { api } from './client';
import { Facility } from '../types';

// Простой кэш для избежания повторных запросов
const facilityCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

/**
 * Приводит ответ DRF к массиву.
 * DRF может вернуть как чистый массив, так и страницу {count, next, previous, results}.
 */
const toArray = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
};

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
    const cacheKey = JSON.stringify(params);

    if (facilityCache.has(cacheKey)) {
      const cached = facilityCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      } else {
        facilityCache.delete(cacheKey);
      }
    }

    let divisionParam = params?.division;
    if (Array.isArray(divisionParam) && divisionParam.length === 0) {
      divisionParam = undefined;
    }

    const queryParams = {
      ...(divisionParam && { division: Array.isArray(divisionParam) ? divisionParam.join(',') : divisionParam }),
      ...(params?.type && { type: params.type }),
      ...(params?.class && { class: params.class }),
      ...(params?.search && { search: params.search }),
      ...(typeof params?.is_closed !== 'undefined' && { is_closed: params.is_closed }),
    };

    const { data } = await api.get('/facilities/', {
      params: queryParams,
      headers: params?.token ? {
        Authorization: `Bearer ${params.token}`,
      } : undefined
    });

    const list = toArray<Facility>(data);

    facilityCache.set(cacheKey, {
      data: list,
      timestamp: Date.now()
    });

    return list;
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
    facilityCache.clear();
    return data;
  },

  // Update existing facility
  updateFacility: async (id: string, facilityData: Partial<Facility>, token: string) => {
    try {
      const { data } = await api.patch(`/facilities/${id}/`, {
        ...facilityData,
        type: facilityData.type_id,
        communication_post_ids: facilityData.communication_post_ids,
        facility_class: facilityData.facility_class,
        division: facilityData.division_id,
        subdivision: facilityData.subdivision_id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      facilityCache.clear();
      return data;
    } catch (error) {
      console.error('Ошибка при обновлении объекта:', error);
      throw error;
    }
  },

  // Delete facility
  deleteFacility: async (id: string) => {
    await api.delete(`/facilities/${id}/`);
    facilityCache.clear();
  },

  getFacilityTypes: async (token?: string) => {
    const { data } = await api.get('/facilities/facility-types/', {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : undefined
    });
    return toArray(data);
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

// ============================================================
// Посты связи
// ============================================================

export type CommunicationPostKind = 'P' | 'KP' | 'PS' | 'NDR';

export interface CommunicationPostPayload {
  name: string;
  kind?: CommunicationPostKind;
  /** ID родительского поста. На бэкенд уходит как `parent_id`. */
  parent?: number | null;
  division: number;
  subdivision?: number | null;
  description?: string;
}

export const communicationPostsApi = {
  getCommunicationPosts: async (params?: {
    token?: string;
    division?: string;
    kind?: CommunicationPostKind | CommunicationPostKind[];
    parent?: string | 'null';
    root?: boolean;
    leaves?: boolean;
    search?: string;
  }) => {
    const queryParams: Record<string, any> = {};
    if (params?.division) queryParams.division = params.division;
    if (params?.kind) {
      queryParams.kind = Array.isArray(params.kind) ? params.kind.join(',') : params.kind;
    }
    if (params?.parent) queryParams.parent = params.parent;
    if (params?.root) queryParams.root = 'true';
    if (params?.leaves) queryParams.leaves = 'true';
    if (params?.search) queryParams.search = params.search;

    const { data } = await api.get('facilities/communication-posts/', {
      params: queryParams,
      headers: params?.token ? {
        Authorization: `Bearer ${params.token}`,
      } : undefined
    });
    return toArray(data);
  },

  getCommunicationPostsTree: async (params?: {
    token?: string;
    division?: string;
  }) => {
    const { data } = await api.get('facilities/communication-posts/tree/', {
      params: params?.division ? { division: params.division } : {},
      headers: params?.token ? {
        Authorization: `Bearer ${params.token}`,
      } : undefined
    });
    return toArray(data);
  },

  getCommunicationPost: async (id: string, token?: string | null) => {
    const { data } = await api.get(`facilities/communication-posts/${id}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return data;
  },

  createCommunicationPost: async (
    postData: {
      name: string;
      kind?: CommunicationPostKind;
      parent?: number | null;
      division: number;
      subdivision?: number | null;
      description?: string;
    },
    token: string
  ) => {
    // ⚠️ Бэкенд-сериализатор ожидает `parent_id`, а не `parent`.
    //    Поле `parent` — read-only (вложенный объект).
    const payload: Record<string, any> = {
      name: postData.name,
      division: postData.division,
      parent_id: postData.parent ?? null,
    };
    if (postData.kind) payload.kind = postData.kind;
    if (typeof postData.subdivision !== 'undefined') {
      payload.subdivision = postData.subdivision ?? null;
    }
    if (typeof postData.description !== 'undefined' && postData.description !== '') {
      payload.description = postData.description;
    }

    const { data } = await api.post('facilities/communication-posts/', payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    return data;
  },

  updateCommunicationPost: async (
    id: string,
    postData: {
      name: string;
      kind?: CommunicationPostKind;
      parent?: number | null;
      division: number;
      subdivision?: number | null;
      description?: string;
    },
    token?: string | null
  ) => {
    const payload: Record<string, any> = {
      name: postData.name,
      division: postData.division,
      parent_id: postData.parent ?? null,
      subdivision: postData.subdivision ?? null,
    };
    if (postData.kind) payload.kind = postData.kind;
    if (typeof postData.description !== 'undefined') {
      payload.description = postData.description;
    }

    const { data } = await api.patch(`facilities/communication-posts/${id}/`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
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