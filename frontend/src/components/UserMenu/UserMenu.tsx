// UserMenu.tsx
import React, { useState, useEffect } from 'react';
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
    permissions?: {
        roles: Array<{
            id: string;
            name: string;
            description: string;
        }>;
        modules: string[];
        models: Record<string, string[]>;
        filters: Record<string, any>;
    };
    is_global_view?: boolean;
    date_joined?: string;
    is_staff?: boolean;
}

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCabinetOpen, setIsCabinetOpen] = useState(false);
    const [userData, setUserData] = useState<UserCabinetData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUserData();
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

    console.log('userData', userData)

    return (
        <div className="user-menu-container">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="user-menu-button"
                aria-label="Меню пользователя"
                disabled={isLoading}
            >
                <User className="user-menu-icon" />
                {isLoading ? (
                    <span className="user-menu-username animate-pulse">Загрузка...</span>
                ) : (
                    <span className="user-menu-username">
                        {userData?.username || 'Гость'}
                    </span>
                )}
                <ChevronDown className={`user-menu-arrow ${isOpen ? 'rotate-180' : ''}`} />
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