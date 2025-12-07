// components/storage/FileItem/FileIcon.tsx (упрощенная версия)
import React, { useState, useEffect } from 'react';
import { FaThumbtack, FaStar, FaImage } from 'react-icons/fa';
import { isImageFile } from './utils/fileUtils';
import { useFileIcon } from './hooks/useFileIcon';

interface FileIconProps {
    file: any;
    viewMode: 'list' | 'grid';
    imageUrl: string | null;
    onClick: (e: React.MouseEvent) => void;
    showBadges: boolean;
}

const FileIcon: React.FC<FileIconProps> = ({
    file,
    viewMode,
    imageUrl,
    onClick,
    showBadges
}) => {
    const { getFileIcon, getIconColor } = useFileIcon();
    const isImage = isImageFile(file);
    
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Сброс состояния при изменении imageUrl
    useEffect(() => {
        if (imageUrl) {
            setImageLoading(true);
            setImageError(false);
        } else {
            setImageLoading(false);
            setImageError(true);
        }
    }, [imageUrl]);

    const renderIconContent = () => {
        if (isImage && imageUrl && !imageError) {
            return (
                <img
                    src={imageUrl}
                    alt={file.name}
                    className={`${viewMode === 'grid' ? 'storage-file-image-preview' : 'storage-file-thumbnail'}`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                    }}
                    style={{
                        opacity: imageLoading ? 0 : 1,
                        transition: 'opacity 0.3s ease'
                    }}
                    loading="lazy"
                />
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

    return (
        <div className={`storage-file-icon${viewMode === 'list' ? '-list' : ''}`} onClick={onClick}>
            {renderIconContent()}

            {isImage && imageLoading && imageUrl && !imageError && (
                <div className="storage-file-icon-loading">
                    <div className="storage-file-icon-spinner"></div>
                </div>
            )}

            {showBadges && file.is_pinned && (
                <span className="storage-file-pin-badge">
                    <FaThumbtack size={10} />
                </span>
            )}
            {showBadges && file.is_favorite && (
                <span className="storage-file-favorite-badge">
                    <FaStar size={10} />
                </span>
            )}
        </div>
    );
};

export default FileIcon;