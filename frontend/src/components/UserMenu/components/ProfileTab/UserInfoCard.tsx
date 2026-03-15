import React from 'react';
import { User, Edit } from 'lucide-react';

interface UserInfoCardProps {
    username: string;
    rolesDisplay: string;
    avatar?: string;
    onEdit?: () => void;
    showEditButton?: boolean;
}

export const UserInfoCard: React.FC<UserInfoCardProps> = ({
    username,
    rolesDisplay,
    avatar,
    onEdit,
    showEditButton = false,
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
            {showEditButton && onEdit && (
                <button onClick={onEdit} className="cabinet-edit-btn">
                    <Edit className="w-4 h-4" />
                    Редактировать
                </button>
            )}
        </div>
    );
};