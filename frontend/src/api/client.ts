// client.ts
import axios from 'axios';
import { authApi } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export interface ApiError {
  status: number;
  message: string;
  url?: string;
  method?: string;
  timestamp?: number;
}

declare global {
  interface WindowEventMap {
    'apiError': CustomEvent<ApiError>;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Проверяем, является ли запрос на логин
    const isLoginRequest = originalRequest.url?.includes('/auth/login/');

    // Handle 401 - Unauthorized (token refresh) - не для логина
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;

      try {
        await authApi.refreshToken();
        const token = localStorage.getItem('accessToken');
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        authApi.logout();
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    // Handle other API errors globally
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.detail || 'Произошла ошибка';

      // Generate custom event for global error handling
      window.dispatchEvent(new CustomEvent('apiError', {
        detail: {
          status,
          message,
          url: originalRequest?.url,
          method: originalRequest?.method
        }
      }));

      // Handle specific status codes
      switch (status) {
        case 403:
          // Access denied - redirect to access denied page
          console.warn('Access denied:', message);
          // The global handler in AppRouter will catch this
          break;

        case 404:
          // Resource not found
          console.warn('Resource not found:', originalRequest?.url);
          break;

        case 500:
          // Server error
          console.error('Server error:', message);
          break;

        default:
          console.error(`API Error ${status}:`, message);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      window.dispatchEvent(new CustomEvent('apiError', {
        detail: {
          status: 0,
          message: 'Ошибка сети. Проверьте подключение к интернету.',
          url: originalRequest?.url
        }
      }));
    }

    return Promise.reject(error);
  }
);

// Utility function for manual error handling
export const handleApiError = (error: any): string => {
  if (error.response) {
    return error.response.data?.message || error.response.data?.detail || 'Произошла ошибка';
  } else if (error.request) {
    return 'Ошибка сети. Проверьте подключение к интернету.';
  } else {
    return 'Произошла непредвиденная ошибка';
  }
};

// Utility function for specific error checking
export const isApiError = (error: any, status?: number): boolean => {
  if (!error?.response) return false;
  return status ? error.response.status === status : true;
};