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
import './styles/Storage.css';
import { StorageFile, StorageFolder, storageApi } from '../../api/storage';
import { useStoragePermissions } from '../../api/utils/useStoragePermissions';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
                    const recentFiles = await storageApi.getRecentFiles();
                    fetchedFiles = Array.isArray(recentFiles) ? recentFiles : [];
                    break;

                case 'favorites':
                    const favorites = await storageApi.getFavorites();
                    fetchedFolders = Array.isArray(favorites)
                        ? favorites.filter(f => f?.folder).map(f => f.folder!)
                        : [];
                    fetchedFiles = Array.isArray(favorites)
                        ? favorites.filter(f => f?.file).map(f => f.file!)
                        : [];
                    break;

                case 'statistics':
                    break;

                case 'trash':
                    [fetchedFolders, fetchedFiles] = await Promise.all([
                        storageApi.getTrashFolders(),
                        storageApi.getTrashFiles()
                    ]);
                    fetchedFolders = Array.isArray(fetchedFolders) ? fetchedFolders : [];
                    fetchedFiles = Array.isArray(fetchedFiles) ? fetchedFiles : [];
                    break;
            }

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
        if (!Array.isArray(items)) {
            return [];
        }

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

    const handleUploadFiles = async (uploadedFiles: StorageFile[]) => {
        try {
            // Просто обновляем состояние, НЕ загружаем снова
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
            <div className="storage-container">
                <div className="storage-access-denied">
                    <h2>Доступ запрещен</h2>
                    <p>У вас нет прав для просмотра хранилища файлов.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`storage-container ${sidebarVisible ? 'storage-with-sidebar' : 'storage-sidebar-hidden'}`}>
            <div className="storage-main-content">
                <div className="storage-header">
                    <div className="storage-header-left">
                        <Breadcrumbs
                            currentFolder={currentFolder}
                            onNavigateUp={handleNavigateUp}
                            onFolderClick={handleFolderClick}
                        />
                    </div>

                    <div className="storage-header-right">
                        <div className="storage-search-box">
                            <input
                                type="text"
                                placeholder="Поиск файлов и папок..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="storage-search-input"
                            />
                            <button className="storage-search-button">
                                <i className="fas fa-search"></i>
                            </button>
                        </div>

                        <div className="storage-sort-controls">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="storage-sort-select"
                            >
                                <option value="date">По дате</option>
                                <option value="name">По имени</option>
                                <option value="size">По размеру</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="storage-sort-order-button"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>

                        {permissions.canUploadFiles && (
                            <button
                                className="storage-upload-button-inline"
                                onClick={() => setIsUploadModalOpen(true)}
                            >
                                <i className="fas fa-cloud-upload-alt"></i> Загрузить файлы
                            </button>
                        )}

                        {permissions.canCreateFolders && (
                            <button
                                onClick={() => setIsCreateFolderModalOpen(true)}
                                className="storage-create-folder-button"
                            >
                                <i className="fas fa-folder-plus"></i> Новая папка
                            </button>
                        )}

                        <button
                            onClick={toggleSidebar}
                            className="storage-toggle-sidebar-button"
                            title={sidebarVisible ? 'Скрыть панель' : 'Показать панель'}
                        >
                            {sidebarVisible ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>

                        {selectedItems.length > 0 && (
                            <div className="storage-selection-actions">
                                <span className="storage-selection-count">
                                    Выбрано: {selectedItems.length}
                                </span>
                                <button
                                    onClick={() => handleDeleteItems(selectedItems)}
                                    className="storage-delete-selected-button"
                                    disabled={!selectedItems.every(item => permissions.canDeleteItem(item))}
                                >
                                    Удалить
                                </button>
                                {activeView === 'trash' && (
                                    <button
                                        onClick={() => handleRestoreItems(selectedItems)}
                                        className="storage-restore-selected-button"
                                    >
                                        Восстановить
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="storage-content-area">
                    {loading ? (
                        <div className="storage-loading">
                            <div className="storage-spinner"></div>
                            <p>Загрузка...</p>
                        </div>
                    ) : error ? (
                        <div className="storage-error">
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>{error}</p>
                            <button onClick={loadData} className="storage-retry-button">
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
                                    onUploadClick={() => setIsUploadModalOpen(true)}
                                    onCreateFolderClick={() => setIsCreateFolderModalOpen(true)}
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
                                    onRefresh={() => { }}
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

                <div className="storage-info">
                    <div className="storage-usage">
                        <div className="storage-usage-bar">
                            <div
                                className="storage-usage-fill"
                                style={{
                                    width: `${permissions.usedStorage && permissions.storageQuota
                                        ? (permissions.usedStorage / permissions.storageQuota) * 100
                                        : 0}%`
                                }}
                            ></div>
                        </div>
                        <span className="storage-usage-text">
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

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default Storage;