// components/storage/hooks/useStoragePermissions.ts
import { useMemo, useState, useEffect, useRef } from 'react';
import { useAppPermissions } from './AppPermissionsContext';
import { authApi } from '../auth';
import { storageInfoApi } from './storageInfo';

export interface StoragePermissions {
    // Основные права
    canViewStorage: boolean;
    canViewPersonal: boolean;
    canViewWork: boolean;
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
    canViewAllStorage: boolean;

    // Квоты и ограничения
    storageQuota: number | null; // в байтах
    maxFileSize: number; // в байтах
    usedStorage: number;
    usagePercentage: number;
    remainingStorage: number | null;
    filesCount: number;
    foldersCount: number;

    // Состояние квоты
    hasQuota: boolean;
    isNearQuota: boolean; // >90%
    isQuotaExceeded: boolean; // >100%

    // Проверки
    canEditItem: (item: any) => boolean;
    canDeleteItem: (item: any) => boolean;
    canShareItem: (item: any) => boolean;
}

export const useStoragePermissions = (): StoragePermissions => {
    const { canEdit, hasRole, getCurrentUser } = useAppPermissions();
    const user = getCurrentUser();
    const permissions = authApi.getModulePermissions();

    const isMountedRef = useRef(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastFetchRef = useRef<number>(0);

    const [storageInfo, setStorageInfo] = useState({
        usedStorage: 0,
        filesCount: 0,
        foldersCount: 0,
        usagePercentage: 0,
        remainingStorage: null as number | null,
        isNearQuota: false,
        isQuotaExceeded: false,
        storageQuota: 0,
    });

    useEffect(() => {
        isMountedRef.current = true;

        const loadStorageInfo = async () => {
            if (!user || !isMountedRef.current) return;

            const now = Date.now();
            if (now - lastFetchRef.current < 5000) return;
            lastFetchRef.current = now;

            try {
                const info = await storageInfoApi.getStorageInfo();

                let storageQuota = info.storage_quota ?? info.quota ?? 0;
                if (storageQuota <= 0) {
                    const userRoles = user.roles || [];
                    if (userRoles.includes('admin')) storageQuota = 0;
                    else if (userRoles.includes('leader') || userRoles.includes('deputy_director')) storageQuota = 10 * 1024 * 1024 * 1024;
                    else if (userRoles.includes('exploitation_employee')) storageQuota = 5 * 1024 * 1024 * 1024;
                    else storageQuota = 2 * 1024 * 1024 * 1024;
                }

                const usedStorage = info.total_used || info.used || 0;
                const filesCount = info.files_count || 0;
                const foldersCount = info.folders_count || 0;

                const usagePercentage = storageQuota > 0 ? Math.min((usedStorage / storageQuota) * 100, 100) : 0;
                const remainingStorage = storageQuota > 0 ? Math.max(storageQuota - usedStorage, 0) : null;

                if (isMountedRef.current) {
                    setStorageInfo({
                        usedStorage,
                        filesCount,
                        foldersCount,
                        usagePercentage,
                        remainingStorage,
                        isNearQuota: usagePercentage > 90 && usagePercentage <= 100,
                        isQuotaExceeded: usagePercentage > 100,
                        storageQuota,
                    });
                }
            } catch (error) {
                console.error('Ошибка при загрузке информации о хранилище:', error);
                if (isMountedRef.current) {
                    setStorageInfo({
                        usedStorage: 0,
                        filesCount: 0,
                        foldersCount: 0,
                        usagePercentage: 0,
                        remainingStorage: null,
                        isNearQuota: false,
                        isQuotaExceeded: false,
                        storageQuota: 0,
                    });
                }
            }
        };

        loadStorageInfo();
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            if (isMountedRef.current) loadStorageInfo();
        }, 5 * 60 * 1000);

        return () => {
            isMountedRef.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user?.id]);

    return useMemo(() => {
        const basePermissions: StoragePermissions = {
            canViewStorage: false,
            canViewPersonal: false,
            canViewWork: false,
            canCreateFolders: false,
            canUploadFiles: false,
            canEditFiles: false,
            canDeleteFiles: false,
            canEditFolders: false,
            canDeleteFolders: false,
            canShareFiles: false,
            canViewTrash: false,
            canEmptyTrash: false,
            canViewAllStorage: false,
            storageQuota: null,
            maxFileSize: 50 * 1024 * 1024,
            usedStorage: storageInfo.usedStorage,
            usagePercentage: storageInfo.usagePercentage,
            remainingStorage: storageInfo.remainingStorage,
            filesCount: storageInfo.filesCount,
            foldersCount: storageInfo.foldersCount,
            hasQuota: false,
            isNearQuota: storageInfo.isNearQuota,
            isQuotaExceeded: storageInfo.isQuotaExceeded,
            canEditItem: () => false,
            canDeleteItem: () => false,
            canShareItem: () => false,
        };

        if (!user || !permissions) return basePermissions;

        const hasModelPermission = (model: string, action: string): boolean => {
            const modelPerms = permissions.models?.[model];
            return modelPerms?.includes(action) || false;
        };

        basePermissions.canViewStorage =
            hasModelPermission('StorageFolder', 'view') ||
            hasModelPermission('StorageFile', 'view');

        // Определяем, какие типы доступны пользователю
        const userRoles = user.roles || [];
        const isAdmin = userRoles.includes('admin');
        const isLeaderOrDeputy = userRoles.includes('leader') || userRoles.includes('deputy_director');
        const isHeadOfDepartment = userRoles.includes('head_of_department_1');
        const isHeadOfSection = userRoles.includes('head_of_section_1_1');
        const isEmployee = userRoles.some(r => ['hr_section_1_1', 'tech_section_1_1', 'employee_section_1_2', 'tech_section_1_3'].includes(r));

        if (isAdmin) {
            basePermissions.canViewPersonal = true;
            basePermissions.canViewWork = true;
        } else if (isLeaderOrDeputy) {
            basePermissions.canViewPersonal = true;
            basePermissions.canViewWork = false;
        } else if (isHeadOfDepartment || isHeadOfSection || isEmployee) {
            basePermissions.canViewPersonal = false;
            basePermissions.canViewWork = true;
        } else {
            basePermissions.canViewPersonal = false;
            basePermissions.canViewWork = false;
        }

        // Если пользователь не может просматривать хранилище вообще, отключаем всё
        if (!basePermissions.canViewStorage) {
            return { ...basePermissions, canViewPersonal: false, canViewWork: false };
        }

        // Права на действия (создание, редактирование, удаление) – через модели
        basePermissions.canCreateFolders = hasModelPermission('StorageFolder', 'add');
        basePermissions.canUploadFiles = hasModelPermission('StorageFile', 'add');
        basePermissions.canEditFiles = hasModelPermission('StorageFile', 'change');
        basePermissions.canDeleteFiles = hasModelPermission('StorageFile', 'delete');
        basePermissions.canEditFolders = hasModelPermission('StorageFolder', 'change');
        basePermissions.canDeleteFolders = hasModelPermission('StorageFolder', 'delete');

        basePermissions.canShareFiles = hasRole('admin') || hasRole('leader');
        basePermissions.canViewTrash = basePermissions.canViewStorage;
        basePermissions.canEmptyTrash = hasRole('admin') || hasRole('leader');
        basePermissions.canViewAllStorage = hasRole('admin') || hasRole('leader') || hasRole('deputy_director');

        const storageQuota = storageInfo.storageQuota;
        basePermissions.storageQuota = storageQuota > 0 ? storageQuota : null;
        basePermissions.hasQuota = storageQuota > 0;

        let maxFileSize = 50 * 1024 * 1024;
        if (userRoles.includes('admin')) maxFileSize = 1024 * 1024 * 1024;
        else if (userRoles.includes('leader') || userRoles.includes('deputy_director')) maxFileSize = 100 * 1024 * 1024;
        else if (userRoles.includes('exploitation_employee')) maxFileSize = 50 * 1024 * 1024;
        else maxFileSize = 20 * 1024 * 1024;
        basePermissions.maxFileSize = maxFileSize;

        if (storageQuota > 0 && storageInfo.usedStorage > storageQuota) {
            basePermissions.isQuotaExceeded = true;
            basePermissions.canUploadFiles = false;
            basePermissions.canCreateFolders = false;
        }

        // canEditItem / canDeleteItem с учётом прав и принадлежности
        basePermissions.canEditItem = (item: any) => {
            const isFolder = item && 'folder_type' in item;
            const isFile = item && 'file_type' in item;

            if (isFolder) {
                if (!basePermissions.canEditFolders) return false;
                if (item.folder_type === 'personal') return item.created_by?.id === user.id;
                if (item.folder_type === 'work') {
                    if (basePermissions.canViewAllStorage) return true;
                    return item.division?.id === user.division_info?.id || item.subdivision?.id === user.division_info?.subdivision?.id;
                }
                return false;
            }
            if (isFile) {
                if (!basePermissions.canEditFiles) return false;
                if (item.file_type === 'personal') return item.uploaded_by?.id === user.id;
                if (item.file_type === 'work') {
                    if (basePermissions.canViewAllStorage) return true;
                    return item.division?.id === user.division_info?.id || item.subdivision?.id === user.division_info?.subdivision?.id;
                }
                return false;
            }
            return false;
        };

        basePermissions.canDeleteItem = (item: any) => {
            const isFolder = item && 'folder_type' in item;
            const isFile = item && 'file_type' in item;

            if (isFolder) {
                if (!basePermissions.canDeleteFolders) return false;
                if (item.folder_type === 'personal') return item.created_by?.id === user.id;
                if (item.folder_type === 'work') {
                    if (basePermissions.canViewAllStorage) return true;
                    return item.division?.id === user.division_info?.id || item.subdivision?.id === user.division_info?.subdivision?.id;
                }
                return false;
            }
            if (isFile) {
                if (!basePermissions.canDeleteFiles) return false;
                if (item.file_type === 'personal') return item.uploaded_by?.id === user.id;
                if (item.file_type === 'work') {
                    if (basePermissions.canViewAllStorage) return true;
                    return item.division?.id === user.division_info?.id || item.subdivision?.id === user.division_info?.subdivision?.id;
                }
                return false;
            }
            return false;
        };

        basePermissions.canShareItem = (item: any) => {
            if (!basePermissions.canShareFiles) return false;
            if (!item || item.file === undefined) return false;
            if (item.file_type !== 'work') return false;
            return basePermissions.canEditItem(item);
        };

        return basePermissions;
    }, [user, permissions, canEdit, hasRole, getCurrentUser, storageInfo]);
};