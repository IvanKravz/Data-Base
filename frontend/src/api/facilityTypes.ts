import { api } from './client';
import { FacilityType } from '../types';

export const facilityTypesApi = {
    // Получить все типы объектов
    getFacilityTypes: async (token: string) => {
        const { data } = await api.get('/facilities/facility-types/', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return data;
    },

    // Получить тип по ID
    getFacilityType: async (id: string | number, token: string) => {
        const { data } = await api.get(`/facilities/facility-types/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return data;
    },

    // Создать тип
    createFacilityType: async (typeData: Partial<FacilityType>, token: string) => {
        const { data } = await api.post('/facilities/facility-types/', typeData, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return data;
    },

    // Обновить тип
    updateFacilityType: async (id: string | number, typeData: Partial<FacilityType>, token: string) => {
        const { data } = await api.patch(`/facilities/facility-types/${id}/`, typeData, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return data;
    },

    // Удалить тип
    deleteFacilityType: async (id: string | number, token: string) => {
        await api.delete(`/facilities/facility-types/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },
};