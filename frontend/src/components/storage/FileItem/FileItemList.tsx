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
            className={`storage-file-item storage-file-list ${isSelected ? 'selected' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={handleContextMenu}
            draggable={permissions.canMoveItem?.(file) || true}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="storage-file-select">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="storage-file-checkbox"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            <FileIcon
                file={file}
                viewMode="list"
                onClick={handleFileClick}
                showBadges={false}
            />

            <FileMetaInfo
                file={file}
                viewMode="list"
                onClick={handleFileClick}
            />

            <div className="storage-file-details">
                <span className="storage-file-size-list">
                    {formatBytes(file.size || 0)}
                </span>
                <span className="storage-file-date-list">
                    {formatDate(file.created_at || file.uploaded_at || file.updated_at)}
                </span>
                <span className="storage-file-downloads-list">
                    <i className="fas fa-download" style={{ fontSize: '10px' }}></i>
                    {file.download_count || 0}
                </span>
            </div>

            <FileActions
                viewMode="list"
                onDownload={handleDownload}
                isVisible={permissions.canDownloadFiles}
            />
        </div>
    );
};

export default FileItemList;