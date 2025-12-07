// components/storage/FileItem/FileActions.tsx
import React from 'react';
import { FaDownload } from 'react-icons/fa';

interface FileActionsProps {
    viewMode: 'list' | 'grid';
    onDownload: (e: React.MouseEvent) => void;
    isVisible: boolean; // Добавляем пропс для видимости
}

const FileActions: React.FC<FileActionsProps> = ({ 
    viewMode, 
    onDownload,
    isVisible 
}) => {
    // Для отладки: всегда показываем кнопки
    if (true) { // Или isVisible
        if (viewMode === 'grid') {
            return (
                <div className="storage-file-actions">
                    <button
                        className="storage-file-download-btn"
                        onClick={onDownload}
                        title="Скачать файл"
                    >
                        <FaDownload size={14} />
                    </button>
                </div>
            );
        }

        return (
            <div className="storage-file-actions-list">
                <button
                    className="storage-file-download-btn"
                    onClick={onDownload}
                    title="Скачать файл"
                >
                    <FaDownload size={14} />
                </button>
            </div>
        );
    }

    return null;
};

export default FileActions;