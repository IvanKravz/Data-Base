// UserMenu.tsx
import React, { useState, useEffect } from 'react';
import { LogOut, User, Settings, ChevronDown, X, Edit, Check, Mail, Globe, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UserMenu.css';

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
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        email: '',
        division: '',
        subdivision: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Загружаем данные пользователя при монтировании компонента
    useEffect(() => {
        loadUserData();
    }, []);

    // Загружаем данные пользователя при открытии кабинета
    useEffect(() => {
        if (isCabinetOpen) {
            refreshUserData();
        }
    }, [isCabinetOpen]);

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

    const refreshUserData = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserData(user);
                setEditForm({
                    email: user.email || '',
                    division: user.division_info?.name || '',
                    subdivision: user.division_info?.subdivision?.name || '',
                });
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('appLoaded');
            navigate('/auth', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleSaveChanges = async () => {
        try {
            // TODO: Реализовать обновление данных через API
            console.log('Saving changes:', editForm);

            // Временно обновляем локальные данные
            if (userData) {
                const updatedUser = {
                    ...userData,
                    email: editForm.email,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUserData(updatedUser);
            }

            setIsEditing(false);
            // TODO: Показать уведомление об успешном сохранении
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Не указано';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return 'Неверный формат даты';
        }
    };

    const getRoleDisplayName = (role: string) => {
        const roleNames: Record<string, string> = {
            'admin': 'Администратор',
            'leader': 'Руководитель',
            'user': 'Пользователь',
            'deputy_director': 'Заместитель руководителя',
            'head_of_department_1': 'Начальник 1 отдела',
            'head_of_section_1_1': 'Начальник 1 отделения',
            'hr_section_1_1': 'Сотрудник по личному составу',
            'tech_section_1_1': 'Сотрудник по технике',
            'employee_section_1_2': 'Сотрудник 2 отделения',
            'exploitation_chief': 'Начальник подразделения эксплуатации',
            'exploitation_employee': 'Сотрудник подразделения эксплуатации',
        };
        return roleNames[role] || role;
    };

    const handleGlobalViewToggle = async (checked: boolean) => {
        try {
            // TODO: Реализовать обновление глобального режима через API
            console.log('Updating global view to:', checked);

            // Временно обновляем локальные данные
            if (userData) {
                const updatedUser = {
                    ...userData,
                    is_global_view: checked,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUserData(updatedUser);

                // Можно также отправить событие для обновления состояния в других компонентах
                window.dispatchEvent(new CustomEvent('globalViewChanged', {
                    detail: { isGlobalView: checked }
                }));
            }
        } catch (error) {
            console.error('Error updating global view:', error);
        }
    };

    return (
        <div className="user-menu-container">
            {/* Кнопка открытия меню */}
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

            {/* Выпадающее меню */}
            {isOpen && (
                <div className="user-dropdown-menu">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setIsCabinetOpen(true);
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
                        onClick={handleLogout}
                        className="dropdown-item logout-item"
                    >
                        <LogOut className="dropdown-icon" />
                        <span>Выйти</span>
                    </button>
                </div>
            )}

            {/* Модальное окно кабинета */}
            {isCabinetOpen && (
                <div className="cabinet-modal-overlay" onClick={() => setIsCabinetOpen(false)}>
                    <div className="cabinet-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Заголовок */}
                        <div className="cabinet-header">
                            <div className="cabinet-header-left">
                                <User className="cabinet-title-icon" />
                                <div>
                                    <h2 className="cabinet-title">Личный кабинет</h2>
                                    <p className="cabinet-subtitle">Управление профилем и настройками</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCabinetOpen(false)}
                                className="cabinet-close-btn"
                                aria-label="Закрыть"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Основное содержимое */}
                        <div className="cabinet-content">
                            {/* Информационная карточка */}
                            <div className="cabinet-info-card">
                                <div className="cabinet-avatar">
                                    <User className="w-10 h-10 text-gray-400" />
                                </div>
                                <div className="cabinet-user-info">
                                    <h3 className="cabinet-user-name">{userData?.username}</h3>
                                    <p className="cabinet-user-role">
                                        {userData?.roles?.map(role => getRoleDisplayName(role)).join(', ') || 'Роли не назначены'}
                                    </p>
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="cabinet-edit-btn"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Редактировать
                                    </button>
                                )}
                            </div>

                            {/* Форма редактирования */}
                            <div className="cabinet-form-section">
                                <div className="form-section-header">
                                    <h4 className="form-section-title">Основная информация</h4>
                                    {isEditing ? (
                                        <div className="form-actions">
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    refreshUserData();
                                                }}
                                                className="form-cancel-btn"
                                            >
                                                Отмена
                                            </button>
                                            <button
                                                onClick={handleSaveChanges}
                                                className="form-save-btn"
                                            >
                                                <Check className="w-4 h-4" />
                                                Сохранить
                                            </button>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="form-grid">
                                    <div className="form-field">
                                        <label className="form-label-user">
                                            <Mail className="form-label-icon" />
                                            <span>Email</span>
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="form-input"
                                                placeholder="Введите email"
                                            />
                                        ) : (
                                            <div className="form-value">
                                                {userData?.email || 'Не указан'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label-user">
                                            <Globe className="form-label-icon" />
                                            <span>Подразделение</span>
                                        </label>
                                        <div className="form-value">
                                            {userData?.division_info?.name || 'Не назначено'}
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label-user">
                                            <Globe className="form-label-icon" />
                                            <span>Отделение</span>
                                        </label>
                                        <div className="form-value">
                                            {userData?.division_info?.subdivision?.name || 'Не назначено'}
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label-user">
                                            <Calendar className="form-label-icon" />
                                            <span>Дата регистрации</span>
                                        </label>
                                        <div className="form-value">
                                            {formatDate(userData?.date_joined)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Системная информация */}
                            <div className="cabinet-system-info">
                                <div className="system-info-item">
                                    <div className="global-view-toggle">
                                        <label className="toggle-label">
                                            <input
                                                type="checkbox"
                                                checked={userData?.is_global_view || false}
                                                onChange={(e) => handleGlobalViewToggle(e.target.checked)}
                                                className="toggle-input"
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                        <div className="toggle-content">
                                            <p className="toggle-title">Глобальный режим просмотра</p>
                                            <p className="toggle-description">
                                                Просмотр данных всех подразделений
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}