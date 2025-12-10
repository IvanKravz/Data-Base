// components/storage/FileItem/FileMetaInfo.tsx - Updated
import React from 'react';

interface FileMetaInfoProps {
    file: any;
    viewMode: 'list' | 'grid';
    onClick: (e: React.MouseEvent) => void;
}

const FileMetaInfo: React.FC<FileMetaInfoProps> = ({ file, viewMode, onClick }) => {
    const getFileExtension = (): string => {
        const extension = file.extension || file.name?.split('.').pop() || '';
        return extension.toUpperCase();
    };

    if (viewMode === 'grid') {
        const fileName = file.name || '';
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
        const ext = getFileExtension();
        
        return (
            <div className="storage-file-info">
                <h4
                    className="storage-file-name"
                    onClick={onClick}
                    title={file.name}
                >
                    {nameWithoutExt}
                </h4>
                {ext && (
                    <div className="storage-file-extension">
                        {ext}
                    </div>
                )}
            </div>
        );
    }

    // For list view, we'll handle it differently
    if (viewMode === 'list') {
        const fileName = file.name || '';
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
        const ext = getFileExtension();
        
        return (
            <div className="storage-file-main" onClick={onClick}>
                <h4 className="storage-file-name-list" title={file.name}>
                    {nameWithoutExt}
                    {ext && <span className="storage-file-extension-list">{ext}</span>}
                </h4>
            </div>
        );
    }

    return null;
};

export default FileMetaInfo;