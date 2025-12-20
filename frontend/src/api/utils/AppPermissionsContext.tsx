// contexts/AppPermissionsContext.tsx
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import {
    canAccessPersonnel,
    canAccessEquipment,
    canAccessFacilities,
    canAccessTasks,
    canAccessNetworks,
    canAccessCommunicationPosts,
    canAccessDivisions,
    canAccessPage, // Добавляем canAccessPage
    canView,
    canCreate,
    canEdit,
    canDelete,
    isAdmin,
    isDirector,
    isExploitationChief,
    isExploitationEmployee,
    hasRole,
    getCurrentUser,
    canEditTask,
    canDeleteTask,
    PermissionType
} from '../utils/permissions';

interface AppPermissionsContextType {
    canAccessPersonnel: (action?: string) => boolean;
    canAccessEquipment: (action?: string) => boolean;
    canAccessFacilities: (action?: string) => boolean;
    canAccessTasks: (action?: string) => boolean;
    canAccessNetworks: (action?: string) => boolean;
    canAccessCommunicationPosts: (action?: string) => boolean;
    canAccessDivisions: (action?: string) => boolean;
    canAccessMap: (action?: PermissionType) => boolean; // Добавляем
    canAccessStorage: (action?: PermissionType) => boolean; // Добавляем
    canAccessPage: (model: string, action?: PermissionType) => boolean; // Экспортируем canAccessPage
    canView: (module: any) => boolean;
    canCreate: (module: any) => boolean;
    canEdit: (module: any) => boolean;
    canDelete: (module: any) => boolean;
    isAdmin: () => boolean;
    isDirector: () => boolean;
    isExploitationChief: () => boolean;
    isExploitationEmployee: () => boolean;
    hasRole: (role: string) => boolean;
    getCurrentUser: () => any;
    canEditTask: (task: any) => boolean;
    canDeleteTask: (task: any) => boolean;
}

const AppPermissionsContext = createContext<AppPermissionsContextType | null>(null);

export const AppPermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Мемоизируем функции для оптимизации производительности
    const canAccessMap = useCallback((action: PermissionType = 'view') => {
        return canAccessPage('Map', action);
    }, []);

    const canAccessStorage = useCallback((action: PermissionType = 'view') => {
        return canAccessPage('StorageFile', action);
    }, []);

    const value = useMemo(() => ({
        canAccessPersonnel,
        canAccessEquipment,
        canAccessFacilities,
        canAccessTasks,
        canAccessNetworks,
        canAccessCommunicationPosts,
        canAccessDivisions,
        canAccessMap, 
        canAccessStorage, 
        canAccessPage, 
        canView,
        canCreate,
        canEdit,
        canDelete,
        isAdmin,
        isDirector,
        isExploitationChief,
        isExploitationEmployee,
        hasRole,
        getCurrentUser,
        canEditTask,
        canDeleteTask
    }), [canAccessMap, canAccessStorage]);

    return (
        <AppPermissionsContext.Provider value={value}>
            {children}
        </AppPermissionsContext.Provider>
    );
};

export const useAppPermissions = () => {
    const context = useContext(AppPermissionsContext);
    if (!context) {
        throw new Error('useAppPermissions must be used within AppPermissionsProvider');
    }
    return context;
};