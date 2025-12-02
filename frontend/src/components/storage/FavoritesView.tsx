// components/storage/FavoritesView.tsx
import React, { useState, useEffect } from 'react';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import { storageApi } from '../../api/storage';
import FolderItem from './FolderItem';
import FileItem from './FileItem';
import './styles/FavoritesView.css';

interface FavoritesViewProps {
    folders: any[];
    files: any[];
    onFolderClick: (folder: any) => void;
    onFileClick: (file: any) => void;
    permissions: StoragePermissions;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({
    folders,
    files,
    onFolderClick,
    onFileClick,
    permissions
}) => {
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [groupBy, setGroupBy] = useState<'type' | 'date'>('type');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setSelectedItems([]);
    }, [folders, files]);

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

    const handleRemoveFromFavorites = async (items: any[]) => {
        if (items.length === 0) return;

        try {
            setIsRefreshing(true);

            const promises = items.map(item => {
                if (item.hasOwnProperty('folder_type')) {
                    // Это папка
                    return storageApi.toggleFavorite({ folder_id: item.id });
                } else {
                    // Это файл
                    return storageApi.toggleFavorite({ file_id: item.id });
                }
            });

            await Promise.all(promises);

            // После успешного удаления из избранного, можно обновить список
            // или просто очистить выбранные элементы
            setSelectedItems([]);

        } catch (error) {
            console.error('Error removing from favorites:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        // Здесь можно добавить логику обновления данных
        // В реальном приложении это будет перезагрузка данных
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const sortedFolders = [...folders].sort(sortItems);
    const sortedFiles = [...files].sort(sortItems);

    function sortItems(a: any, b: any) {
        let aValue: any, bValue: any;

        switch (sortBy) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'date':
                aValue = new Date(a.created_at).getTime();
                bValue = new Date(b.created_at).getTime();
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
    }

    const formatDateGroup = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Сегодня';
        if (diffDays === 1) return 'Вчера';
        if (diffDays < 7) return 'На этой неделе';
        if (diffDays < 30) return 'В этом месяце';

        return 'Ранее';
    };

    const getGroupedItems = () => {
        if (groupBy === 'type') {
            return {
                'Папки': sortedFolders,
                'Файлы': sortedFiles
            };
        } else {
            const groups: Record<string, any[]> = {};

            [...sortedFolders, ...sortedFiles].forEach(item => {
                const groupKey = formatDateGroup(item.created_at);
                if (!groups[groupKey]) {
                    groups[groupKey] = [];
                }
                groups[groupKey].push(item);
            });

            return groups;
        }
    };

    const groupedItems = getGroupedItems();
    const totalItems = folders.length + files.length;

    if (totalItems === 0) {
        return (
            <div className="storage-favorites-empty">
                <div className="storage-favorites-empty-icon">
                    <i className="fas fa-star"></i>
                </div>
                <h3 className="storage-favorites-empty-title">Избранное пусто</h3>
                <p className="storage-favorites-empty-text">
                    Добавляйте файлы и папки в избранное, чтобы иметь к ним быстрый доступ
                </p>
                <div className="storage-favorites-empty-tip">
                    <i className="fas fa-lightbulb"></i>
                    <span>Нажмите на звездочку на файле или папке, чтобы добавить в избранное</span>
                </div>
            </div>
        );
    }

    return (
        <div className="storage-favorites-view">
            <div className="storage-favorites-header">
                <div className="storage-favorites-header-left">
                    <h2 className="storage-favorites-title">
                        <i className="fas fa-star"></i> Избранное
                    </h2>
                    <div className="storage-favorites-stats">
                        <span className="storage-favorites-stat">
                            <i className="fas fa-folder"></i> {folders.length} папок
                        </span>
                        <span className="storage-favorites-stat">
                            <i className="fas fa-file"></i> {files.length} файлов
                        </span>
                    </div>
                </div>

                <div className="storage-favorites-header-right">
                    <div className="storage-favorites-controls">
                        <button
                            className="storage-favorites-control"
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            title={viewMode === 'list' ? 'Плитка' : 'Список'}
                        >
                            <i className={`fas fa-${viewMode === 'list' ? 'th-large' : 'list'}`}></i>
                        </button>

                        <div className="storage-favorites-sort">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="storage-favorites-sort-select"
                            >
                                <option value="date">По дате добавления</option>
                                <option value="name">По имени</option>
                                <option value="size">По размеру</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="storage-favorites-sort-order"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>

                        <div className="storage-favorites-group">
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value as any)}
                                className="storage-favorites-group-select"
                            >
                                <option value="type">Группировать по типу</option>
                                <option value="date">Группировать по дате</option>
                            </select>
                        </div>

                        <button
                            className="storage-favorites-control"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title="Обновить"
                        >
                            <i className={`fas ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {selectedItems.length > 0 && (
                <div className="storage-favorites-selection-bar">
                    <div className="storage-favorites-selection-info">
                        <input
                            type="checkbox"
                            checked={selectedItems.length === totalItems && totalItems > 0}
                            onChange={selectedItems.length === totalItems ? handleClearSelection : handleSelectAll}
                            className="storage-favorites-select-all"
                        />
                        <span className="storage-favorites-selected-count">
                            Выбрано: {selectedItems.length} из {totalItems}
                        </span>
                    </div>

                    <div className="storage-favorites-selection-actions">
                        <button
                            className="storage-favorites-action-btn storage-favorites-remove-btn"
                            onClick={() => handleRemoveFromFavorites(selectedItems)}
                            disabled={isRefreshing}
                        >
                            <i className="fas fa-star"></i> Убрать из избранного
                        </button>
                    </div>
                </div>
            )}

            <div className="storage-favorites-content">
                {Object.entries(groupedItems).map(([groupName, items]) => {
                    if (items.length === 0) return null;

                    return (
                        <div key={groupName} className="storage-favorites-group-section">
                            <h3 className="storage-favorites-group-title">
                                {groupName} ({items.length})
                            </h3>

                            {viewMode === 'grid' ? (
                                <div className="storage-favorites-grid">
                                    {items.map((item) => {
                                        if (item.hasOwnProperty('folder_type')) {
                                            return (
                                                <FolderItem
                                                    key={item.id}
                                                    folder={item}
                                                    viewMode={viewMode}
                                                    isSelected={selectedItems.some(selected => selected.id === item.id)}
                                                    onSelect={() => handleItemSelect(item)}
                                                    onClick={() => onFolderClick(item)}
                                                    onDragStart={() => { }}
                                                    permissions={permissions}
                                                />
                                            );
                                        } else {
                                            return (
                                                <FileItem
                                                    key={item.id}
                                                    file={item}
                                                    viewMode={viewMode}
                                                    isSelected={selectedItems.some(selected => selected.id === item.id)}
                                                    onSelect={() => handleItemSelect(item)}
                                                    onClick={() => onFileClick(item)}
                                                    onDragStart={() => { }}
                                                    permissions={permissions}
                                                />
                                            );
                                        }
                                    })}
                                </div>
                            ) : (
                                <div className="storage-favorites-list">
                                    {items.map((item) => {
                                        if (item.hasOwnProperty('folder_type')) {
                                            return (
                                                <FolderItem
                                                    key={item.id}
                                                    folder={item}
                                                    viewMode={viewMode}
                                                    isSelected={selectedItems.some(selected => selected.id === item.id)}
                                                    onSelect={() => handleItemSelect(item)}
                                                    onClick={() => onFolderClick(item)}
                                                    onDragStart={() => { }}
                                                    permissions={permissions}
                                                />
                                            );
                                        } else {
                                            return (
                                                <FileItem
                                                    key={item.id}
                                                    file={item}
                                                    viewMode={viewMode}
                                                    isSelected={selectedItems.some(selected => selected.id === item.id)}
                                                    onSelect={() => handleItemSelect(item)}
                                                    onClick={() => onFileClick(item)}
                                                    onDragStart={() => { }}
                                                    permissions={permissions}
                                                />
                                            );
                                        }
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FavoritesView;