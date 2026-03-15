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
    groups?: number[]; // добавляем поле для групп
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
};