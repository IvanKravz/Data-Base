// components/storage/Storage.tsx
import React, { useState, useEffect } from 'react';
import FileExplorer from './FileExplorer';
import StorageSidebar from './StorageSidebar';
import Breadcrumbs from './Breadcrumbs';
import UploadButton from './UploadButton';
import CreateFolderModal from './CreateFolderModal';
import UploadModal from './UploadModal';
import StatisticsView from './StatisticsView';
import RecentFilesView from './RecentFilesView';
import FavoritesView from './FavoritesView';
import TrashView from './TrashView';
import styles from './styles/Storage.module.css';
import { StorageFile, StorageFolder, storageApi } from '../../api/storage';
import { useStoragePermissions } from '../../api/utils/useStoragePermissions';

interface StorageProps {
    initialFolderId?: number | null;
    viewMode?: 'list' | 'grid';
    showSidebar?: boolean;
}

const Storage: React.FC<StorageProps> = ({
    initialFolderId = null,
    viewMode = 'grid',
    showSidebar = true
}) => {
    const [currentFolder, setCurrentFolder] = useState<StorageFolder | null>(null);
    const [folders, setFolders] = useState<StorageFolder[]>([]);
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Array<StorageFolder | StorageFile>>([]);
    const [viewType, setViewType] = useState<'work' | 'personal'>('work');
    const [activeView, setActiveView] = useState<'explorer' | 'recent' | 'favorites' | 'statistics' | 'trash'>('explorer');
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [sidebarVisible, setSidebarVisible] = useState(showSidebar);

    const permissions = useStoragePermissions();

    useEffect(() => {
        if (!permissions.canViewStorage) {
            setError('У вас нет доступа к хранилищу файлов');
            setLoading(false);
            return;
        }

        loadData();
    }, [currentFolder?.id, viewType, sortBy, sortOrder, activeView]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            let fetchedFolders: StorageFolder[] = [];
            let fetchedFiles: StorageFile[] = [];

            switch (activeView) {
                case 'explorer':
                    [fetchedFolders, fetchedFiles] = await Promise.all([
                        storageApi.getFolders({
                            parent_id: currentFolder?.id || null,
                            type: viewType,
                            ordering: sortBy === 'name' ? 'name' : '-created_at'
                        }),
                        storageApi.getFiles({
                            folder_id: currentFolder?.id || null,
                            type: viewType,
                            ordering: sortBy === 'name' ? 'name' : '-created_at'
                        })
                    ]);
                    break;

                case 'recent':
                    fetchedFiles = await storageApi.getRecentFiles();
                    break;

                case 'favorites':
                    const favorites = await storageApi.getFavorites();
                    fetchedFolders = favorites.filter(f => f.folder).map(f => f.folder!);
                    fetchedFiles = favorites.filter(f => f.file).map(f => f.file!);
                    break;

                case 'statistics':
                    // Только статистика, без файлов/папок
                    break;

                case 'trash':
                    [fetchedFolders, fetchedFiles] = await Promise.all([
                        storageApi.getTrashFolders(),
                        storageApi.getTrashFiles()
                    ]);
                    break;
            }

            // Применяем сортировку
            fetchedFolders = sortItems(fetchedFolders) as StorageFolder[];
            fetchedFiles = sortItems(fetchedFiles) as StorageFile[];

            setFolders(fetchedFolders);
            setFiles(fetchedFiles);
        } catch (err: any) {
            setError(err.message || 'Ошибка при загрузке данных');
            console.error('Error loading storage data:', err);
        } finally {
            setLoading(false);
        }
    };

    const sortItems = (items: Array<StorageFolder | StorageFile>) => {
        return [...items].sort((a, b) => {
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
        });
    };

    const handleFolderClick = (folder: StorageFolder) => {
        setCurrentFolder(folder);
        setSelectedItems([]);
    };

    const handleNavigateUp = () => {
        if (currentFolder?.parent) {
            // Загружаем родительскую папку
            storageApi.getFolders({ parent_id: currentFolder.parent })
                .then(fetchedFolders => {
                    const parentFolder = fetchedFolders.find(f => f.id === currentFolder.parent);
                    if (parentFolder) {
                        setCurrentFolder(parentFolder);
                    }
                });
        } else {
            setCurrentFolder(null);
        }
    };

    const handleCreateFolder = async (name: string, color?: string) => {
        try {
            const newFolder = await storageApi.createFolder({
                name,
                parent: currentFolder?.id || null,
                folder_type: viewType,
                color,
                division: viewType === 'work' ? undefined : null,
                subdivision: viewType === 'work' ? undefined : null
            });

            setFolders(prev => [...prev, newFolder]);
            setIsCreateFolderModalOpen(false);
        } catch (err: any) {
            setError(err.message || 'Ошибка при создании папки');
        }
    };

    const handleUploadFiles = async (files: File[]) => {
        try {
            const uploadedFiles = await storageApi.uploadMultipleFiles(
                files,
                currentFolder?.id || null,
                viewType
            );

            setFiles(prev => [...prev, ...uploadedFiles]);
            setIsUploadModalOpen(false);
        } catch (err: any) {
            setError(err.message || 'Ошибка при загрузке файлов');
        }
    };

    const handleDeleteItems = async (items: Array<StorageFolder | StorageFile>) => {
        if (!window.confirm(`Удалить выбранные элементы (${items.length})?`)) {
            return;
        }

        try {
            const folderIds = items.filter(item => 'folder_type' in item).map(item => item.id);
            const fileIds = items.filter(item => 'file_type' in item).map(item => item.id);

            if (folderIds.length > 0) {
                await Promise.all(folderIds.map(id => storageApi.softDeleteFolder(id)));
            }

            if (fileIds.length > 0) {
                await Promise.all(fileIds.map(id => storageApi.softDeleteFile(id)));
            }

            // Обновляем список
            setFolders(prev => prev.filter(f => !folderIds.includes(f.id)));
            setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
            setSelectedItems([]);
        } catch (err: any) {
            setError(err.message || 'Ошибка при удалении элементов');
        }
    };

    const handleRestoreItems = async (items: Array<StorageFolder | StorageFile>) => {
        try {
            const folderIds = items.filter(item => 'folder_type' in item).map(item => item.id);
            const fileIds = items.filter(item => 'file_type' in item).map(item => item.id);

            if (folderIds.length > 0) {
                await Promise.all(folderIds.map(id => storageApi.restoreFolder(id)));
            }

            if (fileIds.length > 0) {
                await Promise.all(fileIds.map(id => storageApi.restoreFile(id)));
            }

            // Удаляем из текущего вида
            setFolders(prev => prev.filter(f => !folderIds.includes(f.id)));
            setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
            setSelectedItems([]);
        } catch (err: any) {
            setError(err.message || 'Ошибка при восстановлении элементов');
        }
    };

    const handleEmptyTrash = async () => {
        if (!window.confirm('Очистить корзину? Это действие нельзя отменить.')) {
            return;
        }

        try {
            await storageApi.emptyTrash();
            setFolders([]);
            setFiles([]);
            setSelectedItems([]);
        } catch (err: any) {
            setError(err.message || 'Ошибка при очистке корзины');
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (!query.trim()) {
            loadData();
            return;
        }

        try {
            const [searchFolders, searchFiles] = await Promise.all([
                storageApi.searchFolders(query, { type: viewType }),
                storageApi.searchFiles(query, { type: viewType })
            ]);

            setFolders(searchFolders);
            setFiles(searchFiles);
        } catch (err: any) {
            setError(err.message || 'Ошибка при поиске');
        }
    };

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    if (!permissions.canViewStorage) {
        return (
            <div className={styles.storageContainer}>
                <div className={styles.accessDenied}>
                    <h2>Доступ запрещен</h2>
                    <p>У вас нет прав для просмотра хранилища файлов.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.storageContainer} ${sidebarVisible ? styles.withSidebar : styles.sidebarHidden}`}>
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Breadcrumbs
                            currentFolder={currentFolder}
                            onNavigateUp={handleNavigateUp}
                            onFolderClick={handleFolderClick}
                        />
                        
                        <button
                            onClick={toggleSidebar}
                            className={styles.toggleSidebarButton}
                        >
                            <i className={`fas fa-${sidebarVisible ? 'chevron-right' : 'chevron-left'}`}></i>
                            {sidebarVisible ? 'Скрыть панель' : 'Показать панель'}
                        </button>
                    </div>

                    <div className={styles.headerRight}>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="Поиск файлов и папок..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className={styles.searchInput}
                            />
                            <button className={styles.searchButton}>
                                <i className="fas fa-search"></i>
                            </button>
                        </div>

                        <div className={styles.sortControls}>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className={styles.sortSelect}
                            >
                                <option value="date">По дате</option>
                                <option value="name">По имени</option>
                                <option value="size">По размеру</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className={styles.sortOrderButton}
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>

                        {permissions.canUploadFiles && (
                            <UploadButton onClick={() => setIsUploadModalOpen(true)} />
                        )}

                        {permissions.canCreateFolders && (
                            <button
                                onClick={() => setIsCreateFolderModalOpen(true)}
                                className={styles.createFolderButton}
                            >
                                <i className="fas fa-folder-plus"></i> Новая папка
                            </button>
                        )}

                        {selectedItems.length > 0 && (
                            <div className={styles.selectionActions}>
                                <span className={styles.selectionCount}>
                                    Выбрано: {selectedItems.length}
                                </span>
                                <button
                                    onClick={() => handleDeleteItems(selectedItems)}
                                    className={styles.deleteSelectedButton}
                                    disabled={!selectedItems.every(item => permissions.canDeleteItem(item))}
                                >
                                    Удалить
                                </button>
                                {activeView === 'trash' && (
                                    <button
                                        onClick={() => handleRestoreItems(selectedItems)}
                                        className={styles.restoreSelectedButton}
                                    >
                                        Восстановить
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.contentArea}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Загрузка...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.error}>
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>{error}</p>
                            <button onClick={loadData} className={styles.retryButton}>
                                Повторить попытку
                            </button>
                        </div>
                    ) : (
                        <>
                            {activeView === 'explorer' && (
                                <FileExplorer
                                    folders={folders}
                                    files={files}
                                    currentFolder={currentFolder}
                                    onFolderClick={handleFolderClick}
                                    onFileClick={(file) => console.log('File clicked:', file)}
                                    viewMode={viewMode}
                                    selectedItems={selectedItems}
                                    onSelectItems={setSelectedItems}
                                    permissions={permissions}
                                />
                            )}

                            {activeView === 'recent' && (
                                <RecentFilesView
                                    files={files}
                                    onFileClick={(file) => console.log('File clicked:', file)}
                                    permissions={permissions}
                                />
                            )}

                            {activeView === 'favorites' && (
                                <FavoritesView
                                    folders={folders}
                                    files={files}
                                    onFolderClick={handleFolderClick}
                                    onFileClick={(file) => console.log('File clicked:', file)}
                                    permissions={permissions}
                                />
                            )}

                            {activeView === 'statistics' && (
                                <StatisticsView
                                    onRefresh={() => {
                                        // Здесь можно обновить статистику
                                    }}
                                />
                            )}

                            {activeView === 'trash' && (
                                <TrashView
                                    folders={folders}
                                    files={files}
                                    onRestore={handleRestoreItems}
                                    onDelete={handleDeleteItems}
                                    onEmptyTrash={handleEmptyTrash}
                                    permissions={permissions}
                                />
                            )}
                        </>
                    )}
                </div>

                <div className={styles.storageInfo}>
                    <div className={styles.storageUsage}>
                        <div className={styles.usageBar}>
                            <div
                                className={styles.usageFill}
                                style={{
                                    width: `${permissions.usedStorage && permissions.storageQuota
                                        ? (permissions.usedStorage / permissions.storageQuota) * 100
                                        : 0}%`
                                }}
                            ></div>
                        </div>
                        <span className={styles.usageText}>
                            Использовано: {formatBytes(permissions.usedStorage)} /
                            {permissions.storageQuota ? formatBytes(permissions.storageQuota) : '∞'}
                        </span>
                    </div>
                </div>
            </div>

            {sidebarVisible && (
                <StorageSidebar
                    currentView={activeView}
                    onViewChange={setActiveView}
                    viewType={viewType}
                    onViewTypeChange={setViewType}
                    permissions={permissions}
                    onEmptyTrash={handleEmptyTrash}
                />
            )}

            {/* Модальные окна */}
            {isCreateFolderModalOpen && (
                <CreateFolderModal
                    currentFolder={currentFolder}
                    viewType={viewType}
                    onCreate={handleCreateFolder}
                    onClose={() => setIsCreateFolderModalOpen(false)}
                />
            )}

            {isUploadModalOpen && (
                <UploadModal
                    currentFolder={currentFolder}
                    viewType={viewType}
                    maxFileSize={permissions.maxFileSize}
                    onUpload={handleUploadFiles}
                    onClose={() => setIsUploadModalOpen(false)}
                />
            )}
        </div>
    );
};

// Вспомогательная функция для форматирования байтов
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default Storage;