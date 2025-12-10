// components/storage/FileItem/FileItemGrid.tsx
import React from 'react';
import FileIcon from './FileIcon';
import FileMetaInfo from './FileMetaInfo';
import FileActions from './FileActions';

interface FileItemGridProps {
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

const FileItemGrid: React.FC<FileItemGridProps> = ({
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
            className={`storage-file-item storage-file-grid ${isSelected ? 'selected' : ''}`}
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
                    title="Выбрать файл"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            <FileIcon
                file={file}
                viewMode="grid"
                onClick={handleFileClick}
                showBadges={true}
            />

            <FileMetaInfo
                file={file}
                viewMode="grid"
                onClick={handleFileClick}
            />

            <FileActions
                viewMode="grid"
                onDownload={handleDownload}
                isVisible={permissions.canDownloadFiles}
            />
        </div>
    );
};

export default FileItemGrid;