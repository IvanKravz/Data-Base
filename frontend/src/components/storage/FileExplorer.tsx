// components/storage/FileExplorer.tsx
import React, { useState } from 'react';
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
    onUploadClick?: () => void;
    onCreateFolderClick?: () => void;
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
    onUploadClick,
    onCreateFolderClick
}) => {
    const [dragOver, setDragOver] = useState(false);
    const [draggedItem, setDraggedItem] = useState<any>(null);

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
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        // Здесь можно обработать перемещение файла/папки
        if (draggedItem) {
            console.log('Dropped item:', draggedItem, 'into folder:', currentFolder?.id);
        }
    };

    const pinnedFolders = folders.filter(f => f.is_pinned);
    const regularFolders = folders.filter(f => !f.is_pinned);
    const pinnedFiles = files.filter(f => f.is_pinned);
    const regularFiles = files.filter(f => !f.is_pinned);

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
                    >
                        Выбрать все
                    </button>
                    <button
                        onClick={handleClearSelection}
                        className="control-button"
                        disabled={selectedItems.length === 0}
                    >
                        Снять выделение
                    </button>
                </div>

                {selectedItems.length > 0 && (
                    <div className="selection-info">
                        Выбрано элементов: {selectedItems.length}
                        <span className="selection-size">
                            Общий размер: {formatTotalSize(selectedItems)}
                        </span>
                    </div>
                )}
            </div>

            {/* Закрепленные папки */}
            {pinnedFolders.length > 0 && (
                <div className="section">
                    <h3 className="section-title">
                        <i className="fas fa-thumbtack"></i> Закрепленные папки
                    </h3>
                    <div className={viewMode === 'grid' ? 'grid-view' : 'list-view'}>
                        {pinnedFolders.map(folder => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                viewMode={viewMode}
                                isSelected={selectedItems.some(item => item.id === folder.id)}
                                onSelect={() => handleItemSelect(folder)}
                                onClick={() => onFolderClick(folder)}
                                onDragStart={(e) => handleDragStart(e, folder)}
                                permissions={permissions}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Папки */}
            {regularFolders.length > 0 && (
                <div className="section">
                    <h3 className="section-title">Папки ({regularFolders.length})</h3>
                    <div className={viewMode === 'grid' ? 'grid-view' : 'list-view'}>
                        {regularFolders.map(folder => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                viewMode={viewMode}
                                isSelected={selectedItems.some(item => item.id === folder.id)}
                                onSelect={() => handleItemSelect(folder)}
                                onClick={() => onFolderClick(folder)}
                                onDragStart={(e) => handleDragStart(e, folder)}
                                permissions={permissions}
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
                    </h3>
                    <div className={viewMode === 'grid' ? 'grid-view' : 'list-view'}>
                        {pinnedFiles.map(file => (
                            <FileItem
                                key={file.id}
                                file={file}
                                viewMode={viewMode}
                                isSelected={selectedItems.some(item => item.id === file.id)}
                                onSelect={() => handleItemSelect(file)}
                                onClick={() => onFileClick(file)}
                                onDragStart={(e) => handleDragStart(e, file)}
                                permissions={permissions}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Файлы */}
            {regularFiles.length > 0 && (
                <div className="section">
                    <h3 className="section-title">Файлы ({regularFiles.length})</h3>
                    <div className={viewMode === 'grid' ? 'grid-view' : 'list-view'}>
                        {regularFiles.map(file => (
                            <FileItem
                                key={file.id}
                                file={file}
                                viewMode={viewMode}
                                isSelected={selectedItems.some(item => item.id === file.id)}
                                onSelect={() => handleItemSelect(file)}
                                onClick={() => onFileClick(file)}
                                onDragStart={(e) => handleDragStart(e, file)}
                                permissions={permissions}
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
                    <h3>Папка пуста</h3>
                    <p>Добавьте файлы или создайте новую папку</p>
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
                    <p>Перетащите файлы сюда</p>
                </div>
            )}
        </div>
    );
};

// Вспомогательная функция для подсчета общего размера
const formatTotalSize = (items: Array<any>): string => {
    const totalBytes = items.reduce((total, item) => {
        return total + (item.size || 0);
    }, 0);

    if (totalBytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(totalBytes) / Math.log(k));

    return parseFloat((totalBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileExplorer;