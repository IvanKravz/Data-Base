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

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Флаг и очередь для предотвращения множественных обновлений токена
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isLoginRequest = originalRequest.url?.includes('/auth/login/');

    // Если 401 и запрос не на логин и не повторялся
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      if (isRefreshing) {
        // Если уже идёт обновление, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await authApi.refreshToken();
        const token = localStorage.getItem('accessToken');
        originalRequest.headers.Authorization = `Bearer ${token}`;
        processQueue(null, token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authApi.logout();
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Обработка других ошибок (без генерации событий, чтобы избежать ошибок с слушателями)
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.detail || 'Произошла ошибка';

      // Логируем в консоль, но не генерируем событие
      console.error(`API Error ${status}:`, message, originalRequest?.url);

      // Специфичные коды
      if (status === 403) {
        console.warn('Доступ запрещён:', message);
      } else if (status === 404) {
        console.warn('Ресурс не найден:', originalRequest?.url);
      } else if (status === 500) {
        console.error('Ошибка сервера:', message);
      }
    } else if (error.request) {
      console.error('Ошибка сети:', error.request);
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

export const isApiError = (error: any, status?: number): boolean => {
  if (!error?.response) return false;
  return status ? error.response.status === status : true;
};