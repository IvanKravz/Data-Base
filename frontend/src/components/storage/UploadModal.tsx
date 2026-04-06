// components/storage/UploadModal.tsx (полная версия)
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { storageApi } from '../../api/storage';
import './styles/UploadModal.css';
import { FaTimes, FaFolder, FaUser, FaBriefcase, FaCloudUploadAlt, FaFile, FaClock, FaSpinner, FaCheck, FaExclamationCircle, FaRedo, FaImage, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileArchive, FaMusic, FaVideo } from 'react-icons/fa';

interface UploadModalProps {
    currentFolder: any | null;
    viewType: 'work' | 'personal';
    maxFileSize: number;
    onUpload: (files: any[]) => void;
    onClose: () => void;
}

interface UploadFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    previewUrl?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ currentFolder, viewType, maxFileSize, onUpload, onClose }) => {
    const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (file: File) => {
        const type = file.type.toLowerCase();
        if (type.startsWith('image/')) return <FaImage size={20} />;
        if (type.includes('pdf')) return <FaFilePdf size={20} />;
        if (type.includes('word') || type.includes('document')) return <FaFileWord size={20} />;
        if (type.includes('excel') || type.includes('spreadsheet')) return <FaFileExcel size={20} />;
        if (type.includes('powerpoint') || type.includes('presentation')) return <FaFilePowerpoint size={20} />;
        if (type.includes('zip') || type.includes('archive') || type.includes('compressed')) return <FaFileArchive size={20} />;
        if (type.startsWith('audio/')) return <FaMusic size={20} />;
        if (type.startsWith('video/')) return <FaVideo size={20} />;
        return <FaFile size={20} />;
    };

    const createPreviewUrl = (file: File): string | undefined => {
        if (file.type.startsWith('image/')) return URL.createObjectURL(file);
        return undefined;
    };

    useEffect(() => {
        return () => {
            uploadQueue.forEach(file => { if (file.previewUrl) URL.revokeObjectURL(file.previewUrl); });
        };
    }, [uploadQueue]);

