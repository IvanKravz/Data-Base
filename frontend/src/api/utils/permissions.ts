// utils/permissions.ts
import { authApi } from "../auth";

/**
 * Утилиты для проверки прав доступа
 */

// Основные модули системы
export type AppModule = 'employees' | 'equipment' | 'facilities' | 'tasks' | 'networks' | 'communicationPosts' | 'divisions' | 'storage' | 'cabinet' | 'map';

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

export const canCreate = (module: AppModule): boolean => {
  return hasPermission(module, 'add');
};

// Проверка возможности редактирования в модуле
export const canEdit = (module: AppModule): boolean => {
  return hasPermission(module, 'change');
};

// Проверка возможности удаления в модуле
export const canDelete = (module: AppModule): boolean => {
  // Явное ограничение для ролей эксплуатации
  if ((module === 'equipment' || module === 'networks') &&
    (isExploitationChief() || isExploitationEmployee())) {
    return false;
  }

  const result = hasPermission(module, 'delete');
  return result;
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

// Проверка, является ли пользователь администратором
export const isAdmin = (): boolean => {
  return hasRole('admin');
};

// Проверка доступа к странице на основе модели и действия
export const canAccessPage = (model: string, action: PermissionType = 'view'): boolean => {
  const permissions = getPermissions();
  if (!permissions) return false;

  const modelPermissions = permissions.models[model];
  if (!modelPermissions || !Array.isArray(modelPermissions)) return false;

  return modelPermissions.includes(action);
};

// Специфичные проверки для страниц
export const canAccessPersonnel = (action: PermissionType = 'view'): boolean => {
  return canAccessPage('Employee', action);
};

export const isEditorShaWorker = (): boolean => {
  const permissions = getPermissions();
  if (!permissions) return false;
  return permissions.is_editor_sha_worker === true;
};

export const canAccessEquipment = (action: PermissionType = 'view'): boolean => {
  return canAccessPage('Equipment', action);
};

export const canAccessFacilities = (action: PermissionType = 'view'): boolean => {
  return canAccessPage('Facility', action);
};

export const canAccessTasks = (action: PermissionType = 'view'): boolean => {
  return canAccessPage('Task', action);
};

export const canAccessNetworks = (action: PermissionType = 'view'): boolean => {
  return canAccessPage('CommunicationNetwork', action);
};

export const canAccessCommunicationPosts = (action: PermissionType = 'view'): boolean => {
  return canAccessPage('CommunicationPost', action);
};

export const canAccessDivisions = (action: PermissionType = 'view'): boolean => {
  return canAccessPage('Division', action);
};

// Хук для использования в компонентах
export const usePermissions = () => {
  return {
    canAccessPersonnel,
    canAccessEquipment,
    canAccessFacilities,
    canAccessTasks,
    canAccessNetworks,
    canAccessCommunicationPosts,
    canAccessDivisions,
    canView,
    canCreate,
    canEdit,
    canDelete,
    isAdmin,
    isDirector,
    isExploitationChief,
    isExploitationEmployee,
    hasRole,
    getCurrentUser
  };

};

// ЗАДАЧИ
export const canEditTask = (task: any, currentUser: any): boolean => {
  if (!currentUser) return false;

  const userRoles = currentUser.roles || [];

  // Администратор может редактировать любые задачи
  if (userRoles.includes('admin')) return true;

  // Сотрудник эксплуатации может редактировать только свои задачи
  if (userRoles.includes('exploitation_employee')) {
    return task.created_by?.id === currentUser.id;
  }

  // Начальник эксплуатации может редактировать ВСЕ задачи своего подразделения
  if (userRoles.includes('exploitation_chief')) {
    return task.division?.id === currentUser.division_info?.id;
  }

  // Руководитель и заместитель могут редактировать только свои задачи
  if (userRoles.includes('director') || userRoles.includes('deputy_director')) {
    return task.created_by?.id === currentUser.id;
  }

  // Остальные пользователи могут редактировать только свои задачи
  return task.created_by?.id === currentUser.id;
};

export const canDeleteTask = (task: any, currentUser: any): boolean => {
  if (!currentUser) return false;

  const userRoles = currentUser.roles || [];

  // Администратор может удалять любые задачи
  if (userRoles.includes('admin')) return true;

  // Сотрудник эксплуатации может удалять только свои задачи
  if (userRoles.includes('exploitation_employee')) {
    return task.created_by?.id === currentUser.id;
  }

  // Начальник эксплуатации может удалять ВСЕ задачи своего подразделения
  if (userRoles.includes('exploitation_chief')) {
    return task.division?.id === currentUser.division_info?.id;
  }

  // Руководитель и заместитель могут удалять только свои задачи
  if (userRoles.includes('director') || userRoles.includes('deputy_director')) {
    return task.created_by?.id === currentUser.id;
  }

  // Остальные пользователи могут удалять только свои задачи
  return task.created_by?.id === currentUser.id;
};