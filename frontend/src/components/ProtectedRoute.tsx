// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PermissionType, canAccessPage } from '../api/utils/permissions';

interface ProtectedRouteProps {
    children: React.ReactNode;
    model: string;
    action?: PermissionType;
    fallback?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    model,
    action = 'view',
    fallback = '/access-denied'
}) => {
    const location = useLocation();

    const hasAccess = canAccessPage(model, action);

    if (!hasAccess) {
        return <Navigate to={fallback} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

// Специализированные защищенные маршруты для конкретных страниц
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