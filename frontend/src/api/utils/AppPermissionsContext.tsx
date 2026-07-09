// contexts/AppPermissionsContext.tsx
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { PermissionType } from '../utils/permissions';

interface ModelFilters {
    [key: string]: any;
}

interface AppPermissionsContextType {
    canAccessPersonnel: (action?: PermissionType) => boolean;
    canAccessEquipment: (action?: PermissionType) => boolean;
    canAccessFacilities: (action?: PermissionType) => boolean;
    canAccessTasks: (action?: PermissionType) => boolean;
    canAccessNetworks: (action?: PermissionType) => boolean;
    canAccessCommunicationPosts: (action?: PermissionType) => boolean;
    canAccessDivisions: (action?: PermissionType) => boolean;
    canAccessMap: (action?: PermissionType) => boolean;
    canAccessStorage: (action?: PermissionType) => boolean;
    canAccessPage: (model: string, action?: PermissionType) => boolean;
    canView: (module: string) => boolean;
    canCreate: (module: string) => boolean;
    canEdit: (module: string) => boolean;
    canDelete: (module: string) => boolean;
    isAdmin: () => boolean;
    isDirector: () => boolean;
    isExploitationChief: () => boolean;
    isExploitationEmployee: () => boolean;
    hasRole: (role: string) => boolean;
    getCurrentUser: () => any;
    canEditTask: (task: any) => boolean;
    canDeleteTask: (task: any) => boolean;
    personnelFilters: ModelFilters | null;
    equipmentFilters: ModelFilters | null;
    facilitiesFilters: ModelFilters | null;
    networksFilters: ModelFilters | null;
    taskFilters: ModelFilters | null;
    isEditorShaWorker: boolean;
}

const AppPermissionsContext = createContext<AppPermissionsContextType | null>(null);

const extractFilters = (modelFilters: any): ModelFilters | null => {
    if (!modelFilters) return null;
    return Object.keys(modelFilters).length > 0 ? modelFilters : null;
};

export const AppPermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const user = useSelector((state: RootState) => state.auth.user);
    const permissions = user?.permissions;

    const hasPermission = useCallback((model: string, action: PermissionType): boolean => {
        if (!permissions) return false;
        const modelPerms = permissions.models?.[model];
        if (!modelPerms || !Array.isArray(modelPerms)) return false;
        return modelPerms.includes(action);
    }, [permissions]);

    const canAccessPage = useCallback((model: string, action: PermissionType = 'view'): boolean => {
        return hasPermission(model, action);
    }, [hasPermission]);

    const canAccessPersonnel = useCallback((action: PermissionType = 'view') => canAccessPage('Employee', action), [canAccessPage]);
    const canAccessEquipment = useCallback((action: PermissionType = 'view') => canAccessPage('Equipment', action), [canAccessPage]);
    const canAccessFacilities = useCallback((action: PermissionType = 'view') => canAccessPage('Facility', action), [canAccessPage]);
    const canAccessTasks = useCallback((action: PermissionType = 'view') => canAccessPage('Task', action), [canAccessPage]);
    const canAccessNetworks = useCallback((action: PermissionType = 'view') => canAccessPage('CommunicationNetwork', action), [canAccessPage]);
    const canAccessCommunicationPosts = useCallback((action: PermissionType = 'view') => canAccessPage('CommunicationPost', action), [canAccessPage]);
    const canAccessDivisions = useCallback((action: PermissionType = 'view') => canAccessPage('Division', action), [canAccessPage]);
    const canAccessMap = useCallback((action: PermissionType = 'view') => canAccessPage('Map', action), [canAccessPage]);
    const canAccessStorage = useCallback((action: PermissionType = 'view') => canAccessPage('StorageFile', action), [canAccessPage]);

    const canView = useCallback((module: string) => canAccessPage(module, 'view'), [canAccessPage]);
    const canCreate = useCallback((module: string) => canAccessPage(module, 'add'), [canAccessPage]);
    const canEdit = useCallback((module: string) => canAccessPage(module, 'change'), [canAccessPage]);
    const canDelete = useCallback((module: string) => {
        if ((module === 'Equipment' || module === 'CommunicationNetwork') &&
            (isExploitationChief() || isExploitationEmployee())) {
            return false;
        }
        return canAccessPage(module, 'delete');
    }, [canAccessPage]);

    const hasRole = useCallback((role: string): boolean => {
        if (!user?.roles) return false;
        return user.roles.includes(role);
    }, [user]);

    const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
    const isDirector = useCallback(() => hasRole('director') || hasRole('deputy_director'), [hasRole]);
    const isExploitationChief = useCallback(() => hasRole('exploitation_chief'), [hasRole]);
    const isExploitationEmployee = useCallback(() => hasRole('exploitation_employee'), [hasRole]);

    const getCurrentUser = useCallback(() => user, [user]);

    const personnelFilters = useMemo(() => extractFilters(permissions?.filters?.Employee), [permissions]);
    const equipmentFilters = useMemo(() => extractFilters(permissions?.filters?.Equipment), [permissions]);
    const facilitiesFilters = useMemo(() => extractFilters(permissions?.filters?.Facility), [permissions]);
    const networksFilters = useMemo(() => extractFilters(permissions?.filters?.CommunicationNetwork), [permissions]);
    const taskFilters = useMemo(() => extractFilters(permissions?.filters?.Task), [permissions]);
    const isEditorShaWorker = permissions?.is_editor_sha_worker ?? false;

    const canEditTask = useCallback((task: any): boolean => {
        if (!user) return false;
        const roles = user.roles || [];
        if (roles.includes('admin')) return true;
        if (roles.includes('exploitation_employee')) {
            return task.created_by?.id === user.id;
        }
        if (roles.includes('exploitation_chief')) {
            return task.division?.id === user.division_info?.id;
        }
        if (roles.includes('director') || roles.includes('deputy_director')) {
            return task.created_by?.id === user.id;
        }
        return task.created_by?.id === user.id;
    }, [user]);

    const canDeleteTask = useCallback((task: any): boolean => {
        if (!user) return false;
        const roles = user.roles || [];
        if (roles.includes('admin')) return true;
        if (roles.includes('exploitation_employee')) {
            return task.created_by?.id === user.id;
        }
        if (roles.includes('exploitation_chief')) {
            return task.division?.id === user.division_info?.id;
        }
        if (roles.includes('director') || roles.includes('deputy_director')) {
            return task.created_by?.id === user.id;
        }
        return task.created_by?.id === user.id;
    }, [user]);

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
        canDeleteTask,
        personnelFilters,
        equipmentFilters,
        facilitiesFilters,
        networksFilters,
        taskFilters,
        isEditorShaWorker,
    }), [
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
        canDeleteTask,
        personnelFilters,
        equipmentFilters,
        facilitiesFilters,
        networksFilters,
        taskFilters,
        isEditorShaWorker,
    ]);

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