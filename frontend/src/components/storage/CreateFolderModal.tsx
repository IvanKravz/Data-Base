// components/storage/CreateFolderModal.tsx
import React, { useState } from 'react';
import './styles/CreateFolderModal.css';
import { FaTimes } from 'react-icons/fa';

interface CreateFolderModalProps {
    currentFolder: any | null;
    viewType: 'work' | 'personal';
    onCreate: (name: string, color?: string) => Promise<void>;
    onClose: () => void;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
    currentFolder,
    viewType,
    onCreate,
    onClose
}) => {
    const [folderName, setFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#3b82f6'); // основной синий
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const colorOptions = [
        { value: '#3b82f6', label: 'Синий' },
        { value: '#10b981', label: 'Зелёный' },
        { value: '#f59e0b', label: 'Янтарный' },
        { value: '#8b5cf6', label: 'Фиолетовый' },
        { value: '#ef4444', label: 'Красный' },
        { value: '#06b6d4', label: 'Голубой' },
        { value: '#f97316', label: 'Оранжевый' },
        { value: '#ec4899', label: 'Розовый' },
        { value: '#78716c', label: 'Коричневый' },
        { value: '#64748b', label: 'Серый' },
        { value: '#14b8a6', label: 'Бирюзовый' },
        { value: '#a855f7', label: 'Пурпурный' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = folderName.trim();
        if (!trimmedName) {
            setError('Введите название папки');
            return;
        }
        if (trimmedName.length > 100) {
            setError('Название папки не должно превышать 100 символов');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            await onCreate(trimmedName, selectedColor);
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
        <div className="cfm-overlay" onClick={handleOverlayClick}>
            <div className="cfm-container">
                <div className="cfm-header">
                    <h2 className="cfm-title">
                        <i className="fas fa-folder-plus"></i>
                        Новая папка
                    </h2>
                    <button className="cfm-close" onClick={onClose} aria-label="Закрыть">
                        <FaTimes />
                    </button>
                </div>

                <div className="cfm-body">
                    <div className="cfm-info-panel">
                        <div className="cfm-location">
                            <i className="fas fa-sitemap"></i>
                            <span className="cfm-location-text">
                                {currentFolder ? `В папке «${currentFolder.name}»` : 'В корне хранилища'}
                            </span>
                        </div>
                        <div className="cfm-type-badge">
                            <i className={`fas ${viewType === 'personal' ? 'fa-user' : 'fa-briefcase'}`}></i>
                            {viewType === 'personal' ? 'Личная папка' : 'Рабочая папка'}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="cfm-form">
                        <div className="cfm-field">
                            <label htmlFor="folderName" className="cfm-label">
                                <i className="fas fa-tag"></i>
                                Название
                                <span className="cfm-required">*</span>
                            </label>
                            <input
                                type="text"
                                id="folderName"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                className="cfm-input"
                                placeholder="Например: Проекты, Документы..."
                                autoFocus
                                maxLength={100}
                            />
                            <div className="cfm-helper">
                                {folderName.length}/100 символов
                            </div>
                        </div>

                        <div className="cfm-field">
                            <label className="cfm-label">
                                <i className="fas fa-palette"></i>
                                Цвет папки
                            </label>
                            <div className="cfm-color-grid">
                                {colorOptions.map(color => (
                                    <label key={color.value} className="cfm-color-option">
                                        <input
                                            type="radio"
                                            name="folderColor"
                                            value={color.value}
                                            checked={selectedColor === color.value}
                                            onChange={(e) => setSelectedColor(e.target.value)}
                                            className="cfm-color-radio"
                                        />
                                        <span
                                            className="cfm-color-preview"
                                            style={{ backgroundColor: color.value }}
                                            title={color.label}
                                        ></span>
                                        <span className="cfm-color-label">{color.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="cfm-error">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        <div className="cfm-footer">
                            <button
                                type="button"
                                className="cfm-button cfm-button--secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="cfm-button cfm-button--primary"
                                disabled={isSubmitting || !folderName.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Создание...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-check"></i>
                                        Создать папку
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateFolderModal;