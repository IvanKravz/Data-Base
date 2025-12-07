// components/storage/FileItem/FileMetaInfo.tsx
import React from 'react';
import { formatBytes } from './utils/fileUtils';
import { formatDate } from './utils/dateUtils';

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

    const getFileType = () => {
        return getFileExtension() || file.type?.split('/')[1]?.toUpperCase() || 'ФАЙЛ';
    };

    if (viewMode === 'grid') {
        return (
            <div className="storage-file-info">
                <h4
                    className="storage-file-name"
                    onClick={onClick}
                    title={file.name}
                >
                    {file.name}
                </h4>

                <div className="storage-file-meta">
                    <span className="storage-file-type">
                        {getFileType()}
                    </span>
                    <span className="storage-file-separator">•</span>
                    <span className="storage-file-date">
                        {formatDate(file.created_at || file.uploaded_at || file.modified_at)}
                    </span>
                </div>

                <div className="storage-file-stats">
                    <span className="storage-file-size">
                        {formatBytes(file.size || 0)}
                    </span>
                    {file.download_count > 0 && (
                        <>
                            <span className="storage-file-separator">•</span>
                            <span className="storage-file-downloads">
                                {file.download_count} скач.
                            </span>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default FileMetaInfo;