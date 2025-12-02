// components/storage/StorageSidebar.tsx
import React from 'react';
import './styles/StorageSidebar.css';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';

interface StorageSidebarProps {
    currentView: 'explorer' | 'recent' | 'favorites' | 'statistics' | 'trash';
    onViewChange: (view: 'explorer' | 'recent' | 'favorites' | 'statistics' | 'trash') => void;
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
    const menuItems = [
        { id: 'explorer', icon: 'folder', label: 'Мои файлы' },
        { id: 'recent', icon: 'history', label: 'Недавние' },
        { id: 'favorites', icon: 'star', label: 'Избранное' },
        { id: 'statistics', icon: 'chart-bar', label: 'Статистика' },
        { id: 'trash', icon: 'trash', label: 'Корзина' },
    ];

    const quickFolders = [
        { id: 'root', icon: 'home', label: 'Главная', count: 0 },
        { id: 'shared', icon: 'users', label: 'Общий доступ', count: 0 },
        { id: 'documents', icon: 'file-alt', label: 'Документы', count: 0 },
        { id: 'images', icon: 'image', label: 'Изображения', count: 0 },
        { id: 'videos', icon: 'video', label: 'Видео', count: 0 },
        { id: 'music', icon: 'music', label: 'Музыка', count: 0 },
    ];

    return (
        <div className="storage-sidebar">
            <div className="storage-sidebar-header">
                <h2 className="storage-sidebar-title">Хранилище</h2>
                <div className="storage-view-toggle">
                    <button
                        className={`storage-view-toggle-btn ${viewType === 'work' ? 'active' : ''}`}
                        onClick={() => onViewTypeChange('work')}
                    >
                        Рабочее
                    </button>
                    <button
                        className={`storage-view-toggle-btn ${viewType === 'personal' ? 'active' : ''}`}
                        onClick={() => onViewTypeChange('personal')}
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
                            if (item.id === 'statistics' && !permissions.canViewStatistics) return null;

                            return (
                                <li key={item.id}>
                                    <button
                                        className={`storage-menu-item ${currentView === item.id ? 'active' : ''}`}
                                        onClick={() => onViewChange(item.id as any)}
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

                <div className="storage-menu-section">
                    <h3 className="storage-menu-section-title">Быстрый доступ</h3>
                    <ul className="storage-menu-list">
                        {quickFolders.map(folder => (
                            <li key={folder.id}>
                                <button className="storage-menu-item">
                                    <i className={`fas fa-${folder.icon}`}></i>
                                    <span>{folder.label}</span>
                                    {folder.count > 0 && (
                                        <span className="storage-menu-badge">{folder.count}</span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {currentView === 'trash' && permissions.canEmptyTrash && (
                    <div className="storage-trash-actions">
                        <button
                            className="storage-empty-trash-btn"
                            onClick={onEmptyTrash}
                        >
                            <i className="fas fa-broom"></i>
                            Очистить корзину
                        </button>
                    </div>
                )}

                <div className="storage-storage-info">
                    <div className="storage-info-item">
                        <span className="storage-info-label">Использовано:</span>
                        <span className="storage-info-value">
                            {formatBytes(permissions.usedStorage || 0)}
                        </span>
                    </div>
                    {permissions.storageQuota && (
                        <div className="storage-info-item">
                            <span className="storage-info-label">Всего:</span>
                            <span className="storage-info-value">
                                {formatBytes(permissions.storageQuota)}
                            </span>
                        </div>
                    )}
                    <div className="storage-progress-bar">
                        <div
                            className="storage-progress-fill"
                            style={{
                                width: `${permissions.usedStorage && permissions.storageQuota
                                    ? (permissions.usedStorage / permissions.storageQuota) * 100
                                    : 0}%`
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="storage-sidebar-footer">
                <div className="storage-user-info">
                    <div className="storage-user-avatar">
                        <i className="fas fa-user"></i>
                    </div>
                    <div className="storage-user-details">
                        <span className="storage-user-name">Алексей Петров</span>
                        <span className="storage-user-role">Администратор</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default StorageSidebar;