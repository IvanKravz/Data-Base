// components/storage/FileItem/FileIcon.tsx
import React from 'react';
import { FaThumbtack, FaStar, FaImage } from 'react-icons/fa';
import { isImageFile } from './utils/fileUtils';
import { useFileIcon } from './hooks/useFileIcon';
import { useFileImage } from './hooks/useFileImage';

interface FileIconProps {
    file: any;
    viewMode: 'list' | 'grid';
    onClick: (e: React.MouseEvent) => void;
    showBadges: boolean;
}

const FileIcon: React.FC<FileIconProps> = ({
    file,
    viewMode,
    onClick,
    showBadges
}) => {
    const { getFileIcon, getIconColor } = useFileIcon();
    const { imageUrl, imageLoading, imageError } = useFileImage(file);
    const isImage = isImageFile(file);

    const renderIconContent = () => {
        if (isImage && imageUrl && !imageError) {
            return (
                <>
                    <img
                        src={imageUrl}
                        alt={file.name}
                        className={viewMode === 'grid' ? 'storage-file-image-preview' : 'storage-file-thumbnail'}
                        style={{
                            opacity: imageLoading ? 0 : 1,
                            transition: 'opacity 0.3s ease'
                        }}
                        loading="lazy"
                        onError={(e) => {
                            console.error('Image failed to load in img tag:', e);
                        }}
                    />
                    {imageLoading && (
                        <div className="storage-file-icon-loading">
                            <div className="storage-file-icon-spinner"></div>
                        </div>
                    )}
                </>
            );
        }

        if (isImage) {
            return (
                <div className="storage-file-icon-fallback">
                    <div className="storage-file-icon-fallback-icon">
                        <FaImage
                            size={viewMode === 'grid' ? 32 : 20}
                            style={{ color: '#4CAF50', opacity: 0.7 }}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div 
                className="storage-file-icon-default"
                style={{ color: getIconColor(file) }}
            >
                {getFileIcon(file, viewMode)}
            </div>
        );
    };

    const iconClassName = viewMode === 'grid' ? 'storage-file-icon' : 'storage-file-icon-list';

    return (
        <div className={iconClassName} onClick={onClick}>
            {renderIconContent()}

            {showBadges && (
                <div className="storage-file-badges-container">
                    {file.is_pinned && (
                        <span className="storage-file-pin-badge" title="Закреплено">
                            <FaThumbtack size={10} />
                        </span>
                    )}
                    {file.is_favorited && (
                        <span className="storage-file-favorite-badge" title="В избранном">
                            <FaStar size={10} />
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileIcon;