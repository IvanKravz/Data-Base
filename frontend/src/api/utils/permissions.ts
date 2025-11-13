// utils/permissions.ts
import { authApi } from "../auth";

/**
 * Утилиты для проверки прав доступа
 */

// Основные модули системы
export type AppModule = 'employees' | 'equipment' | 'facilities' | 'tasks' | 'networks';

// Типы прав доступа
export type PermissionType = 'view' | 'add' | 'change' | 'delete';

// Проверка наличия конкретного права
export const hasPermission = (module: AppModule, permission: PermissionType): boolean => {
  return authApi.hasPermission(module, permission);
};

// Проверка возможности просмотра модуля
export const canView = (module: AppModule): boolean => {
  return hasPermission(module, 'view');
};

// Проверка возможности редактирования в модуле
export const canEdit = (module: AppModule): boolean => {
  return hasPermission(module, 'change');
};

// Проверка возможности удаления в модуле
export const canDelete = (module: AppModule): boolean => {
  return hasPermission(module, 'delete');
};

// Получение всех прав доступа
export const getPermissions = () => {
  return authApi.getModulePermissions();
};

// Проверка, авторизован ли пользователь
export const isAuthenticated = (): boolean => {
  return authApi.isAuthenticated();
};

// Получение информации о текущем пользователе
export const getCurrentUser = () => {
  return authApi.getCurrentUser();
};

// Проверка ролей пользователя
export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};

// Проверка, является ли пользователь руководителем
export const isDirector = (): boolean => {
  return hasRole('director') || hasRole('deputy_director');
};

// Проверка, является ли пользователь начальником эксплуатации
export const isExploitationChief = (): boolean => {
  return hasRole('exploitation_chief');
};

// Проверка, является ли пользователь сотрудником эксплуатации
export const isExploitationEmployee = (): boolean => {
  return hasRole('exploitation_employee');
};