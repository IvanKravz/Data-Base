// components/storage/hooks/useStoragePermissions.ts
import { useMemo, useState, useEffect, useRef } from 'react';
import { useAppPermissions } from './AppPermissionsContext';
import { authApi } from '../auth';
import { storageInfoApi } from './storageInfo';

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

    // Используем useRef для хранения состояния монтажа и таймера
    const isMountedRef = useRef(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastFetchRef = useRef<number>(0);

    // Состояние для информации о хранилище
    const [storageInfo, setStorageInfo] = useState({
        usedStorage: 0,
        filesCount: 0,
        foldersCount: 0,
        usagePercentage: 0,
        remainingStorage: null as number | null,
        isNearQuota: false,
        isQuotaExceeded: false,
        storageQuota: 0, // Добавлено: храним квоту
    });

    // Загружаем информацию о хранилище
    useEffect(() => {
        isMountedRef.current = true;

        const loadStorageInfo = async () => {
            if (!user || !isMountedRef.current) return;

            // Защита от слишком частых запросов (не чаще чем раз в 5 секунд)
            const now = Date.now();
            if (now - lastFetchRef.current < 5000) {
                return;
            }

            lastFetchRef.current = now;

            try {
                // Получаем информацию о хранилище с сервера
                const info = await storageInfoApi.getStorageInfo();

                // Получаем квоту из API или ролей
                let storageQuota = info.storage_quota ?? info.quota ?? 0;

                // Если квота из API равна 0 или не задана, используем роли
                if (storageQuota <= 0) {
                    const userRoles = user.roles || [];
                    if (userRoles.includes('admin')) {
                        storageQuota = 0; // Без лимита
                    } else if (userRoles.includes('leader') || userRoles.includes('deputy_director')) {
                        storageQuota = 10 * 1024 * 1024 * 1024; // 10GB
                    } else if (userRoles.includes('exploitation_employee')) {
                        storageQuota = 5 * 1024 * 1024 * 1024; // 5GB
                    } else {
                        storageQuota = 2 * 1024 * 1024 * 1024; // 2GB
                    }
                }

                const usedStorage = info.total_used || info.used || 0;
                const filesCount = info.files_count || 0;
                const foldersCount = info.folders_count || 0;
                
                // Рассчитываем проценты и оставшееся место
                const usagePercentage = storageQuota > 0
                    ? Math.min((usedStorage / storageQuota) * 100, 100)
                    : 0;
                const remainingStorage = storageQuota > 0
                    ? Math.max(storageQuota - usedStorage, 0)
                    : null;

                if (isMountedRef.current) {
                    setStorageInfo({
                        usedStorage,
                        filesCount,
                        foldersCount,
                        usagePercentage,
                        remainingStorage,
                        isNearQuota: usagePercentage > 90 && usagePercentage <= 100,
                        isQuotaExceeded: usagePercentage > 100,
                        storageQuota, // Сохраняем квоту
                    });
                }

            } catch (error) {
                console.error('Ошибка при загрузке информации о хранилище:', error);
                // Используем значения по умолчанию при ошибке
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

        // Загружаем сразу
        loadStorageInfo();

        // Устанавливаем интервал для обновления каждые 5 минут
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
            if (isMountedRef.current) {
                loadStorageInfo();
            }
        }, 5 * 60 * 1000); // 5 минут

        return () => {
            isMountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [user?.id]);

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

        // Проверяем права через модель
        const hasModelPermission = (model: string, action: string): boolean => {
            const modelPerms = permissions.models?.[model];
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

        // Используем квоту из storageInfo (из API или ролей)
        const storageQuota = storageInfo.storageQuota;
        basePermissions.storageQuota = storageQuota > 0 ? storageQuota : null;
        basePermissions.hasQuota = storageQuota > 0;

        // Получаем maxFileSize из ролей пользователя
        const userRoles = user.roles || [];
        let maxFileSize = 50 * 1024 * 1024; // 50MB по умолчанию

        if (userRoles.includes('admin')) {
            maxFileSize = 1024 * 1024 * 1024; // 1GB
        } else if (userRoles.includes('leader') || userRoles.includes('deputy_director')) {
            maxFileSize = 100 * 1024 * 1024; // 100MB
        } else if (userRoles.includes('exploitation_employee')) {
            maxFileSize = 50 * 1024 * 1024; // 50MB
        } else {
            maxFileSize = 20 * 1024 * 1024; // 20MB
        }

        basePermissions.maxFileSize = maxFileSize;

        // Проверяем, превышена ли квота
        if (storageQuota > 0 && storageInfo.usedStorage > storageQuota) {
            basePermissions.isQuotaExceeded = true;
            // Если превышена квота, запрещаем загрузку файлов
            basePermissions.canUploadFiles = false;
            basePermissions.canCreateFolders = false;
        }

        // Функции проверки доступа к элементам
        basePermissions.canEditItem = (item: any) => {
            if (!basePermissions.canEditFiles && !basePermissions.canEditFolders) return false;

            if (item && item.file !== undefined) {
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

            if (item && item.file !== undefined) {
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
            if (!item || item.file === undefined) return false;

            // Только рабочие файлы можно делиться
            if (item.file_type !== 'work') return false;

            // Только если пользователь может редактировать файл
            return basePermissions.canEditItem(item);
        };

        return basePermissions;

    }, [user, permissions, canEdit, hasRole, getCurrentUser, storageInfo]);
};