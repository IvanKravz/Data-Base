// auth.ts
import { LoginResponse, ModulePermissions, RegisterData } from '../types';
import { api } from './client';

// Добавляем тип для модулей приложения
type AppModule = 'employees' | 'equipment' | 'facilities' | 'tasks' | 'networks' | 'communicationPosts';

// Тип для новой структуры permissions
interface UserPermissions {
  roles: string[];
  filters: Record<string, any>;
  models: Record<string, string[]>; // Например: { Employee: ['view', 'add', 'change', 'delete'] }
  modules: string[];
}

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

  // Метод для получения прав доступа из новой структуры
  getModulePermissions: (): UserPermissions | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // Возвращаем permissions из пользователя
        if (user.permissions) {
          return user.permissions;
        }
        
        // Если permissions нет, создаем базовую структуру из roles
        if (user.roles && Array.isArray(user.roles)) {
          return {
            roles: user.roles,
            filters: {},
            models: {},
            modules: []
          };
        }
       
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    return null;
  },
  
  // ОБНОВЛЕННЫЙ МЕТОД ДЛЯ ПРОВЕРКИ КОНКРЕТНЫХ ПРАВ
  hasPermission: (module: AppModule, permission: string): boolean => {
    const permissions = authApi.getModulePermissions();
    if (!permissions) return false;
    
    // Маппинг модулей на модели
    const moduleToModelMap: Record<AppModule, string> = {
      'employees': 'Employee',
      'equipment': 'Equipment',
      'facilities': 'Facility', 
      'tasks': 'Task',
      'networks': 'CommunicationNetwork',
      'communicationPosts': 'CommunicationPost'
    };
    
    const modelName = moduleToModelMap[module];
    if (!modelName) return false;
    
    const modelPermissions = permissions.models[modelName];
    if (!modelPermissions || !Array.isArray(modelPermissions)) return false;
    
    // Проверяем наличие конкретного права в массиве
    return modelPermissions.includes(permission);
  },
  
  // Метод для проверки доступа к модулю
  canViewModule: (module: string): boolean => {
    const permissions = authApi.getModulePermissions();
    if (!permissions) return false;
    
    // Маппинг модулей на модели
    const moduleToModelMap: Record<string, string> = {
      'employees': 'Employee',
      'equipment': 'Equipment',
      'facilities': 'Facility',
      'tasks': 'Task',
      'networks': 'CommunicationNetwork',
      'communicationPosts': 'CommunicationPost'
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
    
    // Маппинг модулей на модели
    const moduleToModelMap: Record<string, string> = {
      'employees': 'Employee',
      'equipment': 'Equipment',
      'facilities': 'Facility',
      'tasks': 'Task',
      'networks': 'CommunicationNetwork',
      'communicationPosts': 'CommunicationPost'
    };
    
    const modelName = moduleToModelMap[module];
    if (!modelName) return false;
    
    const modelPermissions = permissions.models[modelName];
    if (!modelPermissions || !Array.isArray(modelPermissions)) return false;
    
    // Для редактирования проверяем наличие change или edit прав
    return modelPermissions.includes('change') || modelPermissions.includes('edit');
  },

  // Метод для обновления режима просмотра
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