// components/storage/FileActionsMenu.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import { storageApi } from '../../api/storage';
import './styles/FileActionsMenu.css';

interface FileActionsMenuProps {
    file: any;
    position: { x: number; y: number };
    onClose: () => void;
    permissions: StoragePermissions;
}

const INITIAL_MENU_STYLE: React.CSSProperties = {
    position: 'fixed',
    left: '-9999px',
    top: '-9999px',
    opacity: 0,
    zIndex: 1001,
};

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
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>(INITIAL_MENU_STYLE);
    const [isPositioned, setIsPositioned] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    // Эффект для корректировки позиции меню
    useEffect(() => {
        if (!menuRef.current) return;

        const calculatePosition = () => {
            const rect = menuRef.current!.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Начальная позиция
            let adjustedX = position.x;
            let adjustedY = position.y;

            // Проверка выхода за правую границу
            if (adjustedX + rect.width > windowWidth) {
                adjustedX = position.x - rect.width;
            }

            // Проверка выхода за нижнюю границу
            if (adjustedY + rect.height > windowHeight) {
                adjustedY = position.y - rect.height;
            }

            // Убедимся, что меню не выходит за левую и верхнюю границы
            adjustedX = Math.max(10, Math.min(adjustedX, windowWidth - rect.width - 10));
            adjustedY = Math.max(10, Math.min(adjustedY, windowHeight - rect.height - 10));

            // Применяем позицию сразу без промежуточных состояний
            setMenuStyle({
                position: 'fixed',
                left: `${adjustedX}px`,
                top: `${adjustedY}px`,
                zIndex: 1001,
                opacity: 1, // Сразу показываем
            });

            setIsPositioned(true);
        };

        // Используем requestAnimationFrame для синхронизации с браузером
        requestAnimationFrame(() => {
            calculatePosition();
        });
    }, [position]);

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
        console.log('Share file:', file.id);
        onClose();
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(file.download_url);
            onClose();
        } catch (error) {
            console.error('Error copying link:', error);
        }
    };

    const handleGetInfo = () => {
        console.log('File info:', file);
        onClose();
    };

    const renderMenuItem = (icon: string, text: string, onClick: () => void, disabled = false, danger = false) => (
        <button
            className={`storage-file-menu-item ${danger ? 'danger' : ''}`}
            onClick={onClick}
            disabled={disabled}
        >
            <i className={`fas ${icon}`}></i>
            <span>{text}</span>
        </button>
    );

    return (
        <div
            ref={menuRef}
            style={menuStyle}
            className={`storage-file-actions-menu ${isPositioned ? 'storage-menu-visible' : ''}`}
        >
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
                        {renderMenuItem(
                            isDownloading ? 'fa-spinner fa-spin' : 'fa-download',
                            isDownloading ? 'Скачивание...' : 'Скачать',
                            handleDownload,
                            isDownloading
                        )}

                        {permissions.canEditItem(file) && renderMenuItem(
                            'fa-edit',
                            'Переименовать',
                            handleRename
                        )}

                        {renderMenuItem(
                            isFavoriting ? 'fa-spinner fa-spin' : 'fa-star',
                            isFavoriting ? 'Обработка...' :
                                file.is_favorited ? 'Удалить из избранного' : 'Добавить в избранное',
                            handleToggleFavorite,
                            isFavoriting
                        )}

                        {renderMenuItem(
                            'fa-thumbtack',
                            file.is_pinned ? 'Открепить' : 'Закрепить',
                            handleTogglePin
                        )}

                        {permissions.canEditItem(file) && renderMenuItem(
                            'fa-folder-open',
                            'Переместить',
                            handleMove
                        )}

                        {permissions.canShareItem(file) && renderMenuItem(
                            'fa-share-alt',
                            'Поделиться',
                            handleShare
                        )}

                        {renderMenuItem(
                            'fa-link',
                            'Копировать ссылку',
                            handleCopyLink
                        )}

                        <div className="storage-file-menu-divider"></div>

                        {renderMenuItem(
                            'fa-info-circle',
                            'Свойства',
                            handleGetInfo
                        )}

                        {permissions.canDeleteItem(file) && renderMenuItem(
                            'fa-trash',
                            'Удалить',
                            handleDelete,
                            false,
                            true
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