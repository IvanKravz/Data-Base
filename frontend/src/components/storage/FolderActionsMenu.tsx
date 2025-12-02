// components/storage/FolderActionsMenu.tsx
import React, { useState, useEffect } from 'react';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import { storageApi } from '../../api/storage';
import './styles/FolderActionsMenu.css';

interface FolderActionsMenuProps {
    folder: any;
    position: { x: number; y: number };
    onClose: () => void;
    permissions: StoragePermissions;
}

const FolderActionsMenu: React.FC<FolderActionsMenuProps> = ({
    folder,
    position,
    onClose,
    permissions
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(folder.name);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    const colorOptions = [
        { value: '#1976D2', label: 'Синий' },
        { value: '#4CAF50', label: 'Зеленый' },
        { value: '#FF9800', label: 'Оранжевый' },
        { value: '#9C27B0', label: 'Фиолетовый' },
        { value: '#F44336', label: 'Красный' },
        { value: '#00BCD4', label: 'Голубой' },
        { value: '#FFC107', label: 'Желтый' },
        { value: '#795548', label: 'Коричневый' },
        { value: '#607D8B', label: 'Серый' },
        { value: '#E91E63', label: 'Розовый' },
    ];

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

    const handleRename = async () => {
        if (isRenaming) {
            try {
                await storageApi.updateFolder(folder.id, { name: newName });
                folder.name = newName;
                setIsRenaming(false);
                onClose();
            } catch (error) {
                console.error('Error renaming folder:', error);
            }
        } else {
            setIsRenaming(true);
        }
    };

    const handleRenameCancel = () => {
        setIsRenaming(false);
        setNewName(folder.name);
    };

    const handleToggleFavorite = async () => {
        if (isFavoriting) return;

        try {
            setIsFavoriting(true);
            await storageApi.toggleFavorite({ folder_id: folder.id });
            // Обновляем состояние в родительском компоненте
            onClose();
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsFavoriting(false);
        }
    };

    const handleTogglePin = async () => {
        try {
            await storageApi.pinFolder(folder.id);
            folder.is_pinned = !folder.is_pinned;
            onClose();
        } catch (error) {
            console.error('Error pinning folder:', error);
        }
    };

    const handleChangeColor = async (color: string) => {
        try {
            await storageApi.updateFolder(folder.id, { color });
            folder.color = color;
            setColorPickerOpen(false);
            onClose();
        } catch (error) {
            console.error('Error changing folder color:', error);
        }
    };

    const handleMove = async () => {
        // Здесь можно открыть модальное окно для перемещения
        console.log('Move folder:', folder.id);
        onClose();
    };

    const handleDelete = async () => {
        if (window.confirm(`Удалить папку "${folder.name}" и все её содержимое?`)) {
            try {
                await storageApi.softDeleteFolder(folder.id);
                onClose();
            } catch (error) {
                console.error('Error deleting folder:', error);
            }
        }
    };

    const handleDownload = async () => {
        // Здесь можно реализовать скачивание всей папки (например, в виде архива)
        console.log('Download folder:', folder.id);
        onClose();
    };

    const handleGetInfo = () => {
        console.log('Folder info:', folder);
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

    const getFolderIcon = () => {
        if (folder.folder_type === 'personal') {
            return 'fas fa-user-circle';
        }
        return 'fas fa-folder';
    };

    return (
        <div ref={menuRef} className="storage-folder-actions-menu" style={style}>
            <div className="storage-folder-menu-header">
                <div
                    className="storage-folder-menu-preview"
                    style={{ color: folder.color || '#1976D2' }}
                >
                    <i className={getFolderIcon()}></i>
                </div>
                <div className="storage-folder-menu-info">
                    <h4 className="storage-folder-menu-title" title={folder.name}>
                        {folder.name}
                    </h4>
                    <div className="storage-folder-menu-meta">
                        <span className="storage-folder-menu-files">
                            {folder.files_count} файлов
                        </span>
                        <span className="storage-folder-menu-folders">
                            {folder.subfolders_count} папок
                        </span>
                    </div>
                </div>
            </div>

            <div className="storage-folder-menu-content">
                {isRenaming ? (
                    <div className="storage-folder-rename-form">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="storage-folder-rename-input"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') handleRenameCancel();
                            }}
                        />
                        <div className="storage-folder-rename-actions">
                            <button
                                className="storage-folder-rename-cancel"
                                onClick={handleRenameCancel}
                            >
                                Отмена
                            </button>
                            <button
                                className="storage-folder-rename-save"
                                onClick={handleRename}
                                disabled={!newName.trim() || newName === folder.name}
                            >
                                Сохранить
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {permissions.canEditItem(folder) && (
                            <button
                                className="storage-folder-menu-item"
                                onClick={handleRename}
                            >
                                <i className="fas fa-edit"></i>
                                <span>Переименовать</span>
                            </button>
                        )}

                        <button
                            className="storage-folder-menu-item"
                            onClick={handleToggleFavorite}
                            disabled={isFavoriting}
                        >
                            <i className={`fas ${isFavoriting ? 'fa-spinner fa-spin' : 'fa-star'}`}></i>
                            <span>
                                {isFavoriting ? 'Обработка...' : 'Добавить в избранное'}
                            </span>
                        </button>

                        <button
                            className="storage-folder-menu-item"
                            onClick={handleTogglePin}
                        >
                            <i className="fas fa-thumbtack"></i>
                            <span>
                                {folder.is_pinned ? 'Открепить' : 'Закрепить'}
                            </span>
                        </button>

                        {permissions.canEditItem(folder) && (
                            <div className="storage-folder-color-picker-container">
                                <button
                                    className="storage-folder-menu-item"
                                    onClick={() => setColorPickerOpen(!colorPickerOpen)}
                                >
                                    <i className="fas fa-palette"></i>
                                    <span>Изменить цвет</span>
                                    <i className={`fas fa-chevron-${colorPickerOpen ? 'up' : 'down'}`}></i>
                                </button>

                                {colorPickerOpen && (
                                    <div className="storage-folder-color-picker">
                                        {colorOptions.map(color => (
                                            <button
                                                key={color.value}
                                                className="storage-folder-color-option"
                                                onClick={() => handleChangeColor(color.value)}
                                                title={color.label}
                                            >
                                                <div
                                                    className="storage-folder-color-preview"
                                                    style={{ backgroundColor: color.value }}
                                                ></div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {permissions.canEditItem(folder) && (
                            <button
                                className="storage-folder-menu-item"
                                onClick={handleMove}
                            >
                                <i className="fas fa-folder-open"></i>
                                <span>Переместить</span>
                            </button>
                        )}

                        <button
                            className="storage-folder-menu-item"
                            onClick={handleDownload}
                        >
                            <i className="fas fa-download"></i>
                            <span>Скачать папку</span>
                        </button>

                        <div className="storage-folder-menu-divider"></div>

                        <button
                            className="storage-folder-menu-item"
                            onClick={handleGetInfo}
                        >
                            <i className="fas fa-info-circle"></i>
                            <span>Свойства</span>
                        </button>

                        {permissions.canDeleteItem(folder) && (
                            <button
                                className="storage-folder-menu-item danger"
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

export default FolderActionsMenu;