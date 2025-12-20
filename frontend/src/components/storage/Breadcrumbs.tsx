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
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();
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
            if (!currentFolder) {
                setPath([]);
                return;
            }

            const response = await storageApi.getFolderPath(currentFolder.id);
            
            // Используем поле breadcrumbs из ответа API
            if (response && response.breadcrumbs && Array.isArray(response.breadcrumbs)) {
                setPath(response.breadcrumbs);
            } else if (response && response.path && Array.isArray(response.path)) {
                // Альтернативное поле path
                setPath(response.path);
            } else {
                console.warn('No breadcrumbs found in response:', response);
                // Если нет breadcrumbs, создаем минимальный путь из текущей папки
                if (response && response.current_folder) {
                    setPath([response.current_folder]);
                } else {
                    setPath([]);
                }
            }
        } catch (error: any) {
            console.error('Error loading folder path:', error);

            // Если ошибка 404, создаем путь из текущей папки (если она есть)
            if (error.response?.status === 404) {
                console.warn(`Folder path not found for ID ${currentFolder?.id}, using current folder only`);
                if (currentFolder) {
                    setPath([currentFolder]);
                } else {
                    setPath([]);
                }
            } else {
                setPath([]);
            }
        }
    };

    const handleBreadcrumbClick = (folder: any, index: number) => {
        if (index === path.length - 1) return;

        // Для корневой папки (первой в пути) просто переходим в нее
        if (index === 0) {
            // Если это корневая папка пути, просто навигируем к ней
            navigate(`/storage/${folder.id}`);
            return;
        }

        // Для промежуточных папок формируем путь из всех папок до текущей
        const folderIndex = path.findIndex(f => f.id === folder.id);
        const pathIds = path.slice(0, folderIndex + 1).map(f => f.id);
        
        // Если только одна папка в пути
        if (pathIds.length === 1) {
            navigate(`/storage/${pathIds[0]}`);
        } else {
            navigate(`/storage/${pathIds.join('/')}`);
        }
    };

    const handleHomeClick = () => {
        navigate('/storage');
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
                    onClick={handleHomeClick}
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