// components/storage/Breadcrumbs.tsx
import React, { useState, useEffect } from 'react';
import { 
  FaArrowUp, 
  FaHome, 
  FaFolder, 
  FaChevronRight,
  FaChevronLeft
} from 'react-icons/fa';
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
                <FaChevronLeft size={14} />
            </button>

            <div className="storage-breadcrumbs-path">
                <button
                    className="storage-breadcrumb-item storage-breadcrumb-home"
                    onClick={() => onFolderClick(null)}
                >
                    <FaHome size={16} />
                    <span>Главная</span>
                </button>

                {path.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                        <div className="storage-breadcrumb-separator">
                            <FaChevronRight size={12} />
                        </div>
                        <button
                            className={`storage-breadcrumb-item ${index === path.length - 1 ? 'active' : ''}`}
                            onClick={() => handleBreadcrumbClick(folder, index)}
                            title={folder.name}
                        >
                            <FaFolder size={16} />
                            <span>{folder.name}</span>
                        </button>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default Breadcrumbs;