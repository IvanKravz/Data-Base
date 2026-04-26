// components/storage/StorageSidebar.tsx
import React, { useEffect, useState } from 'react';
import './styles/StorageSidebar.css';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';

interface StorageSidebarProps {
    currentView: 'explorer' | 'recent' | 'favorites' | 'trash';
    onViewChange: (view: 'explorer' | 'recent' | 'favorites' | 'trash') => void;
    viewType: 'work' | 'personal';
    onViewTypeChange: (type: 'work' | 'personal') => void;
    permissions: StoragePermissions;
}

const StorageSidebar: React.FC<StorageSidebarProps> = ({
    currentView,
    onViewChange,
    viewType,
    onViewTypeChange,
    permissions,
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
        { id: 'explorer', icon: 'folder', label: 'Файлы' },
        { id: 'recent', icon: 'history', label: 'Недавние' },
        { id: 'favorites', icon: 'star', label: 'Избранное' },
        { id: 'trash', icon: 'trash', label: 'Корзина' },
    ];

    const getProgressBarClass = () => {
        if (storageStats.isQuotaExceeded) return 'storage-progress-critical';
        if (storageStats.isNearQuota) return 'storage-progress-warning';
        return '';
    };

    const renderRemainingStorage = () => {
        if (storageStats.storageQuota && storageStats.remainingStorage !== null) {
            return (
                <div className="storage-info-item">
                    <span className="storage-info-label"><i className="fas fa-space-shuttle"></i> Осталось:</span>
                    <span className={`storage-info-value ${storageStats.isNearQuota || storageStats.isQuotaExceeded ? 'storage-warning' : ''}`}>
                        {formatBytes(storageStats.remainingStorage)}
                    </span>
                </div>
            );
        }
        return null;
    };

    const renderStorageAlerts = () => {
        if (storageStats.isQuotaExceeded) {
            return (
                <div className="storage-alert storage-alert-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>Превышена квота хранилища! Очистите ненужные файлы.</span>
                </div>
            );
        }
        if (storageStats.isNearQuota) {
            return (
                <div className="storage-alert storage-alert-warning">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Хранилище почти заполнено ({storageStats.usagePercentage.toFixed(1)}%)</span>
                </div>
            );
        }
        return null;
    };

    const canSwitchTypes = permissions.canViewPersonal && permissions.canViewWork;

    return (
        <div className="storage-sidebar">
            <div className="storage-sidebar-header">
                <h2 className="storage-sidebar-title">Хранилище</h2>
                {canSwitchTypes && (
                    <div className="storage-view-toggle">
                        <button className={`storage-view-toggle-btn ${viewType === 'work' ? 'active' : ''}`} onClick={() => onViewTypeChange('work')}>Рабочее</button>
                        <button className={`storage-view-toggle-btn ${viewType === 'personal' ? 'active' : ''}`} onClick={() => onViewTypeChange('personal')}>Личное</button>
                    </div>
                )}
            </div>
            <div className="storage-sidebar-menu">
                <div className="storage-menu-section">
                    <h3 className="storage-menu-section-title">Навигация</h3>
                    <ul className="storage-menu-list">
                        {menuItems.map(item => {
                            if (item.id === 'trash' && !permissions.canViewTrash) return null;
                            return (
                                <li key={item.id}>
                                    <button className={`storage-menu-item ${currentView === item.id ? 'active' : ''}`} onClick={() => onViewChange(item.id as any)} disabled={!permissions.canViewStorage}>
                                        <i className={`fas fa-${item.icon}`}></i><span>{item.label}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Кнопка очистки корзины УДАЛЕНА */}

                <div className="storage-info-section">
                    <h3 className="storage-info-section-title">Хранилище</h3>
                    <div className="storage-storage-info">
                        <div className="storage-info-grid">
                            <div className="storage-info-item">
                                <span className="storage-info-label"><i className="fas fa-hdd"></i> Использовано:</span>
                                <span className="storage-info-value">{formatBytes(storageStats.usedStorage)}</span>
                            </div>
                            {storageStats.storageQuota && (
                                <div className="storage-info-item">
                                    <span className="storage-info-label"><i className="fas fa-database"></i> Всего:</span>
                                    <span className="storage-info-value">{formatBytes(storageStats.storageQuota)}</span>
                                </div>
                            )}
                            {renderRemainingStorage()}
                            <div className="storage-info-item">
                                <span className="storage-info-label"><i className="fas fa-folder"></i> Папок:</span>
                                <span className="storage-info-value">{storageStats.foldersCount}</span>
                            </div>
                            <div className="storage-info-item">
                                <span className="storage-info-label"><i className="fas fa-file"></i> Файлов:</span>
                                <span className="storage-info-value">{storageStats.filesCount}</span>
                            </div>
                        </div>
                        {storageStats.storageQuota && (
                            <div className="storage-progress-container">
                                <div className="storage-progress-labels">
                                    <span className="storage-progress-label">{storageStats.usagePercentage < 0.1 && storageStats.usagePercentage > 0 ? '<0.1%' : storageStats.usagePercentage.toFixed(1)}% использовано</span>
                                    {storageStats.remainingStorage !== null && <span className="storage-progress-label">{formatBytes(storageStats.remainingStorage)} свободно</span>}
                                </div>
                                <div className={`storage-progress-bar ${getProgressBarClass()}`}>
                                    <div className="storage-progress-fill" style={{ width: `${Math.min(storageStats.usagePercentage, 100)}%` }}></div>
                                </div>
                            </div>
                        )}
                        {renderStorageAlerts()}
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
    if (bytes < 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default StorageSidebar;