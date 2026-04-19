// components/storage/FolderItem.tsx
import React, { useState } from 'react';
import { FaThumbtack } from 'react-icons/fa';
import { HiFolder, HiFolderOpen, HiOutlineDatabase } from 'react-icons/hi';
import { MdFolderShared, MdFolderSpecial } from 'react-icons/md';
import { Square, CheckSquare, Star } from 'lucide-react';
import FolderActionsMenu from './FolderActionsMenu';
import './styles/FolderItem.css';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import { StorageFolder } from '../../api/storage';

interface FolderItemProps {
    folder: StorageFolder;
    viewMode: 'list' | 'grid';
    isSelected: boolean;
    onSelect: () => void;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    permissions: StoragePermissions;
    viewType: 'personal' | 'work';
    onMoveItem: (itemId: number, targetFolderId: number | null, isFolder: boolean) => Promise<void>;
    onDeleteItem?: (folderId: number) => void;
    onRefreshFavorites?: () => void;
}

const FolderItem: React.FC<FolderItemProps> = ({
    folder,
    viewMode,
    isSelected,
    onSelect,
    onClick,
    onDragStart,
    onDragEnd,
    permissions,
    viewType,
    onMoveItem,
    onDeleteItem,
    onRefreshFavorites,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!permissions.canEditItem(folder) && !permissions.canDeleteItem(folder)) return;
        const { clientX, clientY } = e;
        setMenuPosition({ x: clientX, y: clientY });
        setShowActionsMenu(true);
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (permissions.canEditItem(folder)) {
            onDragStart(e);
        }
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getFolderIcon = () => {
        const iconSize = viewMode === 'grid' ? 64 : 24;

        if (folder.color && folder.color.startsWith('#')) {
            return (
                <div
                    className="storage-folder-icon-gradient custom-color"
                    style={{
                        background: folder.color,
                        color: getContrastColor(folder.color),
                    }}
                >
                    {getFolderIconByType(iconSize)}
                </div>
            );
        }

        if (folder.folder_type === 'personal') {
            return (
                <div className="storage-folder-icon-gradient personal">
                    <HiFolder size={iconSize} />
                </div>
            );
        }

        if (folder.folder_type === 'shared') {
            return (
                <div className="storage-folder-icon-gradient shared">
                    <MdFolderShared size={iconSize} />
                </div>
            );
        }

        if (folder.is_pinned) {
            return (
                <div className="storage-folder-icon-gradient pinned">
                    <MdFolderSpecial size={iconSize} />
                </div>
            );
        }

        if (folder.subfolders_count > 0) {
            return (
                <div className="storage-folder-icon-gradient has-subfolders">
                    <HiFolderOpen size={iconSize} />
                </div>
            );
        }

        return (
            <div className="storage-folder-icon-gradient default">
                <HiFolder size={iconSize} />
            </div>
        );
    };

    const getFolderIconByType = (size: number) => {
        if (folder.folder_type === 'shared') return <MdFolderShared size={size} />;
        if (folder.is_pinned) return <MdFolderSpecial size={size} />;
        if (folder.subfolders_count > 0) return <HiFolderOpen size={size} />;
        return <HiFolder size={size} />;
    };

    const getContrastColor = (hexColor: string) => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#1e293b' : '#ffffff';
    };

    if (viewMode === 'grid') {
        return (
            <>
                <div
                    className={`storage-folder-card ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onContextMenu={handleContextMenu}
                    draggable={permissions.canEditItem(folder)}
                    onDragStart={handleDragStart}
                    onDragEnd={onDragEnd}
                >
                    <div className="storage-folder-card-header">
                        <button
                            className="storage-folder-checkbox-button"
                            onClick={handleCheckboxClick}
                            title="Выбрать папку"
                            type="button"
                        >
                            {isSelected ? (
                                <CheckSquare size={16} className="checked" />
                            ) : (
                                <Square size={16} />
                            )}
                        </button>

                        {folder.is_pinned && (
                            <div className="storage-folder-pin-indicator" title="Закреплено">
                                <FaThumbtack size={12} />
                            </div>
                        )}
                        {folder.is_favorited && (
                            <div className="storage-folder-favorite-indicator" title="В избранном">
                                <Star size={12} />
                            </div>
                        )}
                    </div>

                    <div className="storage-folder-icon-container" onClick={onClick}>
                        {getFolderIcon()}
                    </div>

                    <div className="storage-folder-card-body">
                        <h4 className="storage-folder-title" onClick={onClick} title={folder.name}>
                            {folder.name}
                        </h4>

                        <div className="storage-folder-badges">
                            <span className="storage-folder-type-badge">
                                {folder.folder_type === 'personal' ? 'Личная' : 'Общая'}
                            </span>
                        </div>
                    </div>
                </div>

                {showActionsMenu && (
                    <FolderActionsMenu
                        folder={folder}
                        position={menuPosition}
                        onClose={() => setShowActionsMenu(false)}
                        permissions={permissions}
                        viewType={viewType}
                        onMove={async (targetId) => {
                            await onMoveItem(folder.id, targetId, true);
                            setShowActionsMenu(false);
                        }}
                        onDelete={onDeleteItem}
                        onRefreshFavorites={onRefreshFavorites}
                    />
                )}
            </>
        );
    }

    // Режим списка
    return (
        <>
            <div
                className={`storage-folder-row ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onContextMenu={handleContextMenu}
                draggable={permissions.canEditItem(folder)}
                onDragStart={handleDragStart}
                onDragEnd={onDragEnd}
            >
                <div className="storage-folder-select">
                    <button
                        className="storage-folder-checkbox-button"
                        onClick={handleCheckboxClick}
                        title="Выбрать папку"
                        type="button"
                    >
                        {isSelected ? (
                            <CheckSquare size={20} className="checked" />
                        ) : (
                            <Square size={20} />
                        )}
                    </button>
                </div>

                <div className="storage-folder-row-icon" onClick={onClick}>
                    {getFolderIcon()}
                </div>

                <div className="storage-folder-row-main" onClick={onClick}>
                    <div className="storage-folder-row-header">
                        <h4 className="storage-folder-row-title" title={folder.name}>
                            {folder.name}
                        </h4>
                        {folder.is_pinned && (
                            <span className="storage-folder-row-pin">
                                <FaThumbtack size={14} />
                            </span>
                        )}
                        {folder.is_favorited && (
                            <span className="storage-folder-row-favorite" title="В избранном">
                                <Star size={16} />
                            </span>
                        )}
                    </div>

                    <div className="storage-folder-row-meta">
                        <span className="storage-folder-row-type">
                            {folder.folder_type === 'personal' ? 'Личная папка' : 'Общая папка'}
                        </span>
                        <span className="storage-folder-separator">•</span>
                        <span className="storage-folder-row-count">
                            {folder.files_count} файлов
                        </span>
                        <span className="storage-folder-separator">•</span>
                        <span className="storage-folder-row-subfolders">
                            {folder.subfolders_count} вложенных
                        </span>
                    </div>
                </div>

                <div className="storage-folder-row-info">
                    <div className="storage-folder-row-size">
                        <HiOutlineDatabase size={14} />
                        <span>{formatBytes(folder.total_size || 0)}</span>
                    </div>
                    <div className="storage-folder-row-date">
                        {formatDate(folder.updated_at)}
                    </div>
                </div>
            </div>

            {showActionsMenu && (
                <FolderActionsMenu
                    folder={folder}
                    position={menuPosition}
                    onClose={() => setShowActionsMenu(false)}
                    permissions={permissions}
                    viewType={viewType}
                    onMove={async (targetId) => {
                        await onMoveItem(folder.id, targetId, true);
                        setShowActionsMenu(false);
                    }}
                    onDelete={onDeleteItem}
                    onRefreshFavorites={onRefreshFavorites}
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