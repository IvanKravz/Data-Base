// components/storage/TrashView.tsx
import React, { useState } from 'react';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import './styles/TrashView.css';


interface TrashViewProps {
    folders: any[];
    files: any[];
    onRestore: (items: any[]) => void;
    onDelete: (items: any[]) => void;
    onEmptyTrash: () => void;
    permissions: StoragePermissions;
}

const TrashView: React.FC<TrashViewProps> = ({
    folders,
    files,
    onRestore,
    onDelete,
    onEmptyTrash,
    permissions
}) => {
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const handleSelectAll = () => {
        const allItems = [...folders, ...files];
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getTimeSinceDeleted = (deletedAt: string) => {
        const deleted = new Date(deletedAt);
        const now = new Date();
        const diffMs = now.getTime() - deleted.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return `${diffMinutes} минут назад`;
            }
            return `${diffHours} часов назад`;
        } else if (diffDays === 1) {
            return 'Вчера';
        } else if (diffDays < 7) {
            return `${diffDays} дней назад`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} недель назад`;
        } else {
            const months = Math.floor(diffDays / 30);
            return `${months} месяцев назад`;
        }
    };

    const sortedItems = [...folders, ...files].sort((a, b) => {
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

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const totalItems = folders.length + files.length;
    const totalSize = [...folders, ...files].reduce((sum, item) =>
        sum + ('size' in item ? item.size : 0), 0
    );

    return (
        <div className="storage-trash-view">
            <div className="storage-trash-header">
                <div className="storage-trash-header-left">
                    <h2 className="storage-trash-title">
                        <i className="fas fa-trash"></i> Корзина
                    </h2>
                    <div className="storage-trash-stats">
                        <span className="storage-trash-stat">
                            <i className="fas fa-folder"></i> {folders.length} папок
                        </span>
                        <span className="storage-trash-stat">
                            <i className="fas fa-file"></i> {files.length} файлов
                        </span>
                        <span className="storage-trash-stat">
                            <i className="fas fa-database"></i> {formatBytes(totalSize)}
                        </span>
                    </div>
                </div>

                <div className="storage-trash-header-right">
                    <div className="storage-trash-controls">
                        <button
                            className="storage-trash-control"
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            title={viewMode === 'list' ? 'Плитка' : 'Список'}
                        >
                            <i className={`fas fa-${viewMode === 'list' ? 'th-large' : 'list'}`}></i>
                        </button>

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
                        <i className="fas fa-trash-alt"></i>
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
                            <input
                                type="checkbox"
                                checked={selectedItems.length === totalItems && totalItems > 0}
                                onChange={selectedItems.length === totalItems ? handleClearSelection : handleSelectAll}
                                className="storage-trash-select-all"
                            />
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
                                        <i className="fas fa-redo"></i> Восстановить
                                    </button>
                                    <button
                                        className="storage-trash-action-btn storage-trash-delete-btn"
                                        onClick={handleDeleteSelected}
                                    >
                                        <i className="fas fa-trash"></i> Удалить навсегда
                                    </button>
                                </>
                            )}

                            {permissions.canEmptyTrash && (
                                <button
                                    className="storage-trash-action-btn storage-trash-empty-btn"
                                    onClick={onEmptyTrash}
                                >
                                    <i className="fas fa-broom"></i> Очистить корзину
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`storage-trash-items ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
                        {sortedItems.map((item) => {
                            const isFile = 'file' in item;
                            const isSelected = selectedItems.some(selected => selected.id === item.id);

                            return (
                                <div
                                    key={item.id}
                                    className={`storage-trash-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleItemSelect(item)}
                                >
                                    <div className="storage-trash-item-select">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleItemSelect(item)}
                                            className="storage-trash-item-checkbox"
                                        />
                                    </div>

                                    <div className="storage-trash-item-icon">
                                        <i className={`fas fa-${isFile ? 'file' : 'folder'}`}></i>
                                    </div>

                                    <div className="storage-trash-item-info">
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
                                                    Папка ({item.files_count} файлов)
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
                                            <i className="fas fa-redo"></i>
                                        </button>
                                        <button
                                            className="storage-trash-item-action"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete([item]);
                                            }}
                                            title="Удалить навсегда"
                                        >
                                            <i className="fas fa-trash-alt"></i>
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