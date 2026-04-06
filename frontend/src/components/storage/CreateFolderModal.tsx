// components/storage/CreateFolderModal.tsx
import React, { useState } from 'react';
import './styles/CreateFolderModal.css';

interface CreateFolderModalProps {
    currentFolder: any | null;
    viewType: 'work' | 'personal';
    onCreate: (name: string, color?: string) => void;
    onClose: () => void;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
    currentFolder,
    viewType,
    onCreate,
    onClose
}) => {
    const [folderName, setFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#1976D2');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const colorOptions = [
        { value: '#1976D2', label: 'Синий' },
        { value: '#4CAF50', label: 'Зеленый' },
        { value: '#FF9800', label: 'Оранжевый' },
        { value: '#9C27B0', label: 'Фиолетовый' },
        { value: '#F44336', label: 'Красный' },
        { value: '#00BCD4', label: 'Голубой' },
        { value: '#FFC107', label: 'Желтый' },
        { value: '#795548', label: 'Коричневый' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName.trim()) {
            setError('Введите название папки');
            return;
        }
        if (folderName.length > 100) {
            setError('Название папки не должно превышать 100 символов');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            await onCreate(folderName, selectedColor);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Ошибка при создании папки');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="storage-modal-overlay" onClick={handleOverlayClick}>
            <div className="storage-create-folder-modal">
                <div className="storage-modal-header">
                    <h2 className="storage-modal-title">Создать новую папку</h2>
                    <button className="storage-modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
                </div>
                <div className="storage-modal-body">
                    <div className="storage-create-folder-info">
                        <div className="storage-folder-location">
                            <i className="fas fa-folder"></i>
                            <span className="storage-folder-location-text">
                                {currentFolder ? `В папке "${currentFolder.name}"` : 'В корне хранилища'}
                            </span>
                        </div>
                        <div className="storage-folder-type-badge">
                            <i className={`fas ${viewType === 'personal' ? 'fa-user' : 'fa-briefcase'}`}></i>
                            {viewType === 'personal' ? 'Личная папка' : 'Рабочая папка'}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="storage-create-folder-form">
                        <div className="storage-form-group">
                            <label htmlFor="folderName" className="storage-form-label">Название папки *</label>
                            <input type="text" id="folderName" value={folderName} onChange={(e) => setFolderName(e.target.value)} className="storage-form-input" placeholder="Введите название папки" autoFocus maxLength={100} />
                            <div className="storage-form-helper">Максимум 100 символов</div>
                        </div>
                        <div className="storage-form-group">
                            <label className="storage-form-label">Цвет папки</label>
                            <div className="storage-color-picker">
                                {colorOptions.map(color => (
                                    <label key={color.value} className="storage-color-option">
                                        <input type="radio" name="folderColor" value={color.value} checked={selectedColor === color.value} onChange={(e) => setSelectedColor(e.target.value)} className="storage-color-radio" />
                                        <span className="storage-color-preview" style={{ backgroundColor: color.value }} title={color.label}></span>
                                        <span className="storage-color-label">{color.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {error && <div className="storage-form-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}
                        <div className="storage-modal-actions">
                            <button type="button" className="storage-modal-cancel" onClick={onClose} disabled={isSubmitting}>Отмена</button>
                            <button type="submit" className="storage-modal-submit" disabled={isSubmitting || !folderName.trim()}>
                                {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> Создание...</> : 'Создать папку'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateFolderModal;