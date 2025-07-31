import React, { useRef, useState } from 'react';
import { Employee } from '../../../../types';
import { Avatar, Button, message, Modal } from 'antd';
import { CameraOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import '../style.css';
import { config } from '../../../../config';

interface PhotoCardProps {
    person: Employee;
    onPhotoChange: (file: File) => void;
    onPhotoRemove: () => Promise<void>;
    editable?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
    person,
    onPhotoChange,
    onPhotoRemove,
    editable = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    // Генерируем URL для фото с временной меткой, чтобы избежать кэширования
    const getPhotoUrl = () => {
        if (!person.photo_url) return null;
        
        // Для Blob URL ничего не меняем
        if (person.photo_url.startsWith('blob:')) {
          return person.photo_url;
        }
        
        // Для обычных URL добавляем временную метку
        const separator = person.photo_url.includes('?') ? '&' : '?';
        return `${config.backendUrl}${person.photo_url}${separator}t=${Date.now()}`;
      };

    const fullPhotoUrl = getPhotoUrl();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.match('image.*')) {
                message.error('Пожалуйста, выберите файл изображения');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                message.error('Файл слишком большой. Максимальный размер - 5MB');
                return;
            }

            onPhotoChange(file);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setIsModalVisible(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
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

    const showModal = () => {
        if (person.photo_url || editable) {
            setIsModalVisible(true);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    console.log('pers', person)

    return (
        <div className="photo-card info-card">
            <div className="photo-card-content">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                
                {person.photo_url ? (
                    <div
                        className="photo-wrapper"
                        onClick={showModal}
                        style={{ cursor: 'pointer' }}
                    >
                        <img
                            src={fullPhotoUrl}
                            alt={person.full_name}
                            className="employee-photo"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.endsWith('/default-avatar.png')) {
                                    target.src = '/default-avatar.png';
                                }
                            }}
                        />
                        {editable && (
                            <div className="photo-overlay">
                                <span>Нажмите для просмотра</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="photo-upload-container">
                        <Avatar
                            size={64}
                            icon={<CameraOutlined />}
                            className="empty-photo-avatar"
                            onClick={editable ? showModal : undefined}
                            style={{ cursor: editable ? 'pointer' : 'default' }}
                        />
                        {editable && (
                            <Button
                                type="primary"
                                icon={<CameraOutlined />}
                                onClick={handleUploadClick}
                            >
                                Загрузить фото
                            </Button>
                        )}
                    </div>
                )}

                <Modal
                    title="Фото сотрудника"
                    open={isModalVisible}
                    onCancel={handleCancel}
                    footer={[
                        editable && person.photo_url && (
                            <Button
                                key="delete"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={handleRemovePhoto}
                                loading={loading}
                                style={{ float: 'left' }}
                            >
                                Удалить фото
                            </Button>
                        ),
                        editable && (
                            <Button
                                key="upload"
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={handleUploadClick}
                            >
                                {person.photo_url ? 'Заменить фото' : 'Загрузить фото'}
                            </Button>
                        ),
                        <Button key="back" onClick={handleCancel}>
                            Закрыть
                        </Button>,
                    ]}
                >
                    <div style={{ textAlign: 'center' }}>
                        {person.photo_url ? (
                            <img
                                src={fullPhotoUrl}
                                alt={person.full_name}
                                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.endsWith('/default-avatar.png')) {
                                        target.src = '/default-avatar.png';
                                    }
                                }}
                            />
                        ) : (
                            <Avatar
                                size={128}
                                icon={<CameraOutlined />}
                                className="empty-photo-avatar"
                            />
                        )}
                    </div>
                </Modal>
            </div>
        </div>
    );
};