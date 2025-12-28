import React, { useState, useEffect } from 'react';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import { Download, Eye, Calendar, Clock, CheckSquare, Square, FolderOpen } from 'lucide-react';
import { useFileIcon } from './FileItem/hooks/useFileIcon';
import './styles/RecentFilesView.css';

interface FileItem {
  id: number;
  name: string;
  size: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
  human_readable_size?: string;
  is_favorite?: boolean;
  folder_id?: number;
  file_type?: string;
  extension?: string;
  type?: string;
  download_url?: string;
  download_endpoint?: string;
}

interface RecentFilesViewProps {
  files: FileItem[];
  viewMode: 'grid' | 'list';
  sortBy: 'date' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
  onFileClick: (file: FileItem) => void;
  permissions: StoragePermissions;
}

const RecentFilesView: React.FC<RecentFilesViewProps> = ({
  files,
  viewMode,
  sortBy,
  sortOrder,
  onFileClick,
  permissions
}) => {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const { getFileIcon, getIconColor } = useFileIcon();

  useEffect(() => {
    setSelectedItems([]);
  }, [files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дня назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === files.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(files.map(file => file.id));
    }
  };

  const handleItemSelect = (fileId: number) => {
    setSelectedItems(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleDownloadSelected = () => {
    const selectedFiles = files.filter(file => selectedItems.includes(file.id));
    
    if (selectedFiles.length === 0) {
      return;
    }

    console.log('Download selected:', selectedFiles);
    
    selectedFiles.forEach(file => {
      const downloadUrl = file.download_url || file.download_endpoint;
      
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.warn('Не найден URL для скачивания файла:', file.name);
      }
    });
  };

  if (!files || files.length === 0) {
    return (
      <div className="recent-files-empty">
        <div className="recent-files-empty-icon">
          <FolderOpen size={48} />
        </div>
        <h3 className="recent-files-empty-title">Нет недавних файлов</h3>
        <p className="recent-files-empty-text">
          Файлы, которые вы загружали или просматривали, появятся здесь
        </p>
      </div>
    );
  }

  return (
    <div className="recent-files-container">
      {selectedItems.length > 0 && (
        <div className="selection-toolbar visible">
          <div className="selection-info">
            <button
              onClick={handleSelectAll}
              className="select-all-btn"
              title="Выбрать все"
            >
              {selectedItems.length === files.length ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </button>
            <span className="selection-count">
              Выбрано: {selectedItems.length} из {files.length}
            </span>
          </div>
          <div className="selection-actions">
            <button
              onClick={handleDownloadSelected}
              className="action-btn primary"
            >
              <Download size={16} />
              Скачать выбранное
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="action-btn secondary"
            >
              Снять выделение
            </button>
          </div>
        </div>
      )}

      <div className={`recent-files-content ${viewMode}`}>
        {files.map((file) => (
          <div 
            key={file.id} 
            className={`recent-file-item ${selectedItems.includes(file.id) ? 'selected' : ''}`}
            onClick={() => handleItemSelect(file.id)}
          >
            <div className="file-item-checkbox">
              {selectedItems.includes(file.id) ? (
                <CheckSquare size={16} className="checked" />
              ) : (
                <Square size={16} />
              )}
            </div>
            
            <div className="file-item-content" onClick={(e) => e.stopPropagation()}>
              <div 
                className="file-icon"
                style={{ color: getIconColor(file) }}
              >
                {getFileIcon(file, viewMode)}
              </div>
              
              <div className="file-info-container">
                <div className="file-info-row">
                  <div className="file-name" title={file.name}>
                    {file.name}
                  </div>
                  
                  {viewMode === 'list' && (
                    <div className="file-details-right">
                      <span className="file-size">
                        {file.human_readable_size || formatFileSize(file.size || 0)}
                      </span>
                      <span className="file-separator">•</span>
                      <span className="file-date">
                        <Calendar size={12} />
                        {formatDate(file.created_at)}
                      </span>
                    </div>
                  )}
                </div>

                {viewMode === 'grid' && (
                  <div className="file-details">
                    <span className="file-size">
                      {file.human_readable_size || formatFileSize(file.size || 0)}
                    </span>
                    <span className="file-date">
                      <Calendar size={12} />
                      {formatDate(file.created_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="recent-files-footer">
        <div className="footer-stats">
          <div className="stat-item">
            <Clock size={14} />
            <span>Всего файлов: {files.length}</span>
          </div>
          <div className="stat-item">
            <span>
              Сортировка: {sortBy === 'date' ? 'по дате' : sortBy === 'name' ? 'по имени' : 'по размеру'} 
              ({sortOrder === 'asc' ? 'по возрастанию' : 'по убыванию'})
            </span>
          </div>
          <div className="stat-item">
            <span>
              Режим просмотра: {viewMode === 'grid' ? 'плитка' : 'список'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentFilesView;