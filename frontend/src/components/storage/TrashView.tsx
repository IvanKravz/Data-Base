// components/storage/TrashView.tsx
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Square, CheckSquare, Trash2, RotateCcw, Folder, File } from 'lucide-react';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import './styles/TrashView.css';

interface TrashViewProps {
    folders: any[];
    files: any[];
    onRestore: (items: any[]) => void;
    onDelete: (items: any[]) => void;
    onEmptyTrash: () => void;
    permissions: StoragePermissions;
    isLoading?: boolean;
    userId?: number; 
}

const TrashView: React.FC<TrashViewProps> = ({
    folders,
    files,
    onRestore,
    onDelete,
    onEmptyTrash,
    permissions,
    isLoading = false,
    userId,
}) => {
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const userFolders = useMemo(() => {
        if (!userId) return [];
        return folders.filter(folder => folder.deleted_by?.id === userId);
    }, [folders, userId]);

    const userFiles = useMemo(() => {
        if (!userId) return [];
        return files.filter(file => file.deleted_by?.id === userId);
    }, [files, userId]);

    if (isLoading || !userId) {
        return (
            <div className="storage-trash-loading">
                <div className="storage-spinner"></div>
                <p>{!userId ? 'Загрузка пользователя...' : 'Загрузка корзины...'}</p>
            </div>
        );
    }

    const totalItems = userFolders.length + userFiles.length;
    const totalSize = [...userFolders, ...userFiles].reduce((sum, item) =>
        sum + ('size' in item ? item.size : 0), 0
    );

    const handleSelectAll = () => {
        const allItems = [...userFolders, ...userFiles];
        setSelectedItems(allItems);
    };

    const handleClearSelection = () => {
        setSelectedItems([]);
    };

    const handleItemSelect = (item: any) => {
        const isSelected = selectedItems.some(selected => selected.id === item.id);
        if (isSelected) {
            setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleRestoreSelected = () => {
        if (selectedItems.length === 0) return;
        onRestore(selectedItems);
        setSelectedItems([]);
    };

    const handleDeleteSelected = () => {
        if (selectedItems.length === 0) return;
        if (window.confirm(`Удалить выбранные элементы (${selectedItems.length}) навсегда?`)) {
            onDelete(selectedItems);
            setSelectedItems([]);
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getTimeSinceDeleted = (deletedAt: string) => {
        if (!deletedAt) return 'неизвестно';
        const deleted = new Date(deletedAt);
        const now = new Date();
        const diffMs = now.getTime() - deleted.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return `${diffMinutes} мин. назад`;
            }
            return `${diffHours} ч. назад`;
        } else if (diffDays === 1) {
            return 'Вчера';
        } else if (diffDays < 7) {
            return `${diffDays} дн. назад`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} нед. назад`;
        } else {
            const months = Math.floor(diffDays / 30);
            return `${months} мес. назад`;
        }
    };

    const sortedItems = [...userFolders, ...userFiles].sort((a, b) => {
        let aValue: any, bValue: any;
        switch (sortBy) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'date':
                aValue = new Date(a.deleted_at || a.updated_at).getTime();
                bValue = new Date(b.deleted_at || b.updated_at).getTime();
                break;
            case 'size':
                aValue = 'size' in a ? a.size : 0;
                bValue = 'size' in b ? b.size : 0;
                break;
            default:
                return 0;
        }
        return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    return (
        <div className="storage-trash-view">
            <div className="storage-trash-header">
                <div className="storage-trash-header-left">
                    <h2 className="storage-trash-title">
                        <Trash2 size={24} /> Корзина
                    </h2>
                    <div className="storage-trash-stats">
                        <span className="storage-trash-stat">
                            <Folder size={14} /> {userFolders.length} папок
                        </span>
                        <span className="storage-trash-stat">
                            <File size={14} /> {userFiles.length} файлов
                        </span>
                        <span className="storage-trash-stat">
                            <i className="fas fa-database"></i> {formatBytes(totalSize)}
                        </span>
                    </div>
                </div>

                <div className="storage-trash-header-right">
                    <div className="storage-trash-controls">
                        <div className="storage-trash-sort">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="storage-trash-sort-select"
                            >
                                <option value="date">По дате удаления</option>
                                <option value="name">По имени</option>
                                <option value="size">По размеру</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="storage-trash-sort-order"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {totalItems === 0 ? (
                <div className="storage-trash-empty">
                    <div className="storage-trash-empty-icon">
                        <Trash2 size={64} />
                    </div>
                    <h3 className="storage-trash-empty-title">Корзина пуста</h3>
                    <p className="storage-trash-empty-text">
                        Удаленные файлы и папки будут храниться здесь 30 дней
                    </p>
                </div>
            ) : (
                <>
                    <div className="storage-trash-selection-bar">
                        <div className="storage-trash-selection-info">
                            <button
                                className="storage-trash-checkbox-button"
                                onClick={selectedItems.length === totalItems ? handleClearSelection : handleSelectAll}
                            >
                                {selectedItems.length === totalItems && totalItems > 0 ? (
                                    <CheckSquare size={20} className="checked" />
                                ) : (
                                    <Square size={20} />
                                )}
                            </button>
                            <span className="storage-trash-selected-count">
                                Выбрано: {selectedItems.length} из {totalItems}
                            </span>
                        </div>

                        <div className="storage-trash-selection-actions">
                            {selectedItems.length > 0 && (
                                <>
                                    <button
                                        className="storage-trash-action-btn storage-trash-restore-btn"
                                        onClick={handleRestoreSelected}
                                    >
                                        <RotateCcw size={16} /> Восстановить
                                    </button>
                                    <button
                                        className="storage-trash-action-btn storage-trash-delete-btn"
                                        onClick={handleDeleteSelected}
                                    >
                                        <Trash2 size={16} /> Удалить навсегда
                                    </button>
                                </>
                            )}
                            {permissions.canEmptyTrash && (
                                <button
                                    className="storage-trash-action-btn storage-trash-empty-btn"
                                    onClick={onEmptyTrash}
                                >
                                    <Trash2 size={16} /> Очистить корзину
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="storage-trash-items list-view">
                        {sortedItems.map((item) => {
                            const isFile = 'file_type' in item;
                            const isSelected = selectedItems.some(selected => selected.id === item.id);

                            return (
                                <div
                                    key={item.id}
                                    className={`storage-trash-item ${isSelected ? 'selected' : ''}`}
                                >
                                    <div className="storage-trash-item-select">
                                        <button
                                            className="storage-trash-checkbox-button"
                                            onClick={() => handleItemSelect(item)}
                                        >
                                            {isSelected ? (
                                                <CheckSquare size={20} className="checked" />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    </div>

                                    <div className="storage-trash-item-icon">
                                        {isFile ? <File size={20} /> : <Folder size={20} />}
                                    </div>

                                    <div className="storage-trash-item-info" onClick={() => handleItemSelect(item)}>
                                        <h4 className="storage-trash-item-name" title={item.name}>
                                            {item.name}
                                        </h4>

                                        <div className="storage-trash-item-meta">
                                            {isFile ? (
                                                <>
                                                    <span className="storage-trash-item-type">
                                                        {item.extension?.toUpperCase() || 'Файл'}
                                                    </span>
                                                    <span className="storage-trash-item-separator">•</span>
                                                    <span className="storage-trash-item-size">
                                                        {formatBytes(item.size)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="storage-trash-item-type">
                                                    Папка ({item.files_count || 0} файлов)
                                                </span>
                                            )}
                                        </div>

                                        <div className="storage-trash-item-deleted">
                                            <i className="fas fa-clock"></i>
                                            <span className="storage-trash-item-deleted-text">
                                                Удалено {getTimeSinceDeleted(item.deleted_at)}
                                            </span>
                                            <span className="storage-trash-item-deleted-by">
                                                {item.deleted_by?.username || 'Неизвестно'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="storage-trash-item-actions">
                                        <button
                                            className="storage-trash-item-action"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRestore([item]);
                                            }}
                                            title="Восстановить"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button
                                            className="storage-trash-item-action"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete([item]);
                                            }}
                                            title="Удалить навсегда"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <div className="storage-trash-footer">
                <div className="storage-trash-warning">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>
                        Файлы в корзине будут автоматически удалены через 30 дней
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TrashView;