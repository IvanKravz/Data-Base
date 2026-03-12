// logs.ts - ДОБАВИМ поддержку пагинации
import { api } from './client';

export interface StorageStats {
    total_actions: number;
    actions_by_type: Array<{ action: string; count: number; total_size: number }>;
    files_by_type: Array<{ file_type: string; count: number; total_size: number }>;
    storage_by_location: Array<{ storage_location: string; count: number; total_size: number }>;
    total_upload_size: number;
    total_download_size: number;
    upload_count: number;
    download_count: number;
}

export interface ActionLog {
    id: number;
    user_username: string;
    action: string;
    action_display: string;
    module: string;
    module_display: string;
    model_name: string | null;
    object_id: string | null;
    object_name: string | null;
    details: any;
    ip_address: string | null;
    created_at: string;
    formatted_time: string;
    action_color: string;
    file_path: string | null;
    file_size: number | null;
    file_size_display: string;
    file_type: string | null;
    storage_location: string | null;
    file_name: string | null;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const logsApi = {
    getLogs: async (params?: any): Promise<any> => {
        try {
            const response = await api.get('/users/action-logs/', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Получение справочников
    getChoices: async (): Promise<{
        actions: Array<{ value: string; label: string }>;
        modules: Array<{ value: string; label: string }>;
    }> => {
        const response = await api.get('/users/action-logs/action-choices/');
        return response.data;
    },

    // Получение статистики
    getStats: async (params?: { user_id?: number }): Promise<{
        total_actions: number;
        actions_by_type: Array<{ action: string; count: number }>;
        actions_by_module: Array<{ module: string; count: number }>;
        last_login: string | null;
    }> => {
        const response = await api.get('/users/action-logs/stats/', { params });
        return response.data;
    },

    // Получение статистики по хранилищу
    getStorageStats: async (days?: number): Promise<StorageStats> => {
        const response = await api.get('/users/action-logs/storage-stats/', {
            params: { days }
        });
        return response.data;
    },

    // Получение уникальных типов файлов
    getFileTypes: async (): Promise<string[]> => {
        const response = await api.get('/users/action-logs/file-types/');
        return response.data;
    },

    // Получение уникальных мест хранения
    getStorageLocations: async (): Promise<string[]> => {
        const response = await api.get('/users/action-logs/storage-locations/');
        return response.data;
    },

    // Экспорт логов
    exportLogs: async (params?: {
        action?: string;
        module?: string;
        date_from?: string;
        date_to?: string;
    }): Promise<Blob> => {
        const response = await api.get('/users/action-logs/export/', {
            params,
            responseType: 'blob',
        });
        return response.data;
    },
    /**
     * Массовое удаление логов по модулю и периоду.
     * Доступно только администраторам.
     */
    bulkDeleteLogs: async (data: {
        module: string;
        period?: '1d' | '3d' | '1w' | '1m' | '3m' | '6m' | '1y';
    }): Promise<{ message: string; deleted_count: number }> => {
        const response = await api.post('/users/action-logs/bulk-delete/', data);
        return response.data;
    },
};


export interface EquipmentStats {
    total_actions: number;
    actions_by_type: Array<{ action: string; count: number }>;
    equipment_by_category: Array<{ category: string; count: number }>;
    equipment_by_status: Array<{ status: string; count: number }>;
    decommission_stats: {
        total_count: number;
        last_decommission: string | null;
    };
    recent_actions: Array<{
        id: number;
        action: string;
        object_name: string;
        created_at: string;
        details: any;
    }>;
    modules_summary: {
        equipment: number;
        sha_equipment: number;
    };
}

export const equipmentLogsApi = {
    // Получение статистики по оборудованию
    getEquipmentStats: async (days?: number): Promise<EquipmentStats> => {
        const response = await api.get('equipment/equipment-stats/', {
            params: { days }
        });
        return response.data;
    },

    // Фильтрация логов по модулю equipment
    getEquipmentLogs: async (params?: any): Promise<PaginatedResponse<ActionLog>> => {
        const allParams = { ...params, module: 'equipment' };
        const response = await api.get('/users/action-logs/', { params: allParams });
        return response.data;
    },

    // Фильтрация логов по модулю sha_equipment
    getShaEquipmentLogs: async (params?: any): Promise<PaginatedResponse<ActionLog>> => {
        const allParams = { ...params, module: 'sha_equipment' };
        const response = await api.get('/users/action-logs/', { params: allParams });
        return response.data;
    },

    // Получение логов по конкретному оборудованию
    getEquipmentSpecificLogs: async (equipmentId: number, params?: any): Promise<PaginatedResponse<ActionLog>> => {
        const allParams = { ...params, object_id: equipmentId, module__in: 'equipment,sha_equipment' };
        const response = await api.get('/users/action-logs/', { params: allParams });
        return response.data;
    },

};