// components/storage/FileExplorer.tsx
import React, { useState, useMemo } from 'react';
import FolderItem from './FolderItem';
import FileItem from './FileItem/FileItem';
import './styles/FileExplorer.css';
import { StorageFile, StorageFolder } from '../../api/storage';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';

interface FileExplorerProps {
    folders: StorageFolder[];
    files: StorageFile[];
    currentFolder: StorageFolder | null;
    onFolderClick: (folder: StorageFolder) => void;
    onFileClick: (file: StorageFile) => void;
    viewMode: 'list' | 'grid';
    selectedItems: Array<StorageFolder | StorageFile>;
    onSelectItems: (items: Array<StorageFolder | StorageFile>) => void;
    permissions: StoragePermissions;
    viewType: 'personal' | 'work';
    onMoveItem: (itemId: number, targetFolderId: number | null, isFolder: boolean) => Promise<void>;
    onDeleteItem?: (itemId: number, isFolder: boolean) => void;
    onUploadClick?: () => void;
    onCreateFolderClick?: () => void;
    onDeleteSelected?: () => void;
    onDownloadSelected?: () => void;
    onFilesDrop?: (files: File[]) => Promise<void>;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
    folders,
    files,
    currentFolder,
    onFolderClick,
    onFileClick,
    viewMode,
    selectedItems,
    onSelectItems,
    permissions,
    viewType,
    onMoveItem,
    onDeleteItem,
    onUploadClick,
    onCreateFolderClick,
    onDeleteSelected,
    onDownloadSelected,
    onFilesDrop
}) => {
    const [dragOver, setDragOver] = useState(false);
    const [draggedItem, setDraggedItem] = useState<any>(null);

    const { pinnedFolders, regularFolders, pinnedFiles, regularFiles, totalSize } = useMemo(() => {
        const pinnedFolders = folders.filter(f => f.is_pinned);
        const regularFolders = folders.filter(f => !f.is_pinned);
        const pinnedFiles = files.filter(f => f.is_pinned);
        const regularFiles = files.filter(f => !f.is_pinned);
        const totalSize = selectedItems.reduce((sum, item) => sum + (item.size || 0), 0);
        return { pinnedFolders, regularFolders, pinnedFiles, regularFiles, totalSize };
    }, [folders, files, selectedItems]);

    const handleSelectAll = () => {
        const allItems = [...folders, ...files];
        onSelectItems(allItems);
    };

    const handleClearSelection = () => {
        onSelectItems([]);
    };

    const handleItemSelect = (item: StorageFolder | StorageFile) => {
        const isSelected = selectedItems.some(selected => selected.id === item.id);
        if (isSelected) {
            onSelectItems(selectedItems.filter(selected => selected.id !== item.id));
        } else {
            onSelectItems([...selectedItems, item]);
        }
    };

    const handleDragStart = (e: React.DragEvent, item: any) => {
        setDraggedItem(item);
        e.dataTransfer.setData('text/plain', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
        const target = e.target as HTMLElement;
        target.style.opacity = '0.6';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const relatedTarget = e.relatedTarget as Node;
        const currentTarget = e.currentTarget as Node;
        if (!currentTarget.contains(relatedTarget)) {
            setDragOver(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && onFilesDrop) {
            await onFilesDrop(files);
        }
    };

    const formatTotalSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div
            className={`file-explorer ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Панель управления */}
            <div className="controls">
                <div className="control-buttons">
                    <button
                        onClick={handleSelectAll}
                        className="control-button"
                        disabled={folders.length + files.length === 0}
                        title="Выбрать все элементы"
                    >
                        <i className="fas fa-check-square"></i>
                        Выбрать все
                    </button>
                    <button
                        onClick={handleClearSelection}
                        className="control-button"
                        disabled={selectedItems.length === 0}
                        title="Снять выделение"
                    >
                        <i className="fas fa-times-circle"></i>
                        Снять выделение
                    </button>

                    {selectedItems.length > 0 && onDownloadSelected && (
                        <button
                            onClick={onDownloadSelected}
                            className="control-button"
                            title="Скачать выбранные"
                        >
                            <i className="fas fa-download"></i>
                            Скачать
                        </button>
                    )}

                    {selectedItems.length > 0 && onDeleteSelected && (
                        <button
                            onClick={onDeleteSelected}
                            className="control-button"
                            style={{ color: 'var(--file-explorer-error)' }}
                            title="Удалить выбранные"
                        >
                            <i className="fas fa-trash"></i>
                            Удалить
                        </button>
                    )}
                </div>

                {selectedItems.length > 0 && (
                    <div className="selection-info">
                        <span>
                            Выбрано: <strong>{selectedItems.length}</strong> элементов
                        </span>
                        <span className="selection-size">
                            <i className="fas fa-hdd"></i> {formatTotalSize(totalSize)}
                        </span>
                    </div>
                )}
            </div>

            {/* Закрепленные папки */}
            {pinnedFolders.length > 0 && (
                <div className="section">
                    <h3 className="section-title">
                        <i className="fas fa-thumbtack"></i> Закрепленные папки
                        <span className="counter-badge">{pinnedFolders.length}</span>
                    </h3>
                    <div className={viewMode === 'grid' ? 'folders-grid-view' : 'list-view'}>
                        {pinnedFolders.map(folder => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                viewMode={viewMode}
                                isSelected={selectedItems.some(item => item.id === folder.id)}
                                onSelect={() => handleItemSelect(folder)}
                                onClick={() => onFolderClick(folder)}
                                onDragStart={(e) => handleDragStart(e, folder)}
                                onDragEnd={handleDragEnd}
                                permissions={permissions}
                                viewType={viewType}
                                onMoveItem={onMoveItem}
                                onDeleteItem={(folderId) => onDeleteItem?.(folderId, true)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Папки */}
            {regularFolders.length > 0 && (
                <div className="section">
                    <h3 className="section-title">
                        <i className="fas fa-folder"></i> Папки
                        <span className="counter-badge">{regularFolders.length}</span>
                    </h3>
                    <div className={viewMode === 'grid' ? 'folders-grid-view' : 'list-view'}>
                        {regularFolders.map(folder => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                viewMode={viewMode}
                                isSelected={selectedItems.some(item => item.id === folder.id)}
                                onSelect={() => handleItemSelect(folder)}
                                onClick={() => onFolderClick(folder)}
                                onDragStart={(e) => handleDragStart(e, folder)}
                                onDragEnd={handleDragEnd}
                                permissions={permissions}
                                viewType={viewType}
                                onMoveItem={onMoveItem}
                                onDeleteItem={(folderId) => onDeleteItem?.(folderId, true)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Закрепленные файлы */}
            {pinnedFiles.length > 0 && (
                <div className="section">
                    <h3 className="section-title">
                        <i className="fas fa-thumbtack"></i> Закрепленные файлы
                        <span className="counter-badge">{pinnedFiles.length}</span>
                    </h3>
                    <div className={viewMode === 'grid' ? 'files-grid-view' : 'list-view'}>
                        {pinnedFiles.map(file => (
                            <FileItem
                                key={file.id}
                                file={file}
                                viewMode={viewMode}
                                isSelected={selectedItems.some(item => item.id === file.id)}
                                onSelect={() => handleItemSelect(file)}
                                onClick={() => onFileClick(file)}
                                onDragStart={(e) => handleDragStart(e, file)}
                                onDragEnd={handleDragEnd}
                                permissions={permissions}
                                viewType={viewType}
                                onMoveItem={onMoveItem}
                                onDeleteItem={(fileId) => onDeleteItem?.(fileId, false)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Файлы */}
            {regularFiles.length > 0 && (
                <div className="section">
                    <h3 className="section-title">
                        <i className="fas fa-file"></i> Файлы
                        <span className="counter-badge">{regularFiles.length}</span>
                    </h3>
                    <div className={viewMode === 'grid' ? 'files-grid-view' : 'list-view'}>
                        {regularFiles.map(file => (
                            <FileItem
                                key={file.id}
                                file={file}
                                viewMode={viewMode}
                                isSelected={selectedItems.some(item => item.id === file.id)}
                                onSelect={() => handleItemSelect(file)}
                                onClick={() => onFileClick(file)}
                                onDragStart={(e) => handleDragStart(e, file)}
                                onDragEnd={handleDragEnd}
                                permissions={permissions}
                                viewType={viewType}
                                onMoveItem={onMoveItem}
                                onDeleteItem={(fileId) => onDeleteItem?.(fileId, false)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Пустое состояние */}
            {folders.length === 0 && files.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <i className="fas fa-folder-open"></i>
                    </div>
                    <h3>{currentFolder ? 'Папка пуста' : 'Хранилище пусто'}</h3>
                    <p>
                        {currentFolder
                            ? 'Добавьте файлы или создайте новую папку'
                            : 'Начните с загрузки файлов или создания папок'
                        }
                    </p>
                    {permissions.canUploadFiles && (
                        <div className="empty-state-actions">
                            <button
                                className="upload-button"
                                onClick={onUploadClick}
                            >
                                <i className="fas fa-upload"></i> Загрузить файлы
                            </button>
                            {permissions.canCreateFolders && (
                                <button
                                    className="create-folder-button"
                                    onClick={onCreateFolderClick}
                                >
                                    <i className="fas fa-folder-plus"></i> Создать папку
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Зона перетаскивания */}
            {dragOver && (
                <div className="drop-zone">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <p>Отпустите файлы для загрузки</p>
                    <p className="subtext">Файлы будут загружены в текущую папку</p>
                </div>
            )}
        </div>
    );
};

export default FileExplorer;