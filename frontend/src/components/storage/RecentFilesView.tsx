// components/storage/RecentFilesView.tsx
import React, { useState, useEffect } from 'react';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import FileItem from './FileItem/FileItem';
import './styles/RecentFilesView.css';

interface RecentFilesViewProps {
    files: any[];
    onFileClick: (file: any) => void;
    permissions: StoragePermissions;
}

const RecentFilesView: React.FC<RecentFilesViewProps> = ({
    files,
    onFileClick,
    permissions
}) => {
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterType, setFilterType] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setSelectedItems([]);
    }, [files]);

    const handleSelectAll = () => {
        setSelectedItems([...files]);
    };

    const handleClearSelection = () => {
        setSelectedItems([]);
    };

    const handleItemSelect = (file: any) => {
        const isSelected = selectedItems.some(selected => selected.id === file.id);
        if (isSelected) {
            setSelectedItems(selectedItems.filter(selected => selected.id !== file.id));
        } else {
            setSelectedItems([...selectedItems, file]);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // Здесь можно перезагрузить данные
            // В реальном приложении будет вызов API
            await new Promise(resolve => setTimeout(resolve, 1000));
        } finally {
            setIsRefreshing(false);
        }
    };

    const getFilteredAndSortedFiles = () => {
        let filteredFiles = [...files];

        // Фильтрация по типу
        if (filterType !== 'all') {
            filteredFiles = filteredFiles.filter(file => {
                if (filterType === 'image') return file.mime_type?.startsWith('image/');
                if (filterType === 'document') {
                    return file.mime_type?.includes('document') ||
                        file.mime_type?.includes('pdf') ||
                        file.mime_type?.includes('word') ||
                        file.mime_type?.includes('excel') ||
                        file.mime_type?.includes('powerpoint');
                }
                if (filterType === 'video') return file.mime_type?.startsWith('video/');
                if (filterType === 'audio') return file.mime_type?.startsWith('audio/');
                if (filterType === 'archive') return file.mime_type?.includes('zip') || file.extension === 'rar';
                return true;
            });
        }

        // Фильтрация по времени
        const now = new Date();
        const timeFilter = new Date();

        switch (timeRange) {
            case 'day':
                timeFilter.setDate(now.getDate() - 1);
                break;
            case 'week':
                timeFilter.setDate(now.getDate() - 7);
                break;
            case 'month':
                timeFilter.setMonth(now.getMonth() - 1);
                break;
        }

        filteredFiles = filteredFiles.filter(file => {
            const fileDate = new Date(file.created_at);
            return fileDate >= timeFilter;
        });

        // Сортировка
        return filteredFiles.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'date':
                    aValue = new Date(a.created_at).getTime();
                    bValue = new Date(b.created_at).getTime();
                    break;
                case 'size':
                    aValue = a.size;
                    bValue = b.size;
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    };

    const filteredFiles = getFilteredAndSortedFiles();
    const totalFiles = filteredFiles.length;

    const getFileTypeCounts = () => {
        const counts = {
            all: files.length,
            image: files.filter(f => f.mime_type?.startsWith('image/')).length,
            document: files.filter(f =>
                f.mime_type?.includes('document') ||
                f.mime_type?.includes('pdf') ||
                f.mime_type?.includes('word') ||
                f.mime_type?.includes('excel') ||
                f.mime_type?.includes('powerpoint')
            ).length,
            video: files.filter(f => f.mime_type?.startsWith('video/')).length,
            audio: files.filter(f => f.mime_type?.startsWith('audio/')).length,
            archive: files.filter(f => f.mime_type?.includes('zip') || f.extension === 'rar').length,
        };

        return counts;
    };

    const fileTypeCounts = getFileTypeCounts();

    const formatTimeRangeLabel = () => {
        switch (timeRange) {
            case 'day': return 'за последние 24 часа';
            case 'week': return 'за последнюю неделю';
            case 'month': return 'за последний месяц';
            default: return '';
        }
    };

    if (files.length === 0) {
        return (
            <div className="storage-recent-empty">
                <div className="storage-recent-empty-icon">
                    <i className="fas fa-history"></i>
                </div>
                <h3 className="storage-recent-empty-title">Нет недавних файлов</h3>
                <p className="storage-recent-empty-text">
                    Здесь будут отображаться файлы, которые вы недавно просматривали или редактировали
                </p>
                <div className="storage-recent-empty-tip">
                    <i className="fas fa-info-circle"></i>
                    <span>Открывайте файлы, чтобы они появлялись в этом списке</span>
                </div>
            </div>
        );
    }

    if (totalFiles === 0) {
        return (
            <div className="storage-recent-no-files">
                <div className="storage-recent-no-files-icon">
                    <i className="fas fa-filter"></i>
                </div>
                <h3 className="storage-recent-no-files-title">Нет файлов по выбранным фильтрам</h3>
                <p className="storage-recent-no-files-text">
                    Попробуйте изменить настройки фильтрации или выберите другой период времени
                </p>
                <button
                    className="storage-recent-reset-filters"
                    onClick={() => {
                        setFilterType('all');
                        setTimeRange('week');
                    }}
                >
                    Сбросить фильтры
                </button>
            </div>
        );
    }

    return (
        <div className="storage-recent-view">
            <div className="storage-recent-header">
                <div className="storage-recent-header-left">
                    <h2 className="storage-recent-title">
                        <i className="fas fa-history"></i> Недавние файлы
                    </h2>
                    <div className="storage-recent-subtitle">
                        {totalFiles} файлов {formatTimeRangeLabel()}
                    </div>
                </div>

                <div className="storage-recent-header-right">
                    <div className="storage-recent-controls">
                        <button
                            className="storage-recent-control"
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            title={viewMode === 'list' ? 'Плитка' : 'Список'}
                        >
                            <i className={`fas fa-${viewMode === 'list' ? 'th-large' : 'list'}`}></i>
                        </button>

                        <div className="storage-recent-sort">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="storage-recent-sort-select"
                            >
                                <option value="date">По дате</option>
                                <option value="name">По имени</option>
                                <option value="size">По размеру</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="storage-recent-sort-order"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>

                        <button
                            className="storage-recent-control"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title="Обновить"
                        >
                            <i className={`fas ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="storage-recent-filters">
                <div className="storage-recent-filter-group">
                    <label className="storage-recent-filter-label">Тип файла:</label>
                    <div className="storage-recent-filter-buttons">
                        <button
                            className={`storage-recent-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            Все ({fileTypeCounts.all})
                        </button>
                        <button
                            className={`storage-recent-filter-btn ${filterType === 'image' ? 'active' : ''}`}
                            onClick={() => setFilterType('image')}
                        >
                            <i className="fas fa-image"></i> Изображения ({fileTypeCounts.image})
                        </button>
                        <button
                            className={`storage-recent-filter-btn ${filterType === 'document' ? 'active' : ''}`}
                            onClick={() => setFilterType('document')}
                        >
                            <i className="fas fa-file-alt"></i> Документы ({fileTypeCounts.document})
                        </button>
                        <button
                            className={`storage-recent-filter-btn ${filterType === 'video' ? 'active' : ''}`}
                            onClick={() => setFilterType('video')}
                        >
                            <i className="fas fa-video"></i> Видео ({fileTypeCounts.video})
                        </button>
                        <button
                            className={`storage-recent-filter-btn ${filterType === 'audio' ? 'active' : ''}`}
                            onClick={() => setFilterType('audio')}
                        >
                            <i className="fas fa-music"></i> Аудио ({fileTypeCounts.audio})
                        </button>
                        <button
                            className={`storage-recent-filter-btn ${filterType === 'archive' ? 'active' : ''}`}
                            onClick={() => setFilterType('archive')}
                        >
                            <i className="fas fa-file-archive"></i> Архивы ({fileTypeCounts.archive})
                        </button>
                    </div>
                </div>

                <div className="storage-recent-filter-group">
                    <label className="storage-recent-filter-label">Период:</label>
                    <div className="storage-recent-time-buttons">
                        <button
                            className={`storage-recent-time-btn ${timeRange === 'day' ? 'active' : ''}`}
                            onClick={() => setTimeRange('day')}
                        >
                            Сегодня
                        </button>
                        <button
                            className={`storage-recent-time-btn ${timeRange === 'week' ? 'active' : ''}`}
                            onClick={() => setTimeRange('week')}
                        >
                            Неделя
                        </button>
                        <button
                            className={`storage-recent-time-btn ${timeRange === 'month' ? 'active' : ''}`}
                            onClick={() => setTimeRange('month')}
                        >
                            Месяц
                        </button>
                    </div>
                </div>
            </div>

            {selectedItems.length > 0 && (
                <div className="storage-recent-selection-bar">
                    <div className="storage-recent-selection-info">
                        <input
                            type="checkbox"
                            checked={selectedItems.length === totalFiles && totalFiles > 0}
                            onChange={selectedItems.length === totalFiles ? handleClearSelection : handleSelectAll}
                            className="storage-recent-select-all"
                        />
                        <span className="storage-recent-selected-count">
                            Выбрано: {selectedItems.length} из {totalFiles}
                        </span>
                    </div>

                    <div className="storage-recent-selection-actions">
                        <button
                            className="storage-recent-action-btn storage-recent-download-btn"
                            onClick={() => {
                                // Здесь можно добавить логику скачивания выбранных файлов
                                console.log('Download selected:', selectedItems);
                            }}
                        >
                            <i className="fas fa-download"></i> Скачать выбранное
                        </button>
                        <button
                            className="storage-recent-action-btn storage-recent-clear-btn"
                            onClick={handleClearSelection}
                        >
                            <i className="fas fa-times"></i> Снять выделение
                        </button>
                    </div>
                </div>
            )}

            <div className={`storage-recent-content ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
                {filteredFiles.map((file) => (
                    <FileItem
                        key={file.id}
                        file={file}
                        viewMode={viewMode}
                        isSelected={selectedItems.some(selected => selected.id === file.id)}
                        onSelect={() => handleItemSelect(file)}
                        onClick={() => onFileClick(file)}
                        onDragStart={() => { }}
                        permissions={permissions}
                    />
                ))}
            </div>

            <div className="storage-recent-footer">
                <div className="storage-recent-stats">
                    <div className="storage-recent-stat">
                        <i className="fas fa-clock"></i>
                        <span>Последнее обновление: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="storage-recent-stat">
                        <i className="fas fa-info-circle"></i>
                        <span>Файлы автоматически добавляются в этот список при открытии</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecentFilesView;