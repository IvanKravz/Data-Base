import React, { useRef, useState } from 'react';
import { Employee } from '../../../../types';
import { Avatar, Button, message, Modal } from 'antd';
import { CameraOutlined, UploadOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';
import '../PersonnelDetails.css';

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
        if (person.photo_url.startsWith('blob:')) return person.photo_url;
        const separator = person.photo_url.includes('?') ? '&' : '?';
        return `${person.photo_url}${separator}t=${Date.now()}`;
    };

    const fullPhotoUrl = getPhotoUrl();
    const canEditPhoto = canEditEmployee && !isEditorShaWorker && editable;

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
            if (fileInputRef.current) fileInputRef.current.value = '';
            setIsModalVisible(false);
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();
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
        if (fullPhotoUrl) setIsModalVisible(true);
        else if (canEditPhoto) handleUploadClick();
    };

    return (
        <div className="photo-card">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <div className="photo-avatar">
                {fullPhotoUrl ? (
                    <div className="photo-wrapper" onClick={showModal}>
                        <img src={fullPhotoUrl} alt={person.full_name} className="employee-photo" />
                        {canEditPhoto && (
                            <div className="photo-overlay">
                                <CameraOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </div>
                        )}
                    </div>
                ) : (
                    <Avatar size={100} icon={<UserOutlined />} onClick={showModal} style={{ cursor: 'pointer', backgroundColor: '#f0f0f0', color: '#a0a0a0' }} />
                )}
            </div>
            <div className="photo-info">
                <h2>{person.full_name}</h2>
                <p>{person.position}</p>
                {canEditPhoto && !fullPhotoUrl && (
                    <div className="photo-actions">
                        <Button type="primary" icon={<UploadOutlined />} onClick={handleUploadClick}>
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
                        <Button key="upload" type="primary" icon={<UploadOutlined />} onClick={handleUploadClick}>
                            {fullPhotoUrl ? 'Заменить' : 'Загрузить'}
                        </Button>
                    ),
                    <Button key="back" onClick={() => setIsModalVisible(false)}>Закрыть</Button>,
                ].filter(Boolean)}
            >
                <div style={{ textAlign: 'center' }}>
                    {fullPhotoUrl && <img src={fullPhotoUrl} alt={person.full_name} style={{ maxWidth: '100%', maxHeight: '70vh' }} />}
                </div>
            </Modal>
        </div>
    );
};