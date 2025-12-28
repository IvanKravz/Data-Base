// components/storage/StorageSidebar.tsx
import React, { useEffect, useState } from 'react';
import './styles/StorageSidebar.css';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';

interface StorageSidebarProps {
    currentView: 'explorer' | 'recent' | 'favorites' | 'trash'; // Убрал 'statistics'
    onViewChange: (view: 'explorer' | 'recent' | 'favorites' | 'trash') => void; // Убрал 'statistics'
    viewType: 'work' | 'personal';
    onViewTypeChange: (type: 'work' | 'personal') => void;
    permissions: StoragePermissions;
    onEmptyTrash?: () => void;
}

const StorageSidebar: React.FC<StorageSidebarProps> = ({
    currentView,
    onViewChange,
    viewType,
    onViewTypeChange,
    permissions,
    onEmptyTrash
}) => {
    const [storageStats, setStorageStats] = useState({
        usagePercentage: 0,
        usedStorage: 0,
        remainingStorage: null as number | null,
        isNearQuota: false,
        isQuotaExceeded: false,
        filesCount: 0,
        foldersCount: 0,
        storageQuota: null as number | null,
    });

    // Обновляем статистику при изменении permissions
    useEffect(() => {
        setStorageStats({
            usagePercentage: permissions.usagePercentage || 0,
            usedStorage: permissions.usedStorage || 0,
            remainingStorage: permissions.remainingStorage,
            isNearQuota: permissions.isNearQuota || false,
            isQuotaExceeded: permissions.isQuotaExceeded || false,
            filesCount: permissions.filesCount || 0,
            foldersCount: permissions.foldersCount || 0,
            storageQuota: permissions.storageQuota,
        });
    }, [permissions]);

    const menuItems = [
        { id: 'explorer', icon: 'folder', label: 'Мои файлы' },
        { id: 'recent', icon: 'history', label: 'Недавние' },
        { id: 'favorites', icon: 'star', label: 'Избранное' },
        // Убрал пункт 'statistics'
        { id: 'trash', icon: 'trash', label: 'Корзина' },
    ];

    // Убрал весь блок quickFolders

    // Функция для определения класса прогресс-бара
    const getProgressBarClass = () => {
        if (storageStats.isQuotaExceeded) return 'storage-progress-critical';
        if (storageStats.isNearQuota) return 'storage-progress-warning';
        return 'storage-progress-normal';
    };

    // Функция для отображения оставшегося места
    const renderRemainingStorage = () => {
        if (storageStats.storageQuota && storageStats.remainingStorage !== null) {
            return (
                <div className="storage-info-item">
                    <span className="storage-info-label">
                        <div className="fas fa-space-shuttle"></div> Осталось:
                    </span>
                    <span className={`storage-info-value ${storageStats.isNearQuota || storageStats.isQuotaExceeded ? 'storage-warning' : ''
                        }`}>
                        {formatBytes(storageStats.remainingStorage)}
                    </span>
                </div>
            );
        }
        return null;
    };
    
    // Функция для отображения предупреждений
    const renderStorageAlerts = () => {
        if (storageStats.isQuotaExceeded) {
            return (
                <div className="storage-alert storage-alert-error">
                    <div className="fas fa-exclamation-circle"></div>
                    <span>Превышена квота хранилища! Очистите ненужные файлы.</span>
                </div>
            );
        }

        if (storageStats.isNearQuota) {
            return (
                <div className="storage-alert storage-alert-warning">
                    <div className="fas fa-exclamation-triangle"></div>
                    <span>Хранилище почти заполнено ({storageStats.usagePercentage.toFixed(1)}%)</span>
                </div>
            );
        }

        return null;
    };


    return (
        <div className="storage-sidebar">
            <div className="storage-sidebar-header">
                <h2 className="storage-sidebar-title">Хранилище</h2>
                <div className="storage-view-toggle">
                    <button
                        className={`storage-view-toggle-btn ${viewType === 'work' ? 'active' : ''}`}
                        onClick={() => onViewTypeChange('work')}
                        disabled={!permissions.canViewStorage}
                    >
                        Рабочее
                    </button>
                    <button
                        className={`storage-view-toggle-btn ${viewType === 'personal' ? 'active' : ''}`}
                        onClick={() => onViewTypeChange('personal')}
                        disabled={!permissions.canViewStorage}
                    >
                        Личное
                    </button>
                </div>
            </div>

            <div className="storage-sidebar-menu">
                <div className="storage-menu-section">
                    <h3 className="storage-menu-section-title">Навигация</h3>
                    <ul className="storage-menu-list">
                        {menuItems.map(item => {
                            if (item.id === 'trash' && !permissions.canViewTrash) return null;
                            // Убрал проверку для 'statistics'

                            return (
                                <li key={item.id}>
                                    <button
                                        className={`storage-menu-item ${currentView === item.id ? 'active' : ''}`}
                                        onClick={() => onViewChange(item.id as any)}
                                        disabled={!permissions.canViewStorage}
                                    >
                                        <i className={`fas fa-${item.icon}`}></i>
                                        <span>{item.label}</span>
                                        {item.id === 'trash' && (
                                            <span className="storage-menu-badge">3</span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Убрал весь раздел "Быстрый доступ" */}

                {currentView === 'trash' && permissions.canEmptyTrash && (
                    <div className="storage-trash-actions">
                        <button
                            className="storage-empty-trash-btn"
                            onClick={onEmptyTrash}
                            disabled={!permissions.canViewTrash}
                        >
                            <i className="fas fa-broom"></i>
                            Очистить корзину
                        </button>
                    </div>
                )}

                {/* Блок информации о хранилище */}
                <div className="storage-info-section">
                    <h3 className="storage-info-section-title">Хранилище</h3>
                    <div className="storage-storage-info">
                        <div className="storage-info-grid">
                            <div className="storage-info-item">
                                <span className="storage-info-label">
                                    <div className="fas fa-hdd"></div> Использовано:
                                </span>
                                <span className="storage-info-value">
                                    {formatBytes(storageStats.usedStorage)}
                                </span>
                            </div>

                            {storageStats.storageQuota && (
                                <div className="storage-info-item">
                                    <span className="storage-info-label">
                                        <div className="fas fa-database"></div> Всего:
                                    </span>
                                    <span className="storage-info-value">
                                        {formatBytes(storageStats.storageQuota)}
                                    </span>
                                </div>
                            )}

                            {renderRemainingStorage()}

                            <div className="storage-info-item">
                                <span className="storage-info-label">
                                    <div className="fas fa-folder"></div> Папок:
                                </span>
                                <span className="storage-info-value">
                                    {storageStats.foldersCount}
                                </span>
                            </div>

                            <div className="storage-info-item">
                                <span className="storage-info-label">
                                    <div className="fas fa-file"></div> Файлов:
                                </span>
                                <span className="storage-info-value">
                                    {storageStats.filesCount}
                                </span>
                            </div>
                        </div>

                        {/* Прогресс-бар показываем только если есть квота */}
                        {storageStats.storageQuota && (
                            <div className="storage-progress-container">
                                <div className="storage-progress-labels">
                                    <span className="storage-progress-label">
                                        {storageStats.usagePercentage < 0.1 && storageStats.usagePercentage > 0
                                            ? '<0.1%'
                                            : storageStats.usagePercentage.toFixed(1)}% использовано
                                    </span>
                                    {storageStats.remainingStorage !== null && (
                                        <span className="storage-progress-label">
                                            {formatBytes(storageStats.remainingStorage)} свободно
                                        </span>
                                    )}
                                </div>
                                <div className={`storage-progress-bar ${getProgressBarClass()}`}>
                                    <div
                                        className="storage-progress-fill"
                                        style={{
                                            width: `${Math.min(storageStats.usagePercentage, 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Предупреждения */}
                        {renderStorageAlerts()}

                        {/* Информация о максимальном размере файла */}
                        <div className="storage-max-size-info">
                            <i className="fas fa-info-circle"></i>
                            <span>Макс. размер файла: {formatBytes(permissions.maxFileSize)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
    if (bytes < 0) return '-'; // или можно вернуть 0 B

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default StorageSidebar;