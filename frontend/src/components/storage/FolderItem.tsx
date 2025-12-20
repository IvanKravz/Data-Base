// components/storage/FolderItem.tsx
import React, { useState } from 'react';
import {
    FaUserCircle,
    FaThumbtack,
    FaEllipsisV
} from 'react-icons/fa';
import {
    HiFolder,
    HiFolderOpen,
    HiOutlineDatabase
} from 'react-icons/hi';
import {
    MdFolderShared,
    MdFolderSpecial
} from 'react-icons/md';
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getFolderIcon = () => {
        const iconSize = viewMode === 'grid' ? 64 : 24;

        // Если у папки есть кастомный цвет, используем его
        if (folder.color && folder.color.startsWith('#')) {
            return (
                <div
                    className="storage-folder-icon-gradient custom-color"
                    style={{
                        background: folder.color,
                        color: getContrastColor(folder.color)
                    }}
                >
                    {getFolderIconByType(iconSize)}
                </div>
            );
        }

        // Иначе используем градиенты по типам
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

    // Вспомогательная функция для определения иконки по типу папки
    const getFolderIconByType = (size: number) => {
        if (folder.folder_type === 'shared') {
            return <MdFolderShared size={size} />;
        }
        if (folder.is_pinned) {
            return <MdFolderSpecial size={size} />;
        }
        if (folder.subfolders_count > 0) {
            return <HiFolderOpen size={size} />;
        }
        return <HiFolder size={size} />;
    };

    // Функция для определения контрастного цвета текста
    const getContrastColor = (hexColor: string) => {
        // Удаляем символ # если есть
        const hex = hexColor.replace('#', '');

        // Преобразуем hex в RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Рассчитываем яркость (формула для восприятия человеком)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Если цвет светлый, возвращаем темный цвет для контраста
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
                >
                    <div className="storage-folder-card-header">
                        <div className="storage-folder-select">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={onSelect}
                                className="storage-folder-checkbox"
                                title="Выбрать папку"
                            />
                        </div>

                        {folder.is_pinned && (
                            <div className="storage-folder-pin-indicator" title="Закреплено">
                                <FaThumbtack size={12} />
                            </div>
                        )}
                    </div>

                    <div className="storage-folder-icon-container" onClick={onClick}>
                        {getFolderIcon()}
                    </div>

                    <div className="storage-folder-card-body">
                        <h4
                            className="storage-folder-title"
                            onClick={onClick}
                            title={folder.name}
                        >
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
            >
                <div className="storage-folder-select">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onSelect}
                        className="storage-folder-checkbox"
                    />
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
                                <FaThumbtack size={12} />
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