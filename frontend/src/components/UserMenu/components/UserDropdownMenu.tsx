// components/UserDropdownMenu.tsx
import React from 'react';
import { Settings, LogOut, Users, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/DropdownMenu.css';
import { authApi } from '../../../api';
import { getCurrentUser } from '../../../api/utils/permissions';

interface UserDropdownMenuProps {
    onClose: () => void;
    onCabinetOpen: () => void;
}

export function UserDropdownMenu({ onClose, onCabinetOpen }: UserDropdownMenuProps) {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const isAdmin = user?.is_staff || user?.roles?.includes('admin');

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('appLoaded');
            window.location.href = '/auth';
        }
    };

    const handleUsersManagement = () => {
        onClose();
        navigate('/admin/users');
    };

    return (
        <div className="dropdown-menu">
            <div className="dropdown-divider" />

            <button
                onClick={() => {
                    onClose();
                    onCabinetOpen();
                }}
                className="dropdown-item"
            >
                <Settings className="dropdown-icon" size={18} />
                <span>Личный кабинет</span>
            </button>

            {isAdmin && (
                <>
                    <div className="dropdown-divider" />
                    <button
                        onClick={handleUsersManagement}
                        className="dropdown-item"
                    >
                        <Users className="dropdown-icon" size={18} />
                        <span>Управление пользователями</span>
                    </button>
                </>
            )}

            <div className="dropdown-divider" />

            <button
                onClick={handleLogout}
                className="dropdown-item logout-item"
            >
                <LogOut className="dropdown-icon" size={18} />
                <span>Выйти</span>
            </button>
        </div>
    );
}