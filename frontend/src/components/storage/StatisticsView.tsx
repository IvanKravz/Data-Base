// components/storage/StatisticsView.tsx
import React, { useState, useEffect } from 'react';
import { storageApi } from '../../api/storage';
import './styles/StatisticsView.css';

interface StatisticsData {
  total_files: number;
  total_size: number;
  by_type: Array<{ file_type: string; count: number }>;
  top_extensions: Array<{ extension: string; count: number }>;
  recent_uploads: Array<any>;
  storage_quota: number;
  used_storage: number;
}

interface StatisticsViewProps {
  onRefresh?: () => void;
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ onRefresh }) => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // В реальности нужно добавить параметр timeRange в API запрос
      const data = await storageApi.getStatistics();
      setStatistics(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке статистики');
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number, total: number): string => {
    return ((value / total) * 100).toFixed(1) + '%';
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'work': return '#1976d2';
      case 'personal': return '#4caf50';
      default: return '#757575';
    }
  };

  const getColorForExtension = (extension: string) => {
    const colors = [
      '#1976d2', '#4caf50', '#ff9800', '#f44336',
      '#9c27b0', '#00bcd4', '#ffc107', '#795548',
      '#607d8b', '#e91e63', '#3f51b5', '#009688'
    ];
    
    const index = extension.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="storage-statistics-loading">
        <div className="storage-statistics-spinner"></div>
        <p>Загрузка статистики...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="storage-statistics-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={loadStatistics} className="storage-statistics-retry">
          Повторить попытку
        </button>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="storage-statistics-empty">
        <p>Нет данных для отображения</p>
      </div>
    );
  }

  const storagePercentage = statistics.storage_quota > 0 
    ? (statistics.used_storage / statistics.storage_quota) * 100 
    : 0;

  return (
    <div className="storage-statistics-view">
      <div className="storage-statistics-header">
        <h2 className="storage-statistics-title">
          <i className="fas fa-chart-bar"></i> Статистика хранилища
        </h2>
        
        <div className="storage-statistics-controls">
          <div className="storage-statistics-time-range">
            <button
              className={`storage-time-range-btn ${timeRange === 'day' ? 'active' : ''}`}
              onClick={() => setTimeRange('day')}
            >
              День
            </button>
            <button
              className={`storage-time-range-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              Неделя
            </button>
            <button
              className={`storage-time-range-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Месяц
            </button>
            <button
              className={`storage-time-range-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              Год
            </button>
          </div>
          
          <button
            className="storage-statistics-refresh"
            onClick={loadStatistics}
            title="Обновить статистику"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div className="storage-statistics-grid">
        {/* Карточка с общей информацией */}
        <div className="storage-statistics-card storage-statistics-overview">
          <h3 className="storage-statistics-card-title">Общая информация</h3>
          <div className="storage-statistics-overview-grid">
            <div className="storage-statistics-overview-item">
              <div className="storage-statistics-overview-icon">
                <i className="fas fa-file"></i>
              </div>
              <div className="storage-statistics-overview-content">
                <span className="storage-statistics-overview-label">Всего файлов</span>
                <span className="storage-statistics-overview-value">
                  {statistics.total_files.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="storage-statistics-overview-item">
              <div className="storage-statistics-overview-icon">
                <i className="fas fa-database"></i>
              </div>
              <div className="storage-statistics-overview-content">
                <span className="storage-statistics-overview-label">Общий размер</span>
                <span className="storage-statistics-overview-value">
                  {formatBytes(statistics.total_size)}
                </span>
              </div>
            </div>
            
            <div className="storage-statistics-overview-item">
              <div className="storage-statistics-overview-icon">
                <i className="fas fa-hdd"></i>
              </div>
              <div className="storage-statistics-overview-content">
                <span className="storage-statistics-overview-label">Использовано</span>
                <span className="storage-statistics-overview-value">
                  {formatBytes(statistics.used_storage)}
                  {statistics.storage_quota > 0 && (
                    <span className="storage-statistics-overview-percentage">
                      ({formatPercentage(statistics.used_storage, statistics.storage_quota)})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          {statistics.storage_quota > 0 && (
            <div className="storage-statistics-quota">
              <div className="storage-statistics-quota-bar">
                <div 
                  className="storage-statistics-quota-fill"
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                ></div>
              </div>
              <div className="storage-statistics-quota-labels">
                <span>{formatBytes(statistics.used_storage)}</span>
                <span>{formatBytes(statistics.storage_quota)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Карточка с распределением по типам */}
        <div className="storage-statistics-card storage-statistics-types">
          <h3 className="storage-statistics-card-title">Распределение по типам</h3>
          <div className="storage-statistics-types-chart">
            {statistics.by_type.map((type, index) => (
              <div key={type.file_type} className="storage-statistics-type-item">
                <div className="storage-statistics-type-info">
                  <span 
                    className="storage-statistics-type-color"
                    style={{ backgroundColor: getColorForType(type.file_type) }}
                  ></span>
                  <span className="storage-statistics-type-name">
                    {type.file_type === 'work' ? 'Рабочие' : 'Личные'}
                  </span>
                  <span className="storage-statistics-type-count">{type.count}</span>
                </div>
                <div className="storage-statistics-type-bar">
                  <div 
                    className="storage-statistics-type-fill"
                    style={{ 
                      width: `${(type.count / statistics.total_files) * 100}%`,
                      backgroundColor: getColorForType(type.file_type)
                    }}
                  ></div>
                </div>
                <span className="storage-statistics-type-percentage">
                  {formatPercentage(type.count, statistics.total_files)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Карточка с популярными расширениями */}
        <div className="storage-statistics-card storage-statistics-extensions">
          <h3 className="storage-statistics-card-title">Популярные расширения</h3>
          <div className="storage-statistics-extensions-list">
            {statistics.top_extensions.map((ext, index) => (
              <div key={ext.extension} className="storage-statistics-extension-item">
                <div className="storage-statistics-extension-info">
                  <span 
                    className="storage-statistics-extension-color"
                    style={{ backgroundColor: getColorForExtension(ext.extension) }}
                  ></span>
                  <span className="storage-statistics-extension-name">
                    {ext.extension.toUpperCase()}
                  </span>
                  <span className="storage-statistics-extension-count">{ext.count}</span>
                </div>
                <div className="storage-statistics-extension-bar">
                  <div 
                    className="storage-statistics-extension-fill"
                    style={{ 
                      width: `${(ext.count / statistics.total_files) * 100}%`,
                      backgroundColor: getColorForExtension(ext.extension)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Карточка с активностью */}
        <div className="storage-statistics-card storage-statistics-activity">
          <h3 className="storage-statistics-card-title">Последняя активность</h3>
          <div className="storage-statistics-activity-list">
            {statistics.recent_uploads && statistics.recent_uploads.length > 0 ? (
              statistics.recent_uploads.slice(0, 5).map((file, index) => (
                <div key={file.id} className="storage-statistics-activity-item">
                  <div className="storage-statistics-activity-icon">
                    <i className="fas fa-file-upload"></i>
                  </div>
                  <div className="storage-statistics-activity-content">
                    <span className="storage-statistics-activity-text">
                      Загружен файл <strong>{file.name}</strong>
                    </span>
                    <span className="storage-statistics-activity-time">
                      {formatTimeAgo(file.created_at)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="storage-statistics-activity-empty">
                Нет данных об активности
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} минут назад`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} часов назад`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дней назад`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} недель назад`;
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} месяцев назад`;
  
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} лет назад`;
};

export default StatisticsView;