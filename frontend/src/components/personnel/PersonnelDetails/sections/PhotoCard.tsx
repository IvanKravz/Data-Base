import React, { useRef, useState } from 'react';
import { Employee } from '../../../../types';
import { Avatar, Button, message, Modal } from 'antd';
import { CameraOutlined, UploadOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import '../styles/PhotoCard.css';

interface PhotoCardProps {
    person: Employee;
    onPhotoChange: (file: File) => Promise<void>;
    onPhotoRemove: () => Promise<void>;
    canEditEmployee: boolean;
    editable?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
    person,
    onPhotoChange,
    onPhotoRemove,
    canEditEmployee,
    editable = true,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const canEditPhoto = canEditEmployee && editable;

    const getPhotoUrl = () => {
        if (!person.photo_url) return null;
        if (person.photo_url.startsWith('blob:')) return person.photo_url;
        const separator = person.photo_url.includes('?') ? '&' : '?';
        return `${person.photo_url}${separator}t=${Date.now()}`;
    };

    const fullPhotoUrl = getPhotoUrl();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            message.error('Пожалуйста, выберите файл изображения');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error('Файл слишком большой. Максимальный размер — 5MB');
            return;
        }
        try {
            setLoading(true);
            await onPhotoChange(file);
            message.success('Фото обновлено');
        } catch (error) {
            message.error('Ошибка загрузки фото');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setIsModalVisible(false);
        }
    };

    const handleRemovePhoto = async () => {
        try {
            setLoading(true);
            await onPhotoRemove();
            message.success('Фото удалено');
        } catch (error) {
            message.error('Не удалось удалить фото');
        } finally {
            setLoading(false);
            setIsModalVisible(false);
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleAvatarClick = () => {
        if (fullPhotoUrl) {
            setIsModalVisible(true);
        } else if (canEditPhoto) {
            handleUploadClick();
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            <div className="photo-avatar">
                <div className="photo-wrapper" onClick={handleAvatarClick}>
                    {fullPhotoUrl ? (
                        <img src={fullPhotoUrl} alt={person.full_name} className="employee-photo" />
                    ) : (
                        <Avatar
                            size={120}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#f0f0f0', color: '#a0a0a0' }}
                        />
                    )}
                    {canEditPhoto && (
                        <div className="photo-overlay">
                            <CameraOutlined style={{ fontSize: 24, color: 'white' }} />
                        </div>
                    )}
                </div>
            </div>

            <div className="photo-info">
                <h2>{person.full_name}</h2>
                <p>{person.position}</p>
                {canEditPhoto && !fullPhotoUrl && (
                    <div className="photo-actions">
                        <Button type="primary" size="small" icon={<UploadOutlined />} onClick={handleUploadClick}>
                            Загрузить фото
                        </Button>
                    </div>
                )}
            </div>

            <Modal
                title="Фото сотрудника"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    fullPhotoUrl && canEditPhoto && (
                        <Button key="delete" danger icon={<DeleteOutlined />} onClick={handleRemovePhoto} loading={loading}>
                            Удалить
                        </Button>
                    ),
                    canEditPhoto && (
                        <Button key="upload" type="primary" icon={<UploadOutlined />} onClick={handleUploadClick} loading={loading}>
                            {fullPhotoUrl ? 'Заменить' : 'Загрузить'}
                        </Button>
                    ),
                    <Button key="back" onClick={() => setIsModalVisible(false)}>Закрыть</Button>,
                ].filter(Boolean)}
            >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    {fullPhotoUrl && (
                        <img
                            src={fullPhotoUrl}
                            alt={person.full_name}
                            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                        />
                    )}
                </div>
            </Modal>
        </>
    );
};