    const handleFileSelect = (files: FileList) => {
        const newFiles: UploadFile[] = [];
        Array.from(files).forEach(file => {
            if (file.size > maxFileSize) {
                newFiles.push({ id: `${Date.now()}-${Math.random()}`, file, progress: 0, status: 'error', error: `Файл слишком большой (максимум ${formatBytes(maxFileSize)})` });
                return;
            }
            const allowed = true; // можно добавить проверку типов
            if (!allowed) {
                newFiles.push({ id: `${Date.now()}-${Math.random()}`, file, progress: 0, status: 'error', error: 'Тип файла не поддерживается' });
                return;
            }
            const previewUrl = createPreviewUrl(file);
            newFiles.push({ id: `${Date.now()}-${Math.random()}`, file, progress: 0, status: 'pending', previewUrl });
        });
        setUploadQueue(prev => [...prev, ...newFiles]);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length) handleFileSelect(files);
    }, []);

    const handleRemoveFile = (id: string) => {
        const file = uploadQueue.find(f => f.id === id);
        if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
        setUploadQueue(prev => prev.filter(f => f.id !== id));
    };

    const handleRetryUpload = (file: UploadFile) => {
        setUploadQueue(prev => prev.map(f => f.id === file.id ? { ...f, status: 'pending', error: undefined } : f));
    };

    const handleStartUpload = async () => {
        if (uploadQueue.length === 0) return;
        setIsUploading(true);
        const filesToUpload = uploadQueue.filter(f => f.status === 'pending');
        try {
            const pendingFiles = filesToUpload.map(f => f.file);
            if (pendingFiles.length === 0) return;
            const uploadedFiles = await storageApi.uploadMultipleFiles(pendingFiles, currentFolder?.id || null, viewType);
            setUploadQueue(prev => prev.map(file => filesToUpload.some(f => f.file.name === file.file.name) ? { ...file, status: 'success', progress: 100 } : file));
            onUpload(uploadedFiles);
            setTimeout(() => onClose(), 1000);
        } catch (error: any) {
            console.error('Upload error:', error);
            setUploadQueue(prev => prev.map(file => filesToUpload.some(f => f.id === file.id) ? { ...file, status: 'error', error: error.message || 'Ошибка при загрузке файлов' } : file));
        } finally {
            setIsUploading(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };
    const pendingFiles = uploadQueue.filter(f => f.status === 'pending').length;
    const errorFiles = uploadQueue.filter(f => f.status === 'error').length;

    return (
        <div className="storage-modal-overlay" onClick={handleOverlayClick}>
            <div className="storage-upload-modal">
                <div className="storage-modal-header">
                    <h2 className="storage-modal-title">Загрузка файлов</h2>
                    <button className="storage-modal-close" onClick={onClose}><FaTimes /></button>
                </div>
                <div className="storage-modal-body">
                    <div className="storage-upload-info">
                        <div className="storage-upload-location"><FaFolder /><span className="storage-upload-location-text">{currentFolder ? `Папка: "${currentFolder.name}"` : 'Корневая папка'}</span></div>
                        <div className="storage-upload-type">{viewType === 'personal' ? <FaUser /> : <FaBriefcase />}{viewType === 'personal' ? 'Личные файлы' : 'Рабочие файлы'}</div>
                    </div>
                    <div className={`storage-upload-dropzone ${isDragging ? 'dragging' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                        <div className="storage-upload-dropzone-icon"><FaCloudUploadAlt size={48} /></div>
                        <h3 className="storage-upload-dropzone-title">Перетащите файлы сюда</h3>
                        <p className="storage-upload-dropzone-subtitle">или нажмите для выбора файлов</p>
                        <p className="storage-upload-dropzone-info">Максимальный размер файла: {formatBytes(maxFileSize)}</p>
                        <input ref={fileInputRef} type="file" multiple onChange={(e) => { if (e.target.files) handleFileSelect(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />
                    </div>
                    {uploadQueue.length > 0 && (
                        <div className="storage-upload-queue">
                            <div className="storage-upload-list">
                                {uploadQueue.map(uploadFile => (
                                    <div key={uploadFile.id} className="storage-upload-item">
                                        <div className="storage-upload-item-info">
                                            <div className="storage-upload-item-icon">{uploadFile.previewUrl ? <img src={uploadFile.previewUrl} alt={uploadFile.file.name} /> : getFileIcon(uploadFile.file)}</div>
                                            <div className="storage-upload-item-details">
                                                <h5 className="storage-upload-item-name" title={uploadFile.file.name}>{uploadFile.file.name}</h5>
                                                <div className="storage-upload-item-meta"><span className="storage-upload-item-size">{formatBytes(uploadFile.file.size)}</span><span className="storage-upload-item-type">{uploadFile.file.type || 'Неизвестный тип'}</span></div>
                                            </div>
                                        </div>
                                        <div className="storage-upload-item-status">
                                            {uploadFile.status === 'pending' && <span className="storage-upload-status pending"><FaClock /> В очереди</span>}
                                            {uploadFile.status === 'uploading' && (
                                                <div className="storage-upload-status uploading">
                                                    <div className="storage-upload-progress"><div className="storage-upload-progress-bar" style={{ width: `${uploadFile.progress}%` }}></div></div>
                                                    <span className="storage-upload-progress-text">{uploadFile.progress}%</span>
                                                </div>
                                            )}
                                            {uploadFile.status === 'success' && <span className="storage-upload-status success"><FaCheck /> Загружено</span>}
                                            {uploadFile.status === 'error' && (
                                                <div className="storage-upload-status error">
                                                    <span className="storage-upload-error"><FaExclamationCircle />{uploadFile.error}</span>
                                                    <button className="storage-upload-retry" onClick={() => handleRetryUpload(uploadFile)}><FaRedo /></button>
                                                </div>
                                            )}
                                        </div>
                                        <button className="storage-upload-remove" onClick={() => handleRemoveFile(uploadFile.id)} title="Удалить из очереди"><FaTimes /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="storage-modal-actions">
                        <button type="button" className="storage-modal-cancel" onClick={onClose} disabled={isUploading}>Отмена</button>
                        <button type="button" className="storage-modal-submit" onClick={handleStartUpload} disabled={isUploading || pendingFiles === 0}>
                            {isUploading ? <><FaSpinner className="fa-spin" /> Загрузка...</> : `Загрузить файлы (${pendingFiles})`}
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