// components/storage/FileItem/FileItemList.tsx
import React from 'react';
import FileIcon from './FileIcon';
import FileMetaInfo from './FileMetaInfo';
import FileActions from './FileActions';
import { formatBytes } from './utils/fileUtils';
import { formatDate } from './utils/dateUtils';

interface FileItemListProps {
    file: any;
    isSelected: boolean;
    isHovered: boolean;
    setIsHovered: (hovered: boolean) => void;
    onSelect: () => void;
    handleFileClick: (e: React.MouseEvent) => void;
    handleDownload: (e: React.MouseEvent) => void;
    handleContextMenu: (e: React.MouseEvent) => void;
    fileRef: React.RefObject<HTMLDivElement>;
    permissions: any;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
}

const FileItemList: React.FC<FileItemListProps> = ({
    file,
    isSelected,
    isHovered,
    setIsHovered,
    onSelect,
    handleFileClick,
    handleDownload,
    handleContextMenu,
    fileRef,
    permissions,
    onDragStart,
    onDragEnd
}) => {
    return (
        <div
            ref={fileRef}
            className={`storage-file-list-item ${isSelected ? 'selected' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={handleContextMenu}
            draggable={permissions.canMoveItem?.(file) || true}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="storage-file-list-select">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="storage-file-list-checkbox"
                    onClick={(e) => e.stopPropagation()}
                    title="Выбрать файл"
                />
            </div>

            <div className="storage-file-list-icon-wrapper" onClick={handleFileClick}>
                <FileIcon
                    file={file}
                    viewMode="list"
                    onClick={handleFileClick}
                    showBadges={false}
                />
            </div>

            <div className="storage-file-list-content" onClick={handleFileClick}>
                <div className="storage-file-list-header">
                    <h4 className="storage-file-list-name" title={file.name}>
                        {file.name}
                    </h4>
                    {(file.is_pinned || file.is_favorite) && (
                        <div className="storage-file-list-badges">
                            {file.is_pinned && (
                                <span className="storage-file-list-pin-badge" title="Закреплен">
                                    <i className="fas fa-thumbtack"></i>
                                </span>
                            )}
                            {file.is_favorite && (
                                <span className="storage-file-list-favorite-badge" title="В избранном">
                                    <i className="fas fa-star"></i>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="storage-file-list-meta">
                    <span className="storage-file-list-extension">
                        {file.extension?.toUpperCase() || 'Файл'}
                    </span>
                    <span className="storage-file-list-separator">•</span>
                    <span className="storage-file-list-size">
                        {formatBytes(file.size || 0)}
                    </span>
                    <span className="storage-file-list-separator">•</span>
                    <span className="storage-file-list-date">
                        <i className="fas fa-calendar-alt"></i>
                        {formatDate(file.created_at || file.uploaded_at || file.updated_at)}
                    </span>
                </div>
            </div>

            <div className="storage-file-list-stats">
                <div className="storage-file-list-downloads" title="Количество скачиваний">
                    <i className="fas fa-download"></i>
                    <span>{file.download_count || 0}</span>
                </div>
                <div className="storage-file-list-modified">
                    <i className="fas fa-clock"></i>
                    <span>{formatDate(file.updated_at, 'time')}</span>
                </div>
            </div>

            <div className="storage-file-list-actions">
                <FileActions
                    viewMode="list"
                    onDownload={handleDownload}
                    isVisible={permissions.canDownloadFiles}
                />
            </div>
        </div>
    );
};

export default FileItemList;