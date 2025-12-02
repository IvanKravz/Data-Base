// components/storage/FolderItem.tsx
import React, { useState } from 'react';
import FolderActionsMenu from './FolderActionsMenu';
import './styles/FolderItem.css';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';

interface FolderItemProps {
    folder: any;
    viewMode: 'list' | 'grid';
    isSelected: boolean;
    onSelect: () => void;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    permissions: StoragePermissions;
}

const FolderItem: React.FC<FolderItemProps> = ({
    folder,
    viewMode,
    isSelected,
    onSelect,
    onClick,
    onDragStart,
    permissions
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!permissions.canEditItem(folder) && !permissions.canDeleteItem(folder)) return;

        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowActionsMenu(true);
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (permissions.canEditItem(folder)) {
            onDragStart(e);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getFolderIcon = () => {
        if (folder.folder_type === 'personal') {
            return 'fas fa-user-circle';
        }
        if (folder.is_pinned) {
            return 'fas fa-thumbtack';
        }
        if (folder.subfolders_count > 0) {
            return 'fas fa-folder-open';
        }
        return 'fas fa-folder';
    };

    const getFolderColor = () => {
        if (folder.color && folder.color.startsWith('#')) {
            return folder.color;
        }
        return folder.folder_type === 'personal' ? '#4CAF50' : '#FF9800';
    };

    if (viewMode === 'grid') {
        return (
            <>
                <div
                    className={`storage-folder-item storage-folder-grid ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onContextMenu={handleContextMenu}
                    draggable={permissions.canEditItem(folder)}
                    onDragStart={handleDragStart}
                >
                    <div className="storage-folder-select">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onSelect}
                            className="storage-folder-checkbox"
                            title="Выбрать папку"
                        />
                    </div>

                    <div
                        className="storage-folder-icon"
                        onClick={onClick}
                        style={{ color: getFolderColor() }}
                    >
                        <i className={getFolderIcon()}></i>
                        {folder.is_pinned && (
                            <span className="storage-folder-pin-badge">
                                <i className="fas fa-thumbtack"></i>
                            </span>
                        )}
                    </div>

                    <div className="storage-folder-info">
                        <h4
                            className="storage-folder-name"
                            onClick={onClick}
                            title={folder.name}
                        >
                            {folder.name}
                        </h4>

                        <div className="storage-folder-meta">
                            <span className="storage-folder-count">
                                {folder.files_count} файлов
                            </span>
                            <span className="storage-folder-separator">•</span>
                            <span className="storage-folder-date">
                                {formatDate(folder.created_at)}
                            </span>
                        </div>

                        <div className="storage-folder-stats">
                            <span className="storage-folder-size">
                                <i className="fas fa-database"></i>
                                {formatBytes(folder.total_size || 0)}
                            </span>
                        </div>
                    </div>

                    {(isHovered || isSelected) && (
                        <div className="storage-folder-actions">
                            <button
                                className="storage-folder-action-btn"
                                onClick={() => setShowActionsMenu(true)}
                                title="Действия"
                            >
                                <i className="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    )}
                </div>

                {showActionsMenu && (
                    <FolderActionsMenu
                        folder={folder}
                        position={menuPosition}
                        onClose={() => setShowActionsMenu(false)}
                        permissions={permissions}
                    />
                )}
            </>
        );
    }

    // Режим списка
    return (
        <>
            <div
                className={`storage-folder-item storage-folder-list ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onContextMenu={handleContextMenu}
                draggable={permissions.canEditItem(folder)}
                onDragStart={handleDragStart}
            >
                <div className="storage-folder-select">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onSelect}
                        className="storage-folder-checkbox"
                    />
                </div>

                <div
                    className="storage-folder-icon-list"
                    onClick={onClick}
                    style={{ color: getFolderColor() }}
                >
                    <i className={getFolderIcon()}></i>
                </div>

                <div className="storage-folder-main" onClick={onClick}>
                    <h4 className="storage-folder-name-list" title={folder.name}>
                        {folder.name}
                        {folder.is_pinned && (
                            <span className="storage-folder-pin-indicator">
                                <i className="fas fa-thumbtack"></i>
                            </span>
                        )}
                    </h4>

                    <div className="storage-folder-details">
                        <span className="storage-folder-type">
                            {folder.folder_type === 'personal' ? 'Личная' : 'Рабочая'}
                        </span>
                        <span className="storage-folder-separator">•</span>
                        <span className="storage-folder-files">
                            {folder.files_count} файлов
                        </span>
                        <span className="storage-folder-separator">•</span>
                        <span className="storage-folder-folders">
                            {folder.subfolders_count} папок
                        </span>
                    </div>
                </div>

                <div className="storage-folder-secondary">
                    <span className="storage-folder-size-list">
                        {formatBytes(folder.total_size || 0)}
                    </span>
                    <span className="storage-folder-date-list">
                        {formatDate(folder.updated_at)}
                    </span>
                    <span className="storage-folder-owner">
                        {folder.created_by?.username || 'Неизвестно'}
                    </span>
                </div>

                {(isHovered || isSelected) && (
                    <div className="storage-folder-actions-list">
                        <button
                            className="storage-folder-action-btn"
                            onClick={() => setShowActionsMenu(true)}
                            title="Действия"
                        >
                            <i className="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                )}
            </div>

            {showActionsMenu && (
                <FolderActionsMenu
                    folder={folder}
                    position={menuPosition}
                    onClose={() => setShowActionsMenu(false)}
                    permissions={permissions}
                />
            )}
        </>
    );
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FolderItem;