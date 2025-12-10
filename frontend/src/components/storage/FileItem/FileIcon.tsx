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

    console.log('FileIcon Render:', {
        fileName: file.name,
        isImage,
        imageUrl,
        imageLoading,
        imageError,
        mime_type: file.mime_type,
        extension: file.extension
    });

    const renderIconContent = () => {
        // Если это изображение и есть URL для превью без ошибок
        if (isImage && imageUrl && !imageError) {
            console.log('Rendering image preview:', imageUrl);
            return (
                <>
                    <img
                        src={imageUrl}
                        alt={file.name}
                        className={`${viewMode === 'grid' ? 'storage-file-image-preview' : 'storage-file-thumbnail'}`}
                        style={{
                            opacity: imageLoading ? 0 : 1,
                            transition: 'opacity 0.3s ease'
                        }}
                        loading="lazy"
                        onLoad={() => console.log('Image loaded in img tag')}
                        onError={(e) => {
                            console.error('Image failed to load in img tag:', e);
                            // Если изображение не загрузилось, покажем fallback иконку
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

        // Fallback для изображений (когда нет URL или есть ошибка)
        if (isImage) {
            console.log('Rendering image fallback icon');
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

        // Для обычных файлов
        console.log('Rendering regular file icon');
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