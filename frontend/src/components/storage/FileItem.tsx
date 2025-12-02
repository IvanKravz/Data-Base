// components/storage/FileItem.tsx
import React, { useState } from 'react';
import FileActionsMenu from './FileActionsMenu';
import './styles/FileItem.css';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import { storageApi } from '../../api/storage';

interface FileItemProps {
    file: any;
    viewMode: 'list' | 'grid';
    isSelected: boolean;
    onSelect: () => void;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    permissions: StoragePermissions;
}

const FileItem: React.FC<FileItemProps> = ({
    file,
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
    const [isDownloading, setIsDownloading] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!permissions.canEditItem(file) && !permissions.canDeleteItem(file)) return;

        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowActionsMenu(true);
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (permissions.canEditItem(file)) {
            onDragStart(e);
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isDownloading) return;

        try {
            setIsDownloading(true);
            await storageApi.downloadFile(file.id);

            // Обновляем счетчик скачиваний локально
            file.download_count = (file.download_count || 0) + 1;
            file.last_downloaded = new Date().toISOString();
        } catch (error) {
            console.error('Error downloading file:', error);
        } finally {
            setIsDownloading(false);
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

    const getFileIcon = () => {
        const extension = file.extension?.toLowerCase() || '';

        if (file.mime_type?.startsWith('image/')) {
            return 'fas fa-image';
        }
        if (file.mime_type?.startsWith('video/')) {
            return 'fas fa-video';
        }
        if (file.mime_type?.startsWith('audio/')) {
            return 'fas fa-music';
        }
        if (file.mime_type === 'application/pdf') {
            return 'fas fa-file-pdf';
        }
        if (file.mime_type?.includes('word') || extension === 'doc' || extension === 'docx') {
            return 'fas fa-file-word';
        }
        if (file.mime_type?.includes('excel') || extension === 'xls' || extension === 'xlsx') {
            return 'fas fa-file-excel';
        }
        if (file.mime_type?.includes('powerpoint') || extension === 'ppt' || extension === 'pptx') {
            return 'fas fa-file-powerpoint';
        }
        if (file.mime_type?.includes('zip') || extension === 'zip' || extension === 'rar') {
            return 'fas fa-file-archive';
        }
        if (file.mime_type?.includes('text') || extension === 'txt') {
            return 'fas fa-file-alt';
        }
        return 'fas fa-file';
    };

    const getFileColor = () => {
        const extension = file.extension?.toLowerCase() || '';

        if (file.mime_type?.startsWith('image/')) return '#4CAF50';
        if (file.mime_type?.startsWith('video/')) return '#FF5722';
        if (file.mime_type?.startsWith('audio/')) return '#9C27B0';
        if (file.mime_type === 'application/pdf') return '#F44336';
        if (extension === 'doc' || extension === 'docx') return '#2196F3';
        if (extension === 'xls' || extension === 'xlsx') return '#4CAF50';
        if (extension === 'ppt' || extension === 'pptx') return '#FF9800';
        if (extension === 'zip' || extension === 'rar') return '#795548';
        return '#757575';
    };

    const getFileTypeLabel = () => {
        const extension = file.extension?.toUpperCase() || '';
        if (extension) {
            return `${extension} файл`;
        }

        if (file.mime_type) {
            const parts = file.mime_type.split('/');
            if (parts.length > 1) {
                return parts[1].toUpperCase();
            }
            return file.mime_type;
        }

        return 'Файл';
    };

    if (viewMode === 'grid') {
        return (
            <>
                <div
                    className={`storage-file-item storage-file-grid ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onContextMenu={handleContextMenu}
                    draggable={permissions.canEditItem(file)}
                    onDragStart={handleDragStart}
                >
                    <div className="storage-file-select">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onSelect}
                            className="storage-file-checkbox"
                            title="Выбрать файл"
                        />
                    </div>

                    <div
                        className="storage-file-icon"
                        style={{ color: getFileColor() }}
                        onClick={onClick}
                    >
                        <i className={getFileIcon()}></i>
                        {file.is_pinned && (
                            <span className="storage-file-pin-badge">
                                <i className="fas fa-thumbtack"></i>
                            </span>
                        )}
                        {file.is_favorited && (
                            <span className="storage-file-favorite-badge">
                                <i className="fas fa-star"></i>
                            </span>
                        )}
                    </div>

                    <div className="storage-file-info">
                        <h4
                            className="storage-file-name"
                            onClick={onClick}
                            title={file.name}
                        >
                            {file.name}
                        </h4>

                        <div className="storage-file-meta">
                            <span className="storage-file-type">
                                {getFileTypeLabel()}
                            </span>
                            <span className="storage-file-separator">•</span>
                            <span className="storage-file-date">
                                {formatDate(file.created_at)}
                            </span>
                        </div>

                        <div className="storage-file-stats">
                            <span className="storage-file-size">
                                <i className="fas fa-weight"></i>
                                {file.human_readable_size || formatBytes(file.size)}
                            </span>
                            {file.download_count > 0 && (
                                <>
                                    <span className="storage-file-separator">•</span>
                                    <span className="storage-file-downloads">
                                        <i className="fas fa-download"></i>
                                        {file.download_count}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {(isHovered || isSelected) && (
                        <div className="storage-file-actions">
                            <button
                                className="storage-file-action-btn storage-file-download-btn"
                                onClick={handleDownload}
                                title="Скачать"
                                disabled={isDownloading}
                            >
                                <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                            </button>
                            <button
                                className="storage-file-action-btn storage-file-more-btn"
                                onClick={() => setShowActionsMenu(true)}
                                title="Действия"
                            >
                                <i className="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    )}
                </div>

                {showActionsMenu && (
                    <FileActionsMenu
                        file={file}
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
                className={`storage-file-item storage-file-list ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onContextMenu={handleContextMenu}
                draggable={permissions.canEditItem(file)}
                onDragStart={handleDragStart}
            >
                <div className="storage-file-select">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onSelect}
                        className="storage-file-checkbox"
                    />
                </div>

                <div
                    className="storage-file-icon-list"
                    style={{ color: getFileColor() }}
                    onClick={onClick}
                >
                    <i className={getFileIcon()}></i>
                </div>

                <div className="storage-file-main" onClick={onClick}>
                    <h4 className="storage-file-name-list" title={file.name}>
                        {file.name}
                        {file.is_pinned && (
                            <span className="storage-file-pin-indicator">
                                <i className="fas fa-thumbtack"></i>
                            </span>
                        )}
                        {file.is_favorited && (
                            <span className="storage-file-favorite-indicator">
                                <i className="fas fa-star"></i>
                            </span>
                        )}
                    </h4>

                    <div className="storage-file-details">
                        <span className="storage-file-type-list">
                            {getFileTypeLabel()}
                        </span>
                        <span className="storage-file-separator">•</span>
                        <span className="storage-file-extension">
                            {file.extension?.toUpperCase() || 'N/A'}
                        </span>
                        <span className="storage-file-separator">•</span>
                        <span className="storage-file-owner">
                            {file.uploaded_by?.username || 'Неизвестно'}
                        </span>
                    </div>
                </div>

                <div className="storage-file-secondary">
                    <span className="storage-file-size-list">
                        {file.human_readable_size || formatBytes(file.size)}
                    </span>
                    <span className="storage-file-date-list">
                        {formatDate(file.updated_at)}
                    </span>
                    <span className="storage-file-modified">
                        Изменен: {formatDate(file.updated_at)}
                    </span>
                    {file.download_count > 0 && (
                        <span className="storage-file-downloads-list">
                            <i className="fas fa-download"></i>
                            {file.download_count}
                        </span>
                    )}
                </div>

                {(isHovered || isSelected) && (
                    <div className="storage-file-actions-list">
                        <button
                            className="storage-file-action-btn storage-file-download-btn"
                            onClick={handleDownload}
                            title="Скачать"
                            disabled={isDownloading}
                        >
                            <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                        </button>
                        <button
                            className="storage-file-action-btn storage-file-more-btn"
                            onClick={() => setShowActionsMenu(true)}
                            title="Действия"
                        >
                            <i className="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                )}
            </div>

            {showActionsMenu && (
                <FileActionsMenu
                    file={file}
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

export default FileItem;