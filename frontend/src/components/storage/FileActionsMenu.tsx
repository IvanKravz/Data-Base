// components/storage/FileActionsMenu.tsx
import React, { useState, useEffect } from 'react';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import { storageApi } from '../../api/storage';
import './styles/FileActionsMenu.css';

interface FileActionsMenuProps {
    file: any;
    position: { x: number; y: number };
    onClose: () => void;
    permissions: StoragePermissions;
}

const FileActionsMenu: React.FC<FileActionsMenuProps> = ({
    file,
    position,
    onClose,
    permissions
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(file.name);
    const [isSharing, setIsSharing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleDownload = async () => {
        if (isDownloading) return;

        try {
            setIsDownloading(true);
            await storageApi.downloadFile(file.id);
        } catch (error) {
            console.error('Error downloading file:', error);
        } finally {
            setIsDownloading(false);
            onClose();
        }
    };

    const handleRename = async () => {
        if (isRenaming) {
            try {
                await storageApi.updateFile(file.id, { name: newName });
                file.name = newName;
                setIsRenaming(false);
                onClose();
            } catch (error) {
                console.error('Error renaming file:', error);
            }
        } else {
            setIsRenaming(true);
        }
    };

    const handleRenameCancel = () => {
        setIsRenaming(false);
        setNewName(file.name);
    };

    const handleToggleFavorite = async () => {
        if (isFavoriting) return;

        try {
            setIsFavoriting(true);
            await storageApi.toggleFavorite({ file_id: file.id });
            file.is_favorited = !file.is_favorited;
            onClose();
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsFavoriting(false);
        }
    };

    const handleTogglePin = async () => {
        try {
            await storageApi.pinFile(file.id);
            file.is_pinned = !file.is_pinned;
            onClose();
        } catch (error) {
            console.error('Error pinning file:', error);
        }
    };

    const handleMove = async () => {
        // Здесь можно открыть модальное окно для перемещения
        console.log('Move file:', file.id);
        onClose();
    };

    const handleDelete = async () => {
        if (window.confirm(`Удалить файл "${file.name}"?`)) {
            try {
                await storageApi.softDeleteFile(file.id);
                onClose();
            } catch (error) {
                console.error('Error deleting file:', error);
            }
        }
    };

    const handleShare = () => {
        setIsSharing(true);
        // Здесь можно открыть модальное окно для настройки общего доступа
        console.log('Share file:', file.id);
        onClose();
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(file.download_url);
            // Можно показать уведомление об успешном копировании
            onClose();
        } catch (error) {
            console.error('Error copying link:', error);
        }
    };

    const handleGetInfo = () => {
        console.log('File info:', file);
        onClose();
    };

    // Позиционирование меню
    const style: React.CSSProperties = {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1001,
    };

    // Если меню выходит за пределы окна, смещаем его
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            if (rect.right > windowWidth) {
                style.left = `${position.x - rect.width}px`;
            }
            if (rect.bottom > windowHeight) {
                style.top = `${position.y - rect.height}px`;
            }
        }
    }, [position]);

    return (
        <div ref={menuRef} className="storage-file-actions-menu" style={style}>
            <div className="storage-file-menu-header">
                <div className="storage-file-menu-preview">
                    <i className="fas fa-file"></i>
                </div>
                <div className="storage-file-menu-info">
                    <h4 className="storage-file-menu-title" title={file.name}>
                        {file.name}
                    </h4>
                    <div className="storage-file-menu-meta">
                        <span className="storage-file-menu-size">
                            {file.human_readable_size || formatBytes(file.size)}
                        </span>
                        <span className="storage-file-menu-date">
                            {formatDate(file.created_at)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="storage-file-menu-content">
                {isRenaming ? (
                    <div className="storage-file-rename-form">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="storage-file-rename-input"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') handleRenameCancel();
                            }}
                        />
                        <div className="storage-file-rename-actions">
                            <button
                                className="storage-file-rename-cancel"
                                onClick={handleRenameCancel}
                            >
                                Отмена
                            </button>
                            <button
                                className="storage-file-rename-save"
                                onClick={handleRename}
                                disabled={!newName.trim() || newName === file.name}
                            >
                                Сохранить
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <button
                            className="storage-file-menu-item"
                            onClick={handleDownload}
                            disabled={isDownloading}
                        >
                            <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                            <span>{isDownloading ? 'Скачивание...' : 'Скачать'}</span>
                        </button>

                        {permissions.canEditItem(file) && (
                            <button
                                className="storage-file-menu-item"
                                onClick={handleRename}
                            >
                                <i className="fas fa-edit"></i>
                                <span>Переименовать</span>
                            </button>
                        )}

                        <button
                            className="storage-file-menu-item"
                            onClick={handleToggleFavorite}
                            disabled={isFavoriting}
                        >
                            <i className={`fas ${isFavoriting ? 'fa-spinner fa-spin' : 'fa-star'}`}></i>
                            <span>
                                {isFavoriting ? 'Обработка...' :
                                    file.is_favorited ? 'Удалить из избранного' : 'Добавить в избранное'
                                }
                            </span>
                        </button>

                        <button
                            className="storage-file-menu-item"
                            onClick={handleTogglePin}
                        >
                            <i className="fas fa-thumbtack"></i>
                            <span>
                                {file.is_pinned ? 'Открепить' : 'Закрепить'}
                            </span>
                        </button>

                        {permissions.canEditItem(file) && (
                            <button
                                className="storage-file-menu-item"
                                onClick={handleMove}
                            >
                                <i className="fas fa-folder-open"></i>
                                <span>Переместить</span>
                            </button>
                        )}

                        {permissions.canShareItem(file) && (
                            <button
                                className="storage-file-menu-item"
                                onClick={handleShare}
                            >
                                <i className="fas fa-share-alt"></i>
                                <span>Поделиться</span>
                            </button>
                        )}

                        <button
                            className="storage-file-menu-item"
                            onClick={handleCopyLink}
                        >
                            <i className="fas fa-link"></i>
                            <span>Копировать ссылку</span>
                        </button>

                        <div className="storage-file-menu-divider"></div>

                        <button
                            className="storage-file-menu-item"
                            onClick={handleGetInfo}
                        >
                            <i className="fas fa-info-circle"></i>
                            <span>Свойства</span>
                        </button>

                        {permissions.canDeleteItem(file) && (
                            <button
                                className="storage-file-menu-item danger"
                                onClick={handleDelete}
                            >
                                <i className="fas fa-trash"></i>
                                <span>Удалить</span>
                            </button>
                        )}
                    </>
                )}
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

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export default FileActionsMenu;