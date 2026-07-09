// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PermissionType } from '../api/utils/permissions';
import { useAppPermissions } from '../api/utils/AppPermissionsContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    model: string;
    action?: PermissionType;
    fallback?: string;
    extraCheck?: () => boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    model,
    action = 'view',
    fallback = '/access-denied',
    extraCheck
}) => {
    const location = useLocation();
    const { canAccessPage, getCurrentUser } = useAppPermissions();
    const user = getCurrentUser();

    // Если пользователь ещё не загружен – не делаем редирект, ждём загрузки
    if (!user) {
        return null;
    }

    const hasModelAccess = canAccessPage(model, action);
    const hasExtraAccess = extraCheck ? extraCheck() : true;
    const hasAccess = hasModelAccess && hasExtraAccess;

    if (!hasAccess) {
        return <Navigate to={fallback} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export const PersonnelRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="Employee" action={action}>
            {children}
        </ProtectedRoute>
    );

export const EquipmentRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="Equipment" action={action}>
            {children}
        </ProtectedRoute>
    );

export const FacilitiesRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="Facility" action={action}>
            {children}
        </ProtectedRoute>
    );

export const TasksRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="Task" action={action}>
            {children}
        </ProtectedRoute>
    );

export const NetworksRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="CommunicationNetwork" action={action}>
            {children}
        </ProtectedRoute>
    );

export const CommunicationPostsRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="CommunicationPost" action={action}>
            {children}
        </ProtectedRoute>
    );

export const DivisionsRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="Division" action={action}>
            {children}
        </ProtectedRoute>
    );

export const StorageRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="StorageFile" action={action}>
            {children}
        </ProtectedRoute>
    );

export const MapRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="Map" action={action}>
            {children}
        </ProtectedRoute>
    );

export const UsersRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="User" action={action}>
            {children}
        </ProtectedRoute>
    );

export const CabinetRoute: React.FC<{ children: React.ReactNode; action?: PermissionType }> =
    ({ children, action = 'view' }) => (
        <ProtectedRoute model="Employee" action={action}>
            {children}
        </ProtectedRoute>
    );