// components/UserDropdownMenu.tsx
import React from 'react';
import { Settings, LogOut } from 'lucide-react';
import '../styles/DropdownMenu.css';
import { authApi } from '../../../api';

interface UserDropdownMenuProps {
    onClose: () => void;
    onCabinetOpen: () => void;
}

export function UserDropdownMenu({ onClose, onCabinetOpen }: UserDropdownMenuProps) {
    const handleLogout = async () => {  // ← СДЕЛАТЬ async
        try {
            // Вызываем серверный logout для инвалидации токена
            await authApi.logout();
            // После logout() произойдет очистка localStorage и перенаправление
        } catch (error) {
            console.error('Logout error:', error);
            // Даже при ошибке очищаем localStorage и перенаправляем
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('appLoaded');
            window.location.href = '/auth';
        }
    };

    return (
        <div className="user-dropdown-menu">
            <button
                onClick={() => {
                    onClose();
                    onCabinetOpen();
                }}
                className="dropdown-item cabinet-item"
            >
                <Settings className="dropdown-icon" />
                <div className="dropdown-text">
                    <span className="dropdown-title">Личный кабинет</span>
                </div>
            </button>

            <div className="dropdown-divider" />

            <button
                onClick={handleLogout}  // ← Теперь вызывает authApi.logout()
                className="dropdown-item logout-item"
            >
                <LogOut className="dropdown-icon" />
                <span>Выйти</span>
            </button>
        </div>
    );
}