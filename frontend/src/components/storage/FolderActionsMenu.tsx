// components/storage/FolderActionsMenu.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import { storageApi, StorageFolder } from '../../api/storage';
import ItemPropertiesModal from './ItemPropertiesModal';
import MoveModal from './MoveModal';
import './styles/FolderActionsMenu.css';

interface FolderActionsMenuProps {
    folder: StorageFolder;
    position: { x: number; y: number };
    onClose: () => void;
    permissions: StoragePermissions;
    viewType: 'personal' | 'work';
    // Изменено: onMove принимает только целевой ID, ID папки уже известен
    onMove: (targetParentId: number | null) => Promise<void>;
    onDelete?: (folderId: number) => void;
    onRefreshFavorites?: () => void;
}

const INITIAL_MENU_STYLE: React.CSSProperties = {
    position: 'fixed',
    left: '-9999px',
    top: '-9999px',
    opacity: 0,
    zIndex: 1001,
};

const FolderActionsMenu: React.FC<FolderActionsMenuProps> = ({
    folder,
    position,
    onClose,
    permissions,
    viewType,
    onMove,
    onDelete,
    onRefreshFavorites,
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(folder.name);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const [showProperties, setShowProperties] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>(INITIAL_MENU_STYLE);
    const [isPositioned, setIsPositioned] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
        { value: null, label: 'Сбросить цвет' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Если открыто модальное окно перемещения, игнорируем клики внутри него
            if (showMoveModal) {
                const modalElement = document.querySelector('.mm-overlay');
                if (modalElement && modalElement.contains(event.target as Node)) {
                    return;
                }
            }
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, showMoveModal]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        if (!menuRef.current) return;
        const calculatePosition = () => {
            const rect = menuRef.current!.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            let adjustedX = position.x;
            let adjustedY = position.y;
            if (adjustedX + rect.width > windowWidth) adjustedX = position.x - rect.width;
            if (adjustedY + rect.height > windowHeight) adjustedY = position.y - rect.height;
            adjustedX = Math.max(10, Math.min(adjustedX, windowWidth - rect.width - 10));
            adjustedY = Math.max(10, Math.min(adjustedY, windowHeight - rect.height - 10));
            setMenuStyle({
                position: 'fixed',
                left: `${adjustedX}px`,
                top: `${adjustedY}px`,
                zIndex: 1001,
                opacity: 1,
            });
            setIsPositioned(true);
        };
        requestAnimationFrame(calculatePosition);
    }, [position]);

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
            // Обновляем локальное состояние (если нужно)
            folder.is_favorited = !folder.is_favorited; // если добавить поле в модель, но пока просто обновим список
            onRefreshFavorites?.();
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

    const handleChangeColor = async (color: string | null) => {
        try {
            await storageApi.updateFolder(folder.id, { color });
            folder.color = color;
            setColorPickerOpen(false);
            onClose();
        } catch (error) {
            console.error('Error changing folder color:', error);
        }
    };

    const handleMove = () => {
        setShowMoveModal(true);
    };

    const handleDelete = async () => {
        if (window.confirm(`Удалить папку "${folder.name}" и все её содержимое?`)) {
            onDelete?.(folder.id);
            onClose();
        }
    };

    const handleDownload = async () => {
        onClose();
    };

    const handleGetInfo = () => {
        setShowProperties(true);
    };

    const getFolderIcon = () => {
        return folder.folder_type === 'personal' ? 'fas fa-user-circle' : 'fas fa-folder';
    };

    const getContrastColor = (hexColor: string) => {
        if (!hexColor) return '#ffffff';
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#1e293b' : '#ffffff';
    };

    const renderMenuItem = (icon: string, text: string, onClick: () => void, disabled = false, danger = false) => (
        <button
            className={`storage-folder-menu-item ${danger ? 'danger' : ''}`}
            onClick={onClick}
            disabled={disabled}
        >
            <div className="storage-folder-menu-item-content">
                <i className={`fas ${icon}`}></i>
                <span>{text}</span>
            </div>
        </button>
    );

    return (
        <>
            <div
                ref={menuRef}
                style={menuStyle}
                className={`storage-folder-actions-menu ${isPositioned ? 'storage-menu-visible' : ''}`}
            >
                <div className="storage-folder-menu-header">
                    <div
                        className="storage-folder-menu-preview"
                        style={{
                            background: folder.color || '#1976D2',
                            color: folder.color ? getContrastColor(folder.color) : '#ffffff',
                        }}
                    >
                        <i className={getFolderIcon()}></i>
                    </div>
                    <div className="storage-folder-menu-info">
                        <h4 className="storage-folder-menu-title" title={folder.name}>
                            {folder.name}
                        </h4>
                        <div className="storage-folder-menu-meta">
                            <span className="storage-folder-menu-files">{folder.files_count} файлов</span>
                            <span className="storage-folder-menu-folders">{folder.subfolders_count} папок</span>
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
                                <button className="storage-folder-rename-cancel" onClick={handleRenameCancel}>
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
                            {permissions.canEditItem(folder) &&
                                renderMenuItem('fa-edit', 'Переименовать', handleRename)}

                            {renderMenuItem(
                                isFavoriting ? 'fa-spinner fa-spin' : (folder.is_favorited ? 'fa-star' : 'fa-star'),
                                isFavoriting
                                    ? 'Обработка...'
                                    : (folder.is_favorited ? 'Удалить из избранного' : 'Добавить в избранное'),
                                handleToggleFavorite,
                                isFavoriting
                            )}

                            {renderMenuItem(
                                'fa-thumbtack',
                                folder.is_pinned ? 'Открепить' : 'Закрепить',
                                handleTogglePin
                            )}

                            {permissions.canEditItem(folder) && (
                                <div className="storage-folder-color-picker-container">
                                    <button
                                        className="storage-folder-menu-item"
                                        onClick={() => setColorPickerOpen(!colorPickerOpen)}
                                    >
                                        <div className="storage-folder-menu-item-content">
                                            <i className="fas fa-palette"></i>
                                            <span>Изменить цвет</span>
                                            <i className={`fas fa-chevron-${colorPickerOpen ? 'up' : 'down'}`}></i>
                                        </div>
                                    </button>
                                    {colorPickerOpen && (
                                        <div className="storage-folder-color-picker">
                                            {colorOptions.map((color) => (
                                                <button
                                                    key={color.value || 'reset'}
                                                    className="storage-folder-color-option"
                                                    onClick={() => handleChangeColor(color.value)}
                                                    title={color.label}
                                                >
                                                    <div
                                                        className="storage-folder-color-preview"
                                                        style={{
                                                            backgroundColor: color.value || 'transparent',
                                                            border: !color.value ? '2px dashed #ccc' : 'none',
                                                        }}
                                                    >
                                                        {!color.value && (
                                                            <i
                                                                className="fas fa-times"
                                                                style={{ color: '#666', fontSize: '12px' }}
                                                            ></i>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {permissions.canEditItem(folder) &&
                                renderMenuItem('fa-folder-open', 'Переместить', handleMove)}

                            {renderMenuItem('fa-download', 'Скачать папку', handleDownload)}

                            <div className="storage-folder-menu-divider"></div>

                            {renderMenuItem('fa-info-circle', 'Свойства', handleGetInfo)}

                            {permissions.canDeleteItem(folder) &&
                                renderMenuItem('fa-trash', 'Удалить', handleDelete, false, true)}
                        </>
                    )}
                </div>
            </div>

            {showProperties && (
                <ItemPropertiesModal item={folder} onClose={() => setShowProperties(false)} />
            )}

            {showMoveModal && (
                <MoveModal
                    itemId={folder.id}
                    itemName={folder.name}
                    itemType="folder"
                    currentParentId={folder.parent}
                    viewType={viewType}
                    permissions={permissions}
                    onMove={(targetFolderId) => {
                        // Родительский onMove ожидает только целевую папку
                        return onMove(targetFolderId);
                    }}
                    onClose={() => setShowMoveModal(false)}
                />
            )}
        </>
    );
};

export default FolderActionsMenu;