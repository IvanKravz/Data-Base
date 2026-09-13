// components/storage/FileItem/FileItemList.tsx
import React from 'react';
import { Square, CheckSquare, Star } from 'lucide-react';
import FileIcon from './FileIcon';
import { FaThumbtack } from 'react-icons/fa';
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
    onDragEnd,
}) => {
    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
    };

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
            {/* Чекбокс */}
            <div className="storage-file-list-select">
                <button
                    className="storage-file-checkbox-button"
                    onClick={handleCheckboxClick}
                    title="Выбрать файл"
                    type="button"
                >
                    {isSelected ? (
                        <CheckSquare size={16} className="checked" />
                    ) : (
                        <Square size={16} />
                    )}
                </button>
            </div>

            {/* Иконка файла */}
            <div className="storage-file-list-icon-wrapper" onClick={handleFileClick}>
                <FileIcon
                    file={file}
                    viewMode="list"
                    onClick={handleFileClick}
                    showBadges={false}
                />
            </div>

            {/* Основная информация – только название и бейджи */}
            <div className="storage-file-list-content" onClick={handleFileClick}>
                <div className="storage-file-list-header">
                    <h4 className="storage-file-list-name" title={file.name}>
                        {file.name}
                    </h4>
                    {(file.is_pinned || file.is_favorited) && (
                        <div className="storage-file-list-badges">
                            {file.is_pinned && (
                                <span className="storage-file-list-pin-badge" title="Закреплен">
                                    <FaThumbtack size={12} />
                                </span>
                            )}
                            {file.is_favorited && (
                                <span className="storage-file-list-favorite-badge" title="В избранном">
                                    <Star size={12} />
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {/* Метаданные удалены */}
            </div>

            {/* Правый блок – только кнопка скачивания */}
            <div className="storage-file-list-info">
                <div className="storage-file-list-actions">
                    <FileActions
                        viewMode="list"
                        onDownload={handleDownload}
                        isVisible={permissions.canDownloadFiles}
                    />
                </div>
            </div>
        </div>
    );
};

export default FileItemList;