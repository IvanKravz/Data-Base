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
    imageUrl: string | null;
    imageLoading: boolean;
    imageError: boolean;
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
    imageUrl,
    imageLoading,
    imageError
}) => {
    return (
        <div
            ref={fileRef}
            className={`storage-file-item storage-file-grid ${isSelected ? 'selected' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={handleContextMenu} 
        >
            <div className="storage-file-select">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="storage-file-checkbox"
                    title="Выбрать файл"
                />
            </div>

            <FileIcon
                file={file}
                viewMode="grid"
                imageUrl={imageUrl}
                imageLoading={imageLoading}
                imageError={imageError}
                onClick={handleFileClick}
                showBadges={true}
            />

            <FileMetaInfo
                file={file}
                viewMode="grid"
                onClick={handleFileClick}
            />

            {/* Убираем условие для тестирования */}
            <FileActions
                viewMode="grid"
                onDownload={handleDownload}
                isVisible={true}
            />
        </div>
    );
};

export default FileItemGrid;