// components/storage/Breadcrumbs.tsx
import React, { useState, useEffect } from 'react';
import './styles/Breadcrumbs.css';
import { storageApi } from '../../api/storage';

interface BreadcrumbsProps {
    currentFolder: any | null;
    onNavigateUp: () => void;
    onFolderClick: (folder: any) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    currentFolder,
    onNavigateUp,
    onFolderClick
}) => {
    const [path, setPath] = useState<any[]>([]);

    useEffect(() => {
        if (currentFolder) {
            loadFolderPath();
        } else {
            setPath([]);
        }
    }, [currentFolder]);

    const loadFolderPath = async () => {
        try {
            const folderPath = await storageApi.getFolderPath(currentFolder.id);
            setPath(folderPath);
        } catch (error) {
            console.error('Error loading folder path:', error);
        }
    };

    const handleBreadcrumbClick = (folder: any, index: number) => {
        // Если кликнули на последний элемент (текущая папка), ничего не делаем
        if (index === path.length - 1) return;

        // Иначе переходим к выбранной папке
        onFolderClick(folder);
    };

    return (
        <div className="storage-breadcrumbs">
            <button
                className="storage-breadcrumbs-up"
                onClick={onNavigateUp}
                disabled={!currentFolder}
                title="На уровень выше"
            >
                <i className="fas fa-arrow-up"></i>
            </button>

            <div className="storage-breadcrumbs-path">
                <button
                    className="storage-breadcrumb-item storage-breadcrumb-home"
                    onClick={() => onFolderClick(null)}
                >
                    <i className="fas fa-home"></i>
                    <span>Главная</span>
                </button>

                {path.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                        <div className="storage-breadcrumb-separator">
                            <i className="fas fa-chevron-right"></i>
                        </div>
                        <button
                            className={`storage-breadcrumb-item ${index === path.length - 1 ? 'active' : ''}`}
                            onClick={() => handleBreadcrumbClick(folder, index)}
                            title={folder.name}
                        >
                            <i className="fas fa-folder"></i>
                            <span>{folder.name}</span>
                        </button>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default Breadcrumbs;