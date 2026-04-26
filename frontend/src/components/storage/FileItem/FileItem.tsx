// components/storage/FileItem/FileItem.tsx
import React, { useState, useRef } from 'react';
import FileItemGrid from './FileItemGrid';
import FileItemList from './FileItemList';
import FileActionsMenu from '../FileActionsMenu';
import { useFileHandlers } from './hooks/useFileHandlers';
import { StoragePermissions } from '../../../api/utils/useStoragePermissions';
import { StorageFile } from '../../../api/storage';
import '../styles/FileItem.css';

interface FileItemProps {
    file: StorageFile;
    viewMode: 'list' | 'grid';
    isSelected: boolean;
    onSelect: () => void;
    onClick: () => void;
    onDownload: () => void;
    permissions: StoragePermissions;
    viewType: 'personal' | 'work';
    onMoveItem: (itemId: number, targetFolderId: number | null, isFolder: boolean) => Promise<void>;
    onDeleteItem?: (fileId: number) => void;
    onDragStart?: (e: React.DragEvent, item: StorageFile) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    onRefreshFavorites?: () => void;
}

const FileItem: React.FC<FileItemProps> = ({
    file,
    viewMode,
    isSelected,
    onSelect,
    onClick,
    onDownload,
    permissions,
    viewType,
    onMoveItem,
    onDeleteItem,
    onDragStart,
    onDragEnd,
    onRefreshFavorites,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const fileRef = useRef<HTMLDivElement>(null);

    const {
        handleFileClick,
        handleDownload,
    } = useFileHandlers({
        file,
        onClick,
        onDownload,
        onContextMenu: undefined,
        setContextMenuPosition: setMenuPosition,
        setShowContextMenu: setShowActionsMenu
    });

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!permissions.canEditItem(file) && !permissions.canDeleteItem(file)) return;
        const { clientX, clientY } = e;
        setMenuPosition({ x: clientX, y: clientY });
        setShowActionsMenu(true);
    };

    const closeContextMenu = () => setShowActionsMenu(false);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(file));
        e.dataTransfer.effectAllowed = 'move';
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '0.4';
        if (onDragStart) onDragStart(e, file);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        if (onDragEnd) onDragEnd(e);
    };

    const commonProps = {
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
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd
    };

    return (
        <>
            {viewMode === 'grid' ? (
                <FileItemGrid {...commonProps} />
            ) : (
                <FileItemList {...commonProps} />
            )}

            {showActionsMenu && (
                <FileActionsMenu
                    file={file}
                    position={menuPosition}
                    onClose={closeContextMenu}
                    permissions={permissions}
                    viewType={viewType}
                    onMove={(targetId) => onMoveItem(file.id, targetId, false)}
                    onDelete={onDeleteItem}
                    onRefreshFavorites={onRefreshFavorites}
                />
            )}
        </>
    );
};

export default FileItem;