// components/storage/FileItem/FileItem.tsx
import React, { useState, useRef } from 'react';
import FileItemGrid from './FileItemGrid';
import FileItemList from './FileItemList';
import FileActionsMenu from '../FileActionsMenu'; // Изменено: импортируем FileActionsMenu
import { useFileHandlers } from './hooks/useFileHandlers';
import { useFileImage } from './hooks/useFileImage';
import { StoragePermissions } from '../../../api/utils/useStoragePermissions';
import '../styles/FileItem.css';

interface FileItemProps {
    file: any;
    viewMode: 'list' | 'grid';
    isSelected: boolean;
    onSelect: () => void;
    onClick: () => void;
    onDownload: () => void;
    permissions: StoragePermissions;
}

const FileItem: React.FC<FileItemProps> = ({
    file,
    viewMode,
    isSelected,
    onSelect,
    onClick,
    onDownload,
    permissions
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false); // Изменено: переименовано
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 }); // Изменено: переименовано

    const fileRef = useRef<HTMLDivElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    const { imageUrl } = useFileImage(file);

    const {
        handleFileClick,
        handleDownload,
        handleContextMenu: originalHandleContextMenu
    } = useFileHandlers({
        file,
        imageUrl,
        onClick,
        onDownload,
        onContextMenu: undefined,
        setContextMenuPosition: setMenuPosition, // Изменено: передаем setMenuPosition
        setShowContextMenu: setShowActionsMenu // Изменено: передаем setShowActionsMenu
    });

    // Создаем новый обработчик контекстного меню для файлов
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!permissions.canEditItem(file) && !permissions.canDeleteItem(file)) return;

        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowActionsMenu(true);
    };

    const closeContextMenu = () => setShowActionsMenu(false);

    const commonProps = {
        file,
        isSelected,
        isHovered,
        setIsHovered,
        onSelect,
        handleFileClick,
        handleDownload,
        handleContextMenu, // Используем новый обработчик
        fileRef,
        imageUrl,
        permissions
    };

    return (
        <>
            {viewMode === 'grid' ? (
                <FileItemGrid {...commonProps} />
            ) : (
                <FileItemList {...commonProps} />
            )}

            {showActionsMenu && (
                <FileActionsMenu // Изменено: используем FileActionsMenu вместо FileContextMenu
                    file={file}
                    position={menuPosition}
                    onClose={closeContextMenu}
                    permissions={permissions}
                />
            )}
        </>
    );
};

export default FileItem;