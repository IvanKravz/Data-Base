import React, { useState, useEffect } from 'react';
import { X, User, Clock, Database } from 'lucide-react';
import { usersApi } from '../../../../api/users';
import { authApi } from '../../../../api/auth'; // Добавляем импорт
import '../styles/UserDetailsModal.css';
import { ProfileTab } from '../../components/ProfileTab/ProfileTab';
import { ActivityTab } from '../../components/ActivityTab';
import { AdminLogsCleanup } from '../../components/AdminLogsCleanup';

interface UserDetailsModalProps {
    userId: number;
    onClose: () => void;
    onEdit: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ userId, onClose, onEdit }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'admin'>('profile');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Получаем данные текущего пользователя (администратора)
    const currentUser = authApi.getCurrentUser();
    const isCurrentUserAdmin = currentUser?.is_staff || currentUser?.roles?.includes('admin');

    useEffect(() => {
        usersApi.getUser(userId).then(res => setUser(res.data)).finally(() => setLoading(false));
    }, [userId]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-user user-details-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <User className="modal-title-icon" size={24} />
                        <div>
                            <h2 className="modal-title">Пользователь: {user?.username}</h2>
                            <p className="modal-subtitle">Просмотр данных пользователя</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="tabs">
                    <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <User size={16} /> Профиль
                    </button>
                    <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
                        <Clock size={16} /> Активность
                    </button>
                    {/* Показываем вкладку только если текущий пользователь - администратор */}
                    {isCurrentUserAdmin && (
                        <button className={`tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
                            <Database size={16} /> Очистка логов
                        </button>
                    )}
                </div>

                <div className="tab-content">
                    {activeTab === 'profile' && <ProfileTab userId={userId} onEdit={onEdit} />}
                    {activeTab === 'activity' && <ActivityTab userId={userId} />}
                    {activeTab === 'admin' && <AdminLogsCleanup userId={userId} />}
                </div>
            </div>
        </div>
    );
};