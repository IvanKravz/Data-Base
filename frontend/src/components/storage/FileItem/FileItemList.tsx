// components/storage/FileItem/FileItemList.tsx
import React from 'react';
import { FaThumbtack, FaStar, FaDownload } from 'react-icons/fa';
import FileIcon from './FileIcon';
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
    imageUrl: string | null;
    imageLoading: boolean;
    imageError: boolean;
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
    imageUrl,
    imageLoading,
    imageError
}) => {
    const getFileExtension = (): string => {
        const extension = file.extension || file.name?.split('.').pop() || '';
        return extension.toUpperCase();
    };

    const getFileType = () => {
        return getFileExtension() || file.type?.split('/')[1]?.toUpperCase() || 'ФАЙЛ';
    };

    return (
        <div
            ref={fileRef}
            className={`storage-file-item storage-file-list ${isSelected ? 'selected' : ''}`}
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
                />
            </div>

            <FileIcon
                file={file}
                viewMode="list"
                imageUrl={imageUrl}
                imageLoading={imageLoading}
                imageError={imageError}
                onClick={handleFileClick}
                showBadges={false}
            />

            <div className="storage-file-main" onClick={handleFileClick}>
                <h4 className="storage-file-name-list" title={file.name}>
                    {file.name}
                    {file.is_pinned && (
                        <span className="storage-file-pin-indicator">
                            <FaThumbtack size={12} />
                        </span>
                    )}
                    {file.is_favorite && (
                        <span className="storage-file-favorite-indicator">
                            <FaStar size={12} />
                        </span>
                    )}
                </h4>

                <div className="storage-file-details">
                    <span className="storage-file-type-list">
                        {getFileType()}
                    </span>
                    <span className="storage-file-separator">•</span>
                    <span className="storage-file-owner">
                        {file.uploaded_by?.username || file.owner?.username || 'Неизвестно'}
                    </span>
                    <span className="storage-file-separator">•</span>
                    <span className="storage-file-modified">
                        Изменен: {formatDate(file.modified_at || file.created_at || file.uploaded_at)}
                    </span>
                </div>
            </div>

            <div className="storage-file-secondary">
                <span className="storage-file-size-list">
                    {formatBytes(file.size || 0)}
                </span>
                <span className="storage-file-date-list">
                    {formatDate(file.created_at || file.uploaded_at)}
                </span>
                <span className="storage-file-downloads-list">
                    <FaDownload size={10} />
                    {file.download_count || 0}
                </span>
            </div>

            {(isHovered || isSelected) && (
                <div className="storage-file-actions-list">
                    <button
                        className="storage-file-download-btn"
                        onClick={handleDownload}
                        title="Скачать файл"
                    >
                        <FaDownload size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileItemList;