// components/storage/hooks/useStoragePermissions.ts
import { useMemo } from 'react';
import { useAppPermissions } from './AppPermissionsContext';
import { authApi } from '../auth';

export interface StoragePermissions {
    // Основные права
    canViewStorage: boolean;
    canCreateFolders: boolean;
    canUploadFiles: boolean;
    canEditFiles: boolean;
    canDeleteFiles: boolean;
    canEditFolders: boolean;
    canDeleteFolders: boolean;

    // Дополнительные права
    canShareFiles: boolean;
    canViewTrash: boolean;
    canEmptyTrash: boolean;
    canViewStatistics: boolean;
    canViewAllStorage: boolean;

    // Квоты и ограничения
    storageQuota: number | null; // в байтах
    maxFileSize: number; // в байтах
    usedStorage: number; // будет загружаться из API

    // Проверки
    canEditItem: (item: any) => boolean;
    canDeleteItem: (item: any) => boolean;
    canShareItem: (item: any) => boolean;
}

export const useStoragePermissions = (): StoragePermissions => {
    const { canEdit, hasRole, getCurrentUser } = useAppPermissions();
    const user = getCurrentUser();
    const permissions = authApi.getModulePermissions();

    return useMemo(() => {
        const basePermissions: StoragePermissions = {
            canViewStorage: false,
            canCreateFolders: false,
            canUploadFiles: false,
            canEditFiles: false,
            canDeleteFiles: false,
            canEditFolders: false,
            canDeleteFolders: false,
            canShareFiles: false,
            canViewTrash: false,
            canEmptyTrash: false,
            canViewStatistics: false,
            canViewAllStorage: false,
            storageQuota: null,
            maxFileSize: 50 * 1024 * 1024, // 50MB по умолчанию
            usedStorage: 0,
            canEditItem: () => false,
            canDeleteItem: () => false,
            canShareItem: () => false,
        };

        if (!user || !permissions) return basePermissions;

        // Проверяем права через модель
        const hasModelPermission = (model: string, action: string): boolean => {
            const modelPerms = permissions.models[model];
            return modelPerms?.includes(action) || false;
        };

        // Базовые права
        basePermissions.canViewStorage =
            hasModelPermission('StorageFolder', 'view') ||
            hasModelPermission('StorageFile', 'view');

        basePermissions.canCreateFolders = hasModelPermission('StorageFolder', 'add');
        basePermissions.canUploadFiles = hasModelPermission('StorageFile', 'add');
        basePermissions.canEditFiles = hasModelPermission('StorageFile', 'change');
        basePermissions.canDeleteFiles = hasModelPermission('StorageFile', 'delete');
        basePermissions.canEditFolders = hasModelPermission('StorageFolder', 'change');
        basePermissions.canDeleteFolders = hasModelPermission('StorageFolder', 'delete');

        // Дополнительные права
        basePermissions.canShareFiles = hasRole('admin') || hasRole('leader');
        basePermissions.canViewTrash = basePermissions.canViewStorage;
        basePermissions.canEmptyTrash = hasRole('admin') || hasRole('leader');
        basePermissions.canViewStatistics = basePermissions.canViewStorage;

        // Права на просмотр всего хранилища
        basePermissions.canViewAllStorage =
            hasRole('admin') ||
            hasRole('leader') ||
            hasRole('deputy_director');

        // Получаем квоты из роли
        const userRoles = user.roles || [];
        let maxQuota = 0;
        let maxFileSize = 50 * 1024 * 1024; // 50MB по умолчанию

        // В реальности это должно приходить с бэкенда
        if (userRoles.includes('admin')) {
            maxQuota = 0; // Без лимита
            maxFileSize = 1024 * 1024 * 1024; // 1GB
        } else if (userRoles.includes('leader') || userRoles.includes('deputy_director')) {
            maxQuota = 10 * 1024 * 1024 * 1024; // 10GB
            maxFileSize = 100 * 1024 * 1024; // 100MB
        } else if (userRoles.includes('exploitation_employee')) {
            maxQuota = 5 * 1024 * 1024 * 1024; // 5GB
            maxFileSize = 50 * 1024 * 1024; // 50MB
        } else {
            maxQuota = 2 * 1024 * 1024 * 1024; // 2GB
            maxFileSize = 20 * 1024 * 1024; // 20MB
        }

        basePermissions.storageQuota = maxQuota;
        basePermissions.maxFileSize = maxFileSize;

        // Функции проверки
        basePermissions.canEditItem = (item: any) => {
            if (!basePermissions.canEditFiles && !basePermissions.canEditFolders) return false;

            if (item.hasOwnProperty('file')) {
                // Это файл
                if (!basePermissions.canEditFiles) return false;

                // Для личных файлов - только владелец
                if (item.file_type === 'personal') {
                    return item.uploaded_by?.id === user.id;
                }

                // Для рабочих файлов - проверка подразделения
                if (!basePermissions.canViewAllStorage && item.division?.id !== user.division_info?.id) {
                    return false;
                }

                return basePermissions.canEditFiles;
            } else {
                // Это папка
                if (!basePermissions.canEditFolders) return false;

                // Для личных папок - только владелец
                if (item.folder_type === 'personal') {
                    return item.created_by?.id === user.id;
                }

                // Для рабочих папок - проверка подразделения
                if (!basePermissions.canViewAllStorage && item.division?.id !== user.division_info?.id) {
                    return false;
                }

                return basePermissions.canEditFolders;
            }
        };

        basePermissions.canDeleteItem = (item: any) => {
            if (!basePermissions.canDeleteFiles && !basePermissions.canDeleteFolders) return false;

            if (item.hasOwnProperty('file')) {
                // Это файл
                if (!basePermissions.canDeleteFiles) return false;

                // Для личных файлов - только владелец
                if (item.file_type === 'personal') {
                    return item.uploaded_by?.id === user.id;
                }

                // Для рабочих файлов - проверка подразделения
                if (!basePermissions.canViewAllStorage && item.division?.id !== user.division_info?.id) {
                    return false;
                }

                return basePermissions.canDeleteFiles;
            } else {
                // Это папка
                if (!basePermissions.canDeleteFolders) return false;

                // Для личных папок - только владелец
                if (item.folder_type === 'personal') {
                    return item.created_by?.id === user.id;
                }

                // Для рабочих папок - проверка подразделения
                if (!basePermissions.canViewAllStorage && item.division?.id !== user.division_info?.id) {
                    return false;
                }

                return basePermissions.canDeleteFolders;
            }
        };

        basePermissions.canShareItem = (item: any) => {
            if (!basePermissions.canShareFiles) return false;

            // Только для файлов
            if (!item.hasOwnProperty('file')) return false;

            // Только рабочие файлы можно делиться
            if (item.file_type !== 'work') return false;

            // Только если пользователь может редактировать файл
            return basePermissions.canEditItem(item);
        };

        return basePermissions;

    }, [user, permissions, canEdit, hasRole, getCurrentUser]);
};