import React, { useRef, useState } from 'react';
import { Employee } from '../../../../types';
import { Avatar, Button, message, Modal } from 'antd';
import { CameraOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';
import '../style.css';
import { config } from '../../../../config';

interface PhotoCardProps {
    person: Employee;
    onPhotoChange: (file: File) => void;
    onPhotoRemove: () => Promise<void>;
    editable?: boolean;
    canEditEmployee: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
    person,
    onPhotoChange,
    onPhotoRemove,
    canEditEmployee,
    editable = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const { isEditorShaWorker } = useAppPermissions();

    const getPhotoUrl = () => {
        if (!person.photo_url) return null;
        if (person.photo_url.startsWith('blob:')) {
            return person.photo_url;
        }
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
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const canEditPhoto = canEditEmployee && !isEditorShaWorker && editable;

    const getModalFooter = () => {
        const footerButtons = [];

        if (canEditPhoto && person.photo_url) {
            footerButtons.push(
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
            );
        }

        if (canEditPhoto) {
            footerButtons.push(
                <Button
                    key="upload"
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={handleUploadClick}
                >
                    {person.photo_url ? 'Заменить фото' : 'Загрузить фото'}
                </Button>
            );
        }

        footerButtons.push(
            <Button key="back" onClick={handleCancel}>
                Закрыть
            </Button>
        );

        return footerButtons;
    };

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
                        <div className="photo-overlay">
                            <span>Нажмите для просмотра</span>
                        </div>
                    </div>
                ) : (
                    <div className="photo-upload-container">
                        <Avatar
                            size={64}
                            icon={<CameraOutlined />}
                            className="empty-photo-avatar"
                            onClick={showModal}
                            style={{ cursor: 'pointer' }}
                        />
                        {canEditPhoto && (
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
                    footer={getModalFooter()}
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