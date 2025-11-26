// auth.ts
import { LoginResponse, ModulePermissions, RegisterData } from '../types';
import { api } from './client';

// Добавляем тип для модулей приложения
type AppModule = 'employees' | 'equipment' | 'facilities' | 'tasks' | 'networks';

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/users/auth/login/', { username, password });
    
    // Сохраняем токены и данные пользователя
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
    // Полная очистка данных аутентификации
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('module_permissions');
    sessionStorage.removeItem('appLoaded');
  },

  // Метод для получения прав доступа с приоритетом на отдельное хранение
  getModulePermissions: (): ModulePermissions | null => {
    // Теперь всегда берем из user объекта
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.module_permissions || null;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    return null;
  },
  
  // ДОБАВЛЯЕМ НОВЫЙ МЕТОД ДЛЯ ПРОВЕРКИ КОНКРЕТНЫХ ПРАВ
  hasPermission: (module: AppModule, permission: string): boolean => {
    const permissions = authApi.getModulePermissions();
    if (!permissions) return false;
    
    const modulePermissions = permissions[module];
    if (!modulePermissions) return false;
    
    switch (permission) {
      case 'view':
        return modulePermissions.can_view;
      case 'add':
      case 'change':
      case 'delete':
        // В текущей структуре прав can_edit включает все права на модификацию
        return modulePermissions.can_edit;
      default:
        return false;
    }
  },
  
  // Метод для проверки доступа к модулю
  canViewModule: (module: string): boolean => {
    const permissions = authApi.getModulePermissions();
    if (!permissions) return false;
    
    // Проверяем существование модуля в правах
    if (permissions[module as keyof ModulePermissions]) {
      return permissions[module as keyof ModulePermissions].can_view;
    }
    
    return false;
  },
  
  canEditModule: (module: string): boolean => {
    const permissions = authApi.getModulePermissions();
    if (!permissions) return false;
    
    if (permissions[module as keyof ModulePermissions]) {
      return permissions[module as keyof ModulePermissions].can_edit;
    }
    
    return false;
  },

  // Метод для обновления режима просмотра
  updateGlobalView: (isGlobalView: boolean): void => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
  
    try {
      const user = JSON.parse(userStr);
      user.is_global_view = isGlobalView;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Также обновляем module_permissions если он существует отдельно (для обратной совместимости)
      const permissionsStr = localStorage.getItem('module_permissions');
      if (permissionsStr) {
        const permissions = JSON.parse(permissionsStr);
        localStorage.setItem('module_permissions', JSON.stringify(permissions));
      }
    } catch (e) {
      console.error('Error updating global view:', e);
    }
  },

  // Метод для получения режима просмотра
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

  // Дополнительный метод для получения всей информации о пользователе
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

  // Метод для проверки, авторизован ли пользователь
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken') && !!localStorage.getItem('user');
  }
};