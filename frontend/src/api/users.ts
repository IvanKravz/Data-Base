// api/users.ts
import { api } from './client';

export interface User {
    id: number;
    username: string;
    email?: string;
    is_staff: boolean;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
    is_online: boolean;
    roles: string[];
    permissions: any;
    division_info?: {
        id: string;
        name: string;
        subdivision?: { id: string; name: string };
    };
    is_global_view: boolean;
    two_factor_enabled?: boolean; // добавим, если бэкенд возвращает
}

export interface UserCreateData {
    username: string;
    password: string;
    email?: string;
    user_division_id?: number | null;
    user_subdivision_id?: number | null;
}

export interface UserUpdateData {
    email?: string;
    user_division_id?: number | null;
    user_subdivision_id?: number | null;
    is_active?: boolean;
    groups?: number[];
}

export interface AvailableRole {
    id: number;
    role_id: string;
    name: string;
    description: string;
}

export const usersApi = {
    getUsers: (params?: any) =>
        api.get<User[]>('/users/users/', { params }),

    getUser: (id: number) =>
        api.get<User>(`/users/users/${id}/`),

    createUser: (data: UserCreateData) =>
        api.post<User>('/users/users/', data),

    updateUser: (id: number, data: UserUpdateData) =>
        api.patch<User>(`/users/users/${id}/`, data),

    deleteUser: (id: number) =>
        api.delete(`/users/users/${id}/`),

    getAvailableRoles: () =>
        api.get<AvailableRole[]>('/users/roles/'),

    changePassword: (data: { old_password: string; new_password: string }) =>
        api.post('/users/change-password/', data),

    setUserPassword: (userId: number, password: string) =>
        api.patch(`/users/users/${userId}/`, { password }),

    // 2FA методы
    set2FA: (userId: number, code: string) =>
        api.post(`/users/users/${userId}/set_2fa/`, { code }),

    disable2FA: (userId: number) =>
        api.post(`/users/users/${userId}/disable_2fa/`),
};

export const backupApi = {
    downloadBackup: () =>
        api.get('/backup/download/', {
            responseType: 'blob',
        }),
    restoreBackup: (file: File, flushFirst: boolean = false) => {
        const formData = new FormData();
        formData.append('backup_file', file);
        formData.append('flush_first', String(flushFirst));
        return api.post('/backup/restore/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};