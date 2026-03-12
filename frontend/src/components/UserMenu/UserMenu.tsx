// UserMenu.tsx
import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { CabinetModal } from './components/CabinetModal';
import { UserDropdownMenu } from './components';
import './UserMenu.css';
import './styles/DropdownMenu.css';
import './styles/CabinetModal.css';

interface UserCabinetData {
    id: number;
    username: string;
    email?: string;
    roles: string[];
    division_info?: {
        id: string;
        name: string;
        subdivision?: {
            id: string;
            name: string;
        };
    };
    permissions?: any;
    is_global_view?: boolean;
    date_joined?: string;
    is_staff?: boolean;
}

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCabinetOpen, setIsCabinetOpen] = useState(false);
    const [userData, setUserData] = useState<UserCabinetData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    // Закрытие при клике вне меню
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadUserData = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserData(user);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Получение инициалов пользователя для аватара
    const getUserInitials = () => {
        if (!userData?.username) return '?';
        return userData.username.charAt(0).toUpperCase();
    };

    return (
        <div className="user-menu-container" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`user-menu-button ${isOpen ? 'active' : ''}`}
                aria-label="Меню пользователя"
                disabled={isLoading}
            >
                <div className="user-avatar">
                    {isLoading ? (
                        <div className="avatar-skeleton" />
                    ) : (
                        <span className="avatar-initials">{getUserInitials()}</span>
                    )}
                </div>
                <span className="user-name">
                    {isLoading ? 'Загрузка...' : userData?.username || 'Гость'}
                </span>
                <ChevronDown className={`chevron-icon ${isOpen ? 'rotated' : ''}`} size={18} />
            </button>

            {isOpen && (
                <UserDropdownMenu
                    onClose={() => setIsOpen(false)}
                    onCabinetOpen={() => {
                        setIsOpen(false);
                        setIsCabinetOpen(true);
                    }}
                />
            )}

            {isCabinetOpen && (
                <CabinetModal
                    isOpen={isCabinetOpen}
                    onClose={() => setIsCabinetOpen(false)}
                    userData={userData}
                />
            )}
        </div>
    );
}