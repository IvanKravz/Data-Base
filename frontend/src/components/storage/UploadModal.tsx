// components/storage/UploadModal.tsx
import React, { useState, useRef, useCallback } from 'react';
import { storageApi } from '../../api/storage';
import './styles/UploadModal.css';

interface UploadModalProps {
    currentFolder: any | null;
    viewType: 'work' | 'personal';
    maxFileSize: number;
    onUpload: (files: File[]) => void;
    onClose: () => void;
}

interface UploadFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({
    currentFolder,
    viewType,
    maxFileSize,
    onUpload,
    onClose
}) => {
    const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadAll, setUploadAll] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (files: FileList) => {
        const newFiles: UploadFile[] = [];

        Array.from(files).forEach(file => {
            // Проверка размера файла
            if (file.size > maxFileSize) {
                newFiles.push({
                    id: `${Date.now()}-${Math.random()}`,
                    file,
                    progress: 0,
                    status: 'error',
                    error: `Файл слишком большой (максимум ${formatBytes(maxFileSize)})`
                });
                return;
            }

            // Проверка типа файла
            if (!isFileTypeAllowed(file)) {
                newFiles.push({
                    id: `${Date.now()}-${Math.random()}`,
                    file,
                    progress: 0,
                    status: 'error',
                    error: 'Тип файла не поддерживается'
                });
                return;
            }

            newFiles.push({
                id: `${Date.now()}-${Math.random()}`,
                file,
                progress: 0,
                status: 'pending'
            });
        });

        setUploadQueue(prev => [...prev, ...newFiles]);
    };

    const isFileTypeAllowed = (file: File): boolean => {
        // Разрешаем все типы файлов, но можно добавить фильтрацию
        const forbiddenTypes = [
            'application/x-msdownload', // .exe
            'application/x-msdos-program',
            'application/bat',
            'application/x-bat',
            'application/x-msdos-program'
        ];

        return !forbiddenTypes.includes(file.type);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files);
        }
    }, []);

    const handleRemoveFile = (id: string) => {
        setUploadQueue(prev => prev.filter(file => file.id !== id));
    };

    const handleRetryUpload = async (file: UploadFile) => {
        if (file.status === 'error') {
            setUploadQueue(prev => prev.map(f =>
                f.id === file.id ? { ...f, status: 'pending', error: undefined } : f
            ));
        }
    };

    const handleStartUpload = async () => {
        if (uploadQueue.length === 0) return;

        setIsUploading(true);
        const filesToUpload = uploadAll ? uploadQueue : uploadQueue.filter(f => f.status === 'pending');

        for (const uploadFile of filesToUpload) {
            if (uploadFile.status !== 'pending') continue;

            try {
                // Обновляем статус на загрузку
                setUploadQueue(prev => prev.map(f =>
                    f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
                ));

                // Загружаем файл
                await storageApi.uploadFile(
                    uploadFile.file,
                    currentFolder?.id || null,
                    viewType,
                    (progress) => {
                        setUploadQueue(prev => prev.map(f =>
                            f.id === uploadFile.id ? { ...f, progress: progress.percentage } : f
                        ));
                    }
                );

                // Успешная загрузка
                setUploadQueue(prev => prev.map(f =>
                    f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
                ));

            } catch (error: any) {
                // Ошибка загрузки
                setUploadQueue(prev => prev.map(f =>
                    f.id === uploadFile.id ? {
                        ...f,
                        status: 'error',
                        error: error.message || 'Ошибка при загрузке файла'
                    } : f
                ));
            }
        }

        setIsUploading(false);

        // Если все файлы успешно загружены, закрываем модальное окно
        const allSuccess = uploadQueue.every(f => f.status === 'success');
        if (allSuccess && uploadAll) {
            setTimeout(() => {
                onUpload(uploadQueue.map(f => f.file));
                onClose();
            }, 1000);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const pendingFiles = uploadQueue.filter(f => f.status === 'pending').length;
    const uploadingFiles = uploadQueue.filter(f => f.status === 'uploading').length;
    const successfulFiles = uploadQueue.filter(f => f.status === 'success').length;
    const errorFiles = uploadQueue.filter(f => f.status === 'error').length;

    return (
        <div className="storage-modal-overlay" onClick={handleOverlayClick}>
            <div className="storage-upload-modal">
                <div className="storage-modal-header">
                    <h2 className="storage-modal-title">Загрузка файлов</h2>
                    <button className="storage-modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="storage-modal-body">
                    <div className="storage-upload-info">
                        <div className="storage-upload-location">
                            <i className="fas fa-folder"></i>
                            <span className="storage-upload-location-text">
                                {currentFolder
                                    ? `Папка: "${currentFolder?.name}"`
                                    : 'Корневая папка'
                                }
                            </span>
                        </div>
                        <div className="storage-upload-type">
                            <i className={`fas ${viewType === 'personal' ? 'fa-user' : 'fa-briefcase'}`}></i>
                            {viewType === 'personal' ? 'Личные файлы' : 'Рабочие файлы'}
                        </div>
                    </div>

                    <div
                        className={`storage-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="storage-upload-dropzone-icon">
                            <i className="fas fa-cloud-upload-alt"></i>
                        </div>
                        <h3 className="storage-upload-dropzone-title">
                            Перетащите файлы сюда
                        </h3>
                        <p className="storage-upload-dropzone-subtitle">
                            или нажмите для выбора файлов
                        </p>
                        <p className="storage-upload-dropzone-info">
                            Максимальный размер файла: {formatBytes(maxFileSize)}
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={(e) => {
                                if (e.target.files) {
                                    handleFileSelect(e.target.files);
                                }
                                e.target.value = ''; // Сбрасываем значение
                            }}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {uploadQueue.length > 0 && (
                        <div className="storage-upload-queue">
                            <div className="storage-upload-queue-header">
                                <h4 className="storage-upload-queue-title">
                                    Очередь загрузки ({uploadQueue.length})
                                </h4>
                                <div className="storage-upload-stats">
                                    <span className="storage-upload-stat pending">
                                        <i className="fas fa-clock"></i> {pendingFiles}
                                    </span>
                                    <span className="storage-upload-stat uploading">
                                        <i className="fas fa-spinner fa-spin"></i> {uploadingFiles}
                                    </span>
                                    <span className="storage-upload-stat success">
                                        <i className="fas fa-check"></i> {successfulFiles}
                                    </span>
                                    <span className="storage-upload-stat error">
                                        <i className="fas fa-times"></i> {errorFiles}
                                    </span>
                                </div>
                            </div>

                            <div className="storage-upload-list">
                                {uploadQueue.map((uploadFile) => (
                                    <div key={uploadFile.id} className="storage-upload-item">
                                        <div className="storage-upload-item-info">
                                            <div className="storage-upload-item-icon">
                                                <i className="fas fa-file"></i>
                                            </div>
                                            <div className="storage-upload-item-details">
                                                <h5 className="storage-upload-item-name" title={uploadFile.file.name}>
                                                    {uploadFile.file.name}
                                                </h5>
                                                <div className="storage-upload-item-meta">
                                                    <span className="storage-upload-item-size">
                                                        {formatBytes(uploadFile.file.size)}
                                                    </span>
                                                    <span className="storage-upload-item-type">
                                                        {uploadFile.file.type || 'Неизвестный тип'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="storage-upload-item-status">
                                            {uploadFile.status === 'pending' && (
                                                <span className="storage-upload-status pending">
                                                    <i className="fas fa-clock"></i> В очереди
                                                </span>
                                            )}

                                            {uploadFile.status === 'uploading' && (
                                                <div className="storage-upload-status uploading">
                                                    <div className="storage-upload-progress">
                                                        <div
                                                            className="storage-upload-progress-bar"
                                                            style={{ width: `${uploadFile.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="storage-upload-progress-text">
                                                        {uploadFile.progress}%
                                                    </span>
                                                </div>
                                            )}

                                            {uploadFile.status === 'success' && (
                                                <span className="storage-upload-status success">
                                                    <i className="fas fa-check"></i> Загружено
                                                </span>
                                            )}

                                            {uploadFile.status === 'error' && (
                                                <div className="storage-upload-status error">
                                                    <span className="storage-upload-error">
                                                        <i className="fas fa-exclamation-circle"></i>
                                                        {uploadFile.error}
                                                    </span>
                                                    <button
                                                        className="storage-upload-retry"
                                                        onClick={() => handleRetryUpload(uploadFile)}
                                                    >
                                                        <i className="fas fa-redo"></i>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className="storage-upload-remove"
                                            onClick={() => handleRemoveFile(uploadFile.id)}
                                            title="Удалить из очереди"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="storage-upload-options">
                        <label className="storage-upload-option">
                            <input
                                type="checkbox"
                                checked={uploadAll}
                                onChange={(e) => setUploadAll(e.target.checked)}
                                className="storage-upload-checkbox"
                            />
                            <span className="storage-upload-option-text">
                                Начать загрузку всех файлов автоматически
                            </span>
                        </label>
                    </div>

                    <div className="storage-modal-actions">
                        <button
                            type="button"
                            className="storage-modal-cancel"
                            onClick={onClose}
                            disabled={isUploading}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="storage-modal-submit"
                            onClick={handleStartUpload}
                            disabled={isUploading || pendingFiles === 0}
                        >
                            {isUploading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Загрузка...
                                </>
                            ) : (
                                `Загрузить файлы (${pendingFiles})`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default UploadModal;