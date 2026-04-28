// contexts/AppPermissionsContext.tsx
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
    canAccessPersonnel as checkAccessPersonnel,
    canAccessEquipment as checkAccessEquipment,
    canAccessFacilities as checkAccessFacilities,
    canAccessTasks as checkAccessTasks,
    canAccessNetworks as checkAccessNetworks,
    canAccessCommunicationPosts as checkAccessCommunicationPosts,
    canAccessDivisions as checkAccessDivisions,
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
    PermissionType,
} from '../utils/permissions';

// Расширяем интерфейс для любых фильтров
interface ModelFilters {
    [key: string]: any;
}

interface AppPermissionsContextType {
    canAccessPersonnel: (action?: string) => boolean;
    canAccessEquipment: (action?: string) => boolean;
    canAccessFacilities: (action?: string) => boolean;
    canAccessTasks: (action?: string) => boolean;
    canAccessNetworks: (action?: string) => boolean;
    canAccessCommunicationPosts: (action?: string) => boolean;
    canAccessDivisions: (action?: string) => boolean;
    canAccessMap: (action?: PermissionType) => boolean;
    canAccessStorage: (action?: PermissionType) => boolean;
    canAccessPage: (model: string, action?: PermissionType) => boolean;
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
    personnelFilters: ModelFilters | null;
    equipmentFilters: ModelFilters | null;
    facilitiesFilters: ModelFilters | null;
    networksFilters: ModelFilters | null;
    taskFilters: ModelFilters | null;
    isEditorShaWorker: boolean;   // новый флаг
}

const AppPermissionsContext = createContext<AppPermissionsContextType | null>(null);

// Возвращаем любые фильтры, а не только division/subdivision
const extractFilters = (modelFilters: any): ModelFilters | null => {
    if (!modelFilters) return null;
    return Object.keys(modelFilters).length > 0 ? modelFilters : null;
};

export const AppPermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const user = useSelector((state: RootState) => state.auth.user);
    // const loading = useSelector((state: RootState) => state.auth.loading);
    const permissions = user?.permissions;

    const canAccessMap = useCallback((action: PermissionType = 'view') => {
        return canAccessPage('Map', action);
    }, []);

    const canAccessStorage = useCallback((action: PermissionType = 'view') => {
        return canAccessPage('StorageFile', action);
    }, []);

    const canAccessPersonnel = useCallback((action?: string) => checkAccessPersonnel(action as any), []);
    const canAccessEquipment = useCallback((action?: string) => checkAccessEquipment(action as any), []);
    const canAccessFacilities = useCallback((action?: string) => checkAccessFacilities(action as any), []);
    const canAccessTasks = useCallback((action?: string) => checkAccessTasks(action as any), []);
    const canAccessNetworks = useCallback((action?: string) => checkAccessNetworks(action as any), []);
    const canAccessCommunicationPosts = useCallback((action?: string) => checkAccessCommunicationPosts(action as any), []);
    const canAccessDivisions = useCallback((action?: string) => checkAccessDivisions(action as any), []);

    const personnelFilters = useMemo(() => extractFilters(permissions?.filters?.Employee), [permissions]);
    const equipmentFilters = useMemo(() => extractFilters(permissions?.filters?.Equipment), [permissions]);
    const facilitiesFilters = useMemo(() => extractFilters(permissions?.filters?.Facility), [permissions]);
    const networksFilters = useMemo(() => extractFilters(permissions?.filters?.CommunicationNetwork), [permissions]);
    const taskFilters = useMemo(() => extractFilters(permissions?.filters?.Task), [permissions]);
    const isEditorShaWorker = permissions?.is_editor_sha_worker ?? false;

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
        canAccessMap,
        canAccessStorage,
        personnelFilters,
        equipmentFilters,
        facilitiesFilters,
        networksFilters,
        taskFilters,
        isEditorShaWorker,
    ]);

    // if (loading && !user) {
    //     return <div className="loading-skeleton">Загрузка...</div>;
    // }

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