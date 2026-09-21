// auth.ts
import { LoginResponse, ModulePermissions, RegisterData } from '../types';
import { api, refreshClient } from './client';

type AppModule = 'employees' | 'equipment' | 'facilities' | 'tasks' | 'networks' | 'communicationPosts';

interface UserPermissions {
    roles: string[];
    filters: Record<string, any>;
    models: Record<string, string[]>;
    modules: string[];
}

export const authApi = {
    login: async (username: string, password: string): Promise<LoginResponse | { requires_2fa: boolean; temp_token: string }> => {
        const { data } = await api.post('/users/auth/login/', { username, password });
        if (data.requires_2fa) {
            return { requires_2fa: true, temp_token: data.temp_token };
        }
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    verify2fa: async (tempToken: string, code: string): Promise<LoginResponse> => {
        const { data } = await api.post('/users/auth/verify-2fa/', { temp_token: tempToken, code });
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    register: async (userData: RegisterData): Promise<LoginResponse> => {
        const { data } = await api.post('/users/auth/register/', userData);
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    /**
     * Обновление access-токена.
     * ВАЖНО: используется refreshClient (без интерсепторов), иначе 401 на
     * самом refresh-запросе запускает повторный refresh → deadlock.
     */
    refreshToken: async (): Promise<{ access: string }> => {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) {
            throw new Error('No refresh token available');
        }
        const { data } = await refreshClient.post('/users/auth/refresh/', { refresh });
        localStorage.setItem('accessToken', data.access);
        return data;
    },

    /**
     * Выход из системы.
     * Локальное состояние чистится ВСЕГДА, независимо от ответа сервера.
     * Серверный вызов — best-effort и не блокирует редирект.
     */
    logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            // Не ждём ответа: если токен уже истёк, сервер вернёт 401, но нам
            // всё равно — локально мы уже выходим.
            refreshClient
                .post('/users/auth/logout/', { refresh: refreshToken })
                .catch(() => { /* игнорируем */ });
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('module_permissions');
        sessionStorage.removeItem('appLoaded');

        window.location.href = '/auth';
    },

    getModulePermissions: (): UserPermissions | null => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.permissions) return user.permissions;
                if (user.roles && Array.isArray(user.roles)) {
                    return { roles: user.roles, filters: {}, models: {}, modules: [] };
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        return null;
    },

    hasPermission: (module: AppModule, permission: string): boolean => {
        const permissions = authApi.getModulePermissions();
        if (!permissions) return false;
        const moduleToModelMap: Record<AppModule, string> = {
            'employees': 'Employee',
            'equipment': 'Equipment',
            'facilities': 'Facility',
            'tasks': 'Task',
            'networks': 'CommunicationNetwork',
            'communicationPosts': 'CommunicationPost',
        };
        const modelName = moduleToModelMap[module];
        if (!modelName) return false;
        const modelPermissions = permissions.models[modelName];
        if (!modelPermissions || !Array.isArray(modelPermissions)) return false;
        return modelPermissions.includes(permission);
    },

    canViewModule: (module: string): boolean => {
        const permissions = authApi.getModulePermissions();
        if (!permissions) return false;
        const moduleToModelMap: Record<string, string> = {
            'employees': 'Employee',
            'equipment': 'Equipment',
            'facilities': 'Facility',
            'tasks': 'Task',
            'networks': 'CommunicationNetwork',
            'communicationPosts': 'CommunicationPost',
        };
        const modelName = moduleToModelMap[module];
        if (!modelName) return false;
        const modelPermissions = permissions.models[modelName];
        if (!modelPermissions || !Array.isArray(modelPermissions)) return false;
        return modelPermissions.includes('view');
    },

    canEditModule: (module: string): boolean => {
        const permissions = authApi.getModulePermissions();
        if (!permissions) return false;
        const moduleToModelMap: Record<string, string> = {
            'employees': 'Employee',
            'equipment': 'Equipment',
            'facilities': 'Facility',
            'tasks': 'Task',
            'networks': 'CommunicationNetwork',
            'communicationPosts': 'CommunicationPost',
        };
        const modelName = moduleToModelMap[module];
        if (!modelName) return false;
        const modelPermissions = permissions.models[modelName];
        if (!modelPermissions || !Array.isArray(modelPermissions)) return false;
        return modelPermissions.includes('change') || modelPermissions.includes('edit');
    },

    updateGlobalView: (isGlobalView: boolean): void => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        try {
            const user = JSON.parse(userStr);
            user.is_global_view = isGlobalView;
            localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
            console.error('Error updating global view:', e);
        }
    },

    getGlobalView: (): boolean => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return false;
        try {
            const user = JSON.parse(userStr);
            return user.is_global_view || false;
        } catch (e) {
            console.error('Error getting global view:', e);
            return false;
        }
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error getting current user:', e);
            return null;
        }
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('accessToken') && !!localStorage.getItem('user');
    },
};