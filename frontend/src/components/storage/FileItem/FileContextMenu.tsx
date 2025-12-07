// components/storage/FileItem/FileContextMenu.tsx
import React, { useEffect } from 'react';
import { FaEye, FaDownload, FaEdit, FaCopy, FaShare, FaTrash } from 'react-icons/fa';

interface FileContextMenuProps {
    showContextMenu: boolean;
    contextMenuPosition: { x: number; y: number };
    contextMenuRef: React.RefObject<HTMLDivElement>;
    file: any;
    onClose: () => void;
    onOpen: (e: React.MouseEvent) => void;
    onDownload: (e: React.MouseEvent) => void;
    onRename?: (file: any) => void;
    onCopy?: (file: any) => void;
    onShare?: (file: any) => void;
    onDelete?: (file: any) => void;
}

const FileContextMenu: React.FC<FileContextMenuProps> = ({
    showContextMenu,
    contextMenuPosition,
    contextMenuRef,
    file,
    onClose,
    onOpen,
    onDownload,
    onRename,
    onCopy,
    onShare,
    onDelete
}) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (showContextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showContextMenu, onClose, contextMenuRef]);

    if (!showContextMenu) return null;

    return (
        <div 
            ref={contextMenuRef}
            className="storage-file-context-menu"
            style={{
                position: 'fixed',
                top: `${contextMenuPosition.y}px`,
                left: `${contextMenuPosition.x}px`,
                zIndex: 1000
            }}
        >
            <div 
                className="storage-file-context-menu-item"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpen(e);
                    onClose();
                }}
            >
                <FaEye /> Открыть
            </div>
            
            <div 
                className="storage-file-context-menu-item"
                onClick={(e) => {
                    e.stopPropagation();
                    onDownload(e);
                    onClose();
                }}
            >
                <FaDownload /> Скачать
            </div>
            
            {onRename && (
                <div 
                    className="storage-file-context-menu-item"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRename(file);
                        onClose();
                    }}
                >
                    <FaEdit /> Переименовать
                </div>
            )}
            
            {onCopy && (
                <div 
                    className="storage-file-context-menu-item"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopy(file);
                        onClose();
                    }}
                >
                    <FaCopy /> Копировать
                </div>
            )}
            
            {onShare && (
                <div 
                    className="storage-file-context-menu-item"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare(file);
                        onClose();
                    }}
                >
                    <FaShare /> Поделиться
                </div>
            )}
            
            {onDelete && (
                <div 
                    className="storage-file-context-menu-item"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file);
                        onClose();
                    }}
                    style={{ color: '#ff4757' }}
                >
                    <FaTrash /> Удалить
                </div>
            )}
        </div>
    );
};

export default FileContextMenu;