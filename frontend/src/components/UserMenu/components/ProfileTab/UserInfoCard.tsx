// UserInfoCard.tsx
import React from 'react';
import { User, Edit, Trash2, Key } from 'lucide-react';

interface UserInfoCardProps {
    username: string;
    rolesDisplay: string;
    avatar?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    onPasswordChange?: () => void;
    showEditButton?: boolean;
    showDeleteButton?: boolean;
    showPasswordButton?: boolean;
}

export const UserInfoCard: React.FC<UserInfoCardProps> = ({
    username,
    rolesDisplay,
    avatar,
    onEdit,
    onDelete,
    onPasswordChange,
    showEditButton = false,
    showDeleteButton = false,
    showPasswordButton = false,
}) => {
    return (
        <div className="cabinet-info-card">
            <div className="cabinet-avatar">
                {avatar ? (
                    <img src={avatar} alt={username} className="avatar-image" />
                ) : (
                    <User className="w-10 h-10 text-gray-400" />
                )}
            </div>
            <div className="cabinet-user-info">
                <h3 className="cabinet-user-name">{username}</h3>
                <p className="cabinet-user-role">{rolesDisplay}</p>
            </div>
            <div className="user-info-actions">
                {showEditButton && onEdit && (
                    <button onClick={onEdit} className="cabinet-edit-btn">
                        <Edit className="w-4 h-4" />
                        Редактировать
                    </button>
                )}
                {showPasswordButton && onPasswordChange && (
                    <button onClick={onPasswordChange} className="cabinet-password-btn" title="Сменить пароль">
                        <Key className="w-4 h-4" />
                    </button>
                )}
                {showDeleteButton && onDelete && (
                    <button onClick={onDelete} className="cabinet-delete-btn" title="Удалить пользователя">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};