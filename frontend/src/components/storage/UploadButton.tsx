import React, { useRef, useState } from 'react';
import './styles/UploadButton.css';

interface UploadButtonProps {
    onClick?: () => void;
    multiple?: boolean;
    accept?: string;
    onFilesSelected?: (files: FileList) => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'icon';
    size?: 'small' | 'medium' | 'large';
}

const UploadButton: React.FC<UploadButtonProps> = ({
    onClick,
    multiple = true,
    accept = '*/*',
    onFilesSelected,
    disabled = false,
    variant = 'primary',
    size = 'medium'
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);

    const handleButtonClick = () => {
        if (onClick) {
            onClick();
        } else if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0 && onFilesSelected) {
            onFilesSelected(files);
            event.target.value = ''; // Сбрасываем значение
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (onFilesSelected) {
                onFilesSelected(e.dataTransfer.files);
            }
        }
    };

    const getButtonClass = () => {
        const classes = ['storage-upload-button'];

        classes.push(`storage-upload-button-${variant}`);
        classes.push(`storage-upload-button-${size}`);

        if (disabled) classes.push('storage-upload-button-disabled');
        if (isDragging) classes.push('storage-upload-button-dragging');

        return classes.join(' ');
    };

    const getButtonContent = () => {
        switch (variant) {
            case 'icon':
                return <i className="fas fa-upload"></i>;
            case 'secondary':
                return (
                    <>
                        <i className="fas fa-upload"></i>
                        <span>Загрузить</span>
                    </>
                );
            case 'primary':
            default:
                return (
                    <>
                        <i className="fas fa-cloud-upload-alt"></i>
                        <span>Загрузить файлы</span>
                    </>
                );
        }
    };

    return (
        <div
            className="storage-upload-button-container"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <button
                type="button"
                className={getButtonClass()}
                onClick={handleButtonClick}
                disabled={disabled}
                title={variant === 'icon' ? 'Загрузить файлы' : undefined}
            >
                {getButtonContent()}
            </button>

            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleFileChange}
                className="storage-upload-input"
                style={{ display: 'none' }}
            />

            {isDragging && (
                <div className="storage-upload-drag-overlay">
                    <div className="storage-upload-drag-content">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <p>Перетащите файлы сюда</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadButton;