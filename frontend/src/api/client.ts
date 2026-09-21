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

// Основной экземпляр — со всеми интерсепторами.
export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// "Чистый" экземпляр — БЕЗ интерсепторов. Используется ТОЛЬКО для
// refresh и logout. Это исключает deadlock: 401 на refresh больше не
// запускает новый refresh и не уходит в очередь.
export const refreshClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

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

// Добавляем токен ко всем запросам
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Обработка ответов
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Защита: error может быть НЕ axios-ошибкой (TypeError и т.п.)
        if (!error?.config && !error?.response && !error?.request) {
            console.error('Non-axios error in interceptor:', error);
            return Promise.reject(error);
        }

        const originalRequest = error.config;
        const url: string | undefined = originalRequest?.url;

        const isLoginRequest = url?.includes('/auth/login/');
        const isRefreshRequest = url?.includes('/auth/refresh/');
        const isLogoutRequest = url?.includes('/auth/logout/');

        // 401 и это не логин/refresh/logout — пробуем обновить токен
        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !isLoginRequest &&
            !isRefreshRequest &&
            !isLogoutRequest
        ) {
            if (isRefreshing) {
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
                // logout сам очистит хранилище и перекинет на /auth
                authApi.logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response) {
            const { status, data } = error.response;
            const message = data?.message || data?.detail || 'Произошла ошибка';

            console.error(`API Error ${status}:`, message, url);

            const event = new CustomEvent('apiError', {
                detail: {
                    status,
                    message,
                    url,
                    method: originalRequest?.method,
                    timestamp: Date.now(),
                    originalStatus: status,
                },
            });
            window.dispatchEvent(event);

            if (status === 403) {
                console.warn('Доступ запрещён:', message);
            } else if (status === 404) {
                console.warn('Ресурс не найден:', url);
            } else if (status === 500) {
                console.error('Ошибка сервера:', message);
            }
        } else if (error.request) {
            console.error('Ошибка сети:', error.request);
        }

        return Promise.reject(error);
    },
);

export const handleApiError = (error: any): string => {
    if (error.response) {
        return error.response.data?.message || error.response.data?.detail || 'Произошла ошибка';
    } else if (error.request) {
        return 'Ошибка сети. Проверьте подключение к интернету.';
    }
    return 'Произошла непредвиденная ошибка';
};

export const isApiError = (error: any, status?: number): boolean => {
    if (!error?.response) return false;
    return status ? error.response.status === status : true;
};