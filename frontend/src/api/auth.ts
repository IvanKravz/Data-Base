import { api } from './client';

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    name: string;
    position: string;
    department: string;
    division: string;
    subdivision?: string;
  };
}

interface RegisterData {
  username: string;
  password: string;
  name: string;
  position: string;
  department: string;
  division: string;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/users/login/', { username, password });
    // Store tokens
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    return data;
  },

  register: async (userData: RegisterData): Promise<LoginResponse> => {
    const { data } = await api.post('/users/register/', userData);
    // Store tokens
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    return data;
  },

  refreshToken: async (): Promise<{ access: string }> => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
      throw new Error('No refresh token available');
    }
    const { data } = await api.post('/users/auth/refresh/', { refresh });
    localStorage.setItem('accessToken', data.access);
    return data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};