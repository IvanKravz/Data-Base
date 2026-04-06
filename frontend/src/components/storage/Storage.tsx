// components/storage/Storage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import FileExplorer from './FileExplorer';
import StorageSidebar from './StorageSidebar';
import Breadcrumbs from './Breadcrumbs';
import CreateFolderModal from './CreateFolderModal';
import UploadModal from './UploadModal';
import RecentFilesView from './RecentFilesView';
import FavoritesView from './FavoritesView';
import TrashView from './TrashView';
import './styles/Storage.css';
import { StorageFile, StorageFolder, storageApi } from '../../api/storage';
import { useStoragePermissions } from '../../api/utils/useStoragePermissions';
import { ChevronLeft, ChevronRight, Grid, List, Clock, Star, Trash2, FolderOpen } from 'lucide-react';

const Storage: React.FC = () => {
    const { folderId, subfolderId } = useParams<{ folderId?: string; subfolderId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const currentFolderId = subfolderId || folderId || null;

    const [currentFolder, setCurrentFolder] = useState<StorageFolder | null>(null);
    const [folders, setFolders] = useState<StorageFolder[]>([]);
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Array<StorageFolder | StorageFile>>([]);
    const [viewType, setViewType] = useState<'work' | 'personal'>('work');
    const [activeView, setActiveView] = useState<'explorer' | 'recent' | 'favorites' | 'trash'>('explorer');
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [viewModeRecent, setViewModeRecent] = useState<'grid' | 'list'>('list');

    const permissions = useStoragePermissions();

    // Определяем начальный тип хранилища на основе доступных типов
    useEffect(() => {
        if (permissions.canViewWork && permissions.canViewPersonal) {
            // Если доступны оба, оставляем текущий (или work по умолчанию)
            setViewType(prev => prev);
        } else if (permissions.canViewWork) {
            setViewType('work');
        } else if (permissions.canViewPersonal) {
            setViewType('personal');
        }
    }, [permissions.canViewWork, permissions.canViewPersonal]);

    useEffect(() => {
        if (!permissions.canViewStorage) {
            setError('У вас нет доступа к хранилищу файлов');
            setLoading(false);
            return;
        }
        loadData();
    }, [currentFolderId, viewType, sortBy, sortOrder, activeView]);

    useEffect(() => {
        if (currentFolderId) loadCurrentFolder();
        else setCurrentFolder(null);
    }, [currentFolderId]);

    const loadCurrentFolder = async () => {
        if (!currentFolderId) {
            setCurrentFolder(null);
            return;
        }
        try {
            const folder = await storageApi.getFolder(parseInt(currentFolderId));
            setCurrentFolder(folder);
            setError(null);
        } catch (err: any) {
            console.error('Error loading folder info:', err);
            if (err.response?.status === 404) {
                setError(`Папка с ID ${currentFolderId} не найдена. Возможно, она была удалена или у вас нет к ней доступа.`);
            } else {
                setError('Ошибка при загрузке папки');
            }
            setCurrentFolder(null);
        }
    };

    const sortItems = (items: Array<StorageFolder | StorageFile>) => {
        if (!Array.isArray(items)) return [];
        return [...items].sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortBy) {
                case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                case 'date': aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); break;
                case 'size': aVal = 'size' in a ? a.size : 0; bVal = 'size' in b ? b.size : 0; break;
                default: return 0;
            }
            return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
    };

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
                            parent_id: currentFolderId ? parseInt(currentFolderId) : 'root',
                            type: viewType,
                            ordering: sortBy === 'name' ? 'name' : '-created_at'
                        }),
                        storageApi.getFiles({
                            folder_id: currentFolderId ? parseInt(currentFolderId) : 'root',
                            type: viewType,
                            ordering: sortBy === 'name' ? 'name' : '-created_at'
                        })
                    ]);
                    break;
                case 'recent':
                    const recentResponse = await storageApi.getRecentFiles({ page: 1, page_size: 50 });
                    fetchedFiles = recentResponse?.files || (Array.isArray(recentResponse) ? recentResponse : []);
                    if (searchQuery.trim()) fetchedFiles = fetchedFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
                    fetchedFiles = sortItems(fetchedFiles) as StorageFile[];
                    break;
                case 'favorites':
                    const favoritesResponse = await storageApi.getFavorites();
                    fetchedFolders = favoritesResponse?.folders || [];
                    fetchedFiles = favoritesResponse?.files || [];
                    if (searchQuery.trim()) {
                        fetchedFolders = fetchedFolders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
                        fetchedFiles = fetchedFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
                    }
                    break;
                case 'trash':
                    const [trashFolders, trashFiles] = await Promise.all([
                        storageApi.getTrashFolders(),
                        storageApi.getTrashFiles()
                    ]);
                    fetchedFolders = trashFolders?.folders || (Array.isArray(trashFolders) ? trashFolders : []);
                    fetchedFiles = trashFiles?.files || (Array.isArray(trashFiles) ? trashFiles : []);
                    if (searchQuery.trim()) {
                        fetchedFolders = fetchedFolders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
                        fetchedFiles = fetchedFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
                    }
                    break;
            }

            if (activeView !== 'recent') {
                fetchedFolders = sortItems(fetchedFolders) as StorageFolder[];
                fetchedFiles = sortItems(fetchedFiles) as StorageFile[];
            }

            setFolders(fetchedFolders);
            setFiles(fetchedFiles);
        } catch (err: any) {
            console.error('Error loading storage data:', err);
            setError(err.message || 'Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = async (folder: StorageFolder) => {
        try {
            const folderInfo = await storageApi.getFolder(folder.id);
            if (folderInfo.parent_id) navigate(`/storage/${folderInfo.parent_id}/${folder.id}`);
            else navigate(`/storage/${folder.id}`);
        } catch (err: any) {
            console.error('Cannot access folder:', err);
            if (err.response?.status === 404) setError(`Папка "${folder.name}" не найдена или была удалена.`);
            else if (err.response?.status === 403) setError(`У вас нет прав доступа к папке "${folder.name}".`);
            else setError(`Ошибка при доступе к папке "${folder.name}": ${err.message}`);
            loadData();
        }
    };

    const handleNavigateUp = () => {
        if (subfolderId) navigate(`/storage/${folderId}`);
        else if (folderId) navigate('/storage');
    };

    const handleBreadcrumbClick = (folder: any | null) => {
        if (folder === null) navigate('/storage');
        else navigate(`/storage/${folder.id}`);
    };

    const handleCreateFolder = async (name: string, color?: string) => {
        try {
            const newFolder = await storageApi.createFolder({
                name,
                parent: currentFolderId ? parseInt(currentFolderId) : null,
                folder_type: viewType,
                color,
            });
            setFolders(prev => [...prev, newFolder]);
            setIsCreateFolderModalOpen(false);
        } catch (err: any) {
            setError(err.message || 'Ошибка при создании папки');
        }
    };

    const handleUploadFiles = async (uploadedFiles: StorageFile[]) => {
        setFiles(prev => [...prev, ...uploadedFiles]);
        setIsUploadModalOpen(false);
    };

    const handleDeleteItems = async (items: Array<StorageFolder | StorageFile>) => {
        if (!window.confirm(`Удалить выбранные элементы (${items.length})?`)) return;
        try {
            const folderIds = items.filter(i => 'folder_type' in i).map(i => i.id);
            const fileIds = items.filter(i => 'file_type' in i).map(i => i.id);
            if (folderIds.length) await Promise.all(folderIds.map(id => storageApi.softDeleteFolder(id)));
            if (fileIds.length) await Promise.all(fileIds.map(id => storageApi.softDeleteFile(id)));
            setFolders(prev => prev.filter(f => !folderIds.includes(f.id)));
            setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
            setSelectedItems([]);
        } catch (err: any) {
            setError(err.message || 'Ошибка при удалении элементов');
        }
    };

    const handleRestoreItems = async (items: Array<StorageFolder | StorageFile>) => {
        try {
            const folderIds = items.filter(i => 'folder_type' in i).map(i => i.id);
            const fileIds = items.filter(i => 'file_type' in i).map(i => i.id);
            if (folderIds.length) await Promise.all(folderIds.map(id => storageApi.restoreFolder(id)));
            if (fileIds.length) await Promise.all(fileIds.map(id => storageApi.restoreFile(id)));
            setFolders(prev => prev.filter(f => !folderIds.includes(f.id)));
            setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
            setSelectedItems([]);
        } catch (err: any) {
            setError(err.message || 'Ошибка при восстановлении элементов');
        }
    };

    const handleEmptyTrash = async () => {
        if (!window.confirm('Очистить корзину? Это действие нельзя отменить.')) return;
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
        if (!query.trim()) { loadData(); return; }
        if (activeView === 'explorer') {
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
        } else {
            loadData();
        }
    };

    const toggleSidebar = () => setSidebarVisible(!sidebarVisible);
    const toggleViewMode = () => setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
    const toggleViewModeRecent = () => setViewModeRecent(prev => prev === 'grid' ? 'list' : 'grid');
    const handleViewChange = (view: 'explorer' | 'recent' | 'favorites' | 'trash') => {
        setActiveView(view);
        setSelectedItems([]);
        if (searchQuery) setSearchQuery('');
    };

    const getViewTitle = () => {
        switch (activeView) {
            case 'recent': return 'Недавние файлы';
            case 'favorites': return 'Избранное';
            case 'trash': return 'Корзина';
            default: return null;
        }
    };

    const getViewIcon = () => {
        switch (activeView) {
            case 'recent': return <Clock size={20} />;
            case 'favorites': return <Star size={20} />;
            case 'trash': return <Trash2 size={20} />;
            default: return <FolderOpen size={20} />;
        }
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
                        {activeView === 'explorer' ? (
                            <Breadcrumbs currentFolder={currentFolder} onNavigateUp={handleNavigateUp} onFolderClick={handleBreadcrumbClick} />
                        ) : (
                            <div className="storage-view-header">
                                <div className="storage-view-icon">{getViewIcon()}</div>
                                <h2 className="storage-view-title">{getViewTitle()}</h2>
                                {activeView === 'recent' && files.length > 0 && (
                                    <span className="storage-view-count">
                                        {files.length} {files.length === 1 ? 'файл' : files.length < 5 ? 'файла' : 'файлов'}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="storage-header-right">
                        <div className="storage-search-box">
                            <input type="text" placeholder="Поиск файлов и папок..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="storage-search-input" />
                            <button className="storage-search-button"><i className="fas fa-search"></i></button>
                        </div>
                        {files.length > 0 && (
                            <div className="storage-sort-controls">
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="storage-sort-select">
                                    <option value="date">По дате</option>
                                    <option value="name">По имени</option>
                                    <option value="size">По размеру</option>
                                </select>
                                <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="storage-sort-order-button">{sortOrder === 'asc' ? '↑' : '↓'}</button>
                            </div>
                        )}
                        {activeView === 'explorer' && files.length > 0 && (
                            <button className="storage-view-toggle-button" onClick={toggleViewMode} title={viewMode === 'grid' ? 'Переключить на список' : 'Переключить на плитку'}>
                                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
                            </button>
                        )}
                        {activeView === 'recent' && files.length > 0 && (
                            <button className="storage-view-toggle-button" onClick={toggleViewModeRecent} title={viewModeRecent === 'grid' ? 'Переключить на список' : 'Переключить на плитку'}>
                                {viewModeRecent === 'grid' ? <List size={20} /> : <Grid size={20} />}
                            </button>
                        )}
                        {permissions.canUploadFiles && activeView === 'explorer' && (
                            <button className="storage-upload-button-inline" onClick={() => setIsUploadModalOpen(true)}><i className="fas fa-cloud-upload-alt"></i> Загрузить файлы</button>
                        )}
                        {permissions.canCreateFolders && activeView === 'explorer' && (
                            <button onClick={() => setIsCreateFolderModalOpen(true)} className="storage-create-folder-button"><i className="fas fa-folder-plus"></i> Новая папка</button>
                        )}
                        <button onClick={loadData} disabled={loading} className="storage-refresh-button" title="Обновить данные"><i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i></button>
                        <button onClick={toggleSidebar} className="storage-toggle-sidebar-button" title={sidebarVisible ? 'Скрыть панель' : 'Показать панель'}>
                            {sidebarVisible ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                        {selectedItems.length > 0 && (
                            <div className="storage-selection-actions">
                                <span className="storage-selection-count">Выбрано: {selectedItems.length}</span>
                                <button onClick={() => handleDeleteItems(selectedItems)} className="storage-delete-selected-button" disabled={!selectedItems.every(item => permissions.canDeleteItem(item))}>Удалить</button>
                                {activeView === 'trash' && (
                                    <button onClick={() => handleRestoreItems(selectedItems)} className="storage-restore-selected-button">Восстановить</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="storage-content-area">
                    {loading ? (
                        <div className="storage-loading"><div className="storage-spinner"></div><p>Загрузка...</p></div>
                    ) : error ? (
                        <div className="storage-error"><i className="fas fa-exclamation-triangle"></i><p>{error}</p><button onClick={loadData} className="storage-retry-button">Повторить попытку</button></div>
                    ) : (
                        <>
                            {activeView === 'explorer' && (
                                <FileExplorer
                                    folders={folders} files={files} currentFolder={currentFolder}
                                    onFolderClick={handleFolderClick} onFileClick={(file) => console.log('File clicked:', file)}
                                    viewMode={viewMode} selectedItems={selectedItems} onSelectItems={setSelectedItems}
                                    permissions={permissions} onUploadClick={() => setIsUploadModalOpen(true)} onCreateFolderClick={() => setIsCreateFolderModalOpen(true)}
                                />
                            )}
                            {activeView === 'recent' && <RecentFilesView files={files} viewMode={viewModeRecent} sortBy={sortBy} sortOrder={sortOrder} onFileClick={(file) => console.log('File clicked:', file)} permissions={permissions} />}
                            {activeView === 'favorites' && <FavoritesView folders={folders} files={files} onFolderClick={handleFolderClick} onFileClick={(file) => console.log('File clicked:', file)} permissions={permissions} />}
                            {activeView === 'trash' && <TrashView folders={folders} files={files} onRestore={handleRestoreItems} onDelete={handleDeleteItems} onEmptyTrash={handleEmptyTrash} permissions={permissions} />}
                        </>
                    )}
                </div>
                <div className="storage-info">
                    <div className="storage-usage">
                        <div className="storage-usage-bar"><div className="storage-usage-fill" style={{ width: `${permissions.usagePercentage}%` }}></div></div>
                        <span className="storage-usage-text">Использовано: {formatBytes(permissions.usedStorage)} / {permissions.storageQuota ? formatBytes(permissions.storageQuota) : '∞'}</span>
                    </div>
                </div>
            </div>
            {sidebarVisible && (
                <StorageSidebar
                    currentView={activeView} onViewChange={handleViewChange}
                    viewType={viewType} onViewTypeChange={setViewType}
                    permissions={permissions} onEmptyTrash={handleEmptyTrash}
                />
            )}
            {isCreateFolderModalOpen && <CreateFolderModal currentFolder={currentFolder} viewType={viewType} onCreate={handleCreateFolder} onClose={() => setIsCreateFolderModalOpen(false)} />}
            {isUploadModalOpen && <UploadModal currentFolder={currentFolder} viewType={viewType} maxFileSize={permissions.maxFileSize} onUpload={handleUploadFiles} onClose={() => setIsUploadModalOpen(false)} />}
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