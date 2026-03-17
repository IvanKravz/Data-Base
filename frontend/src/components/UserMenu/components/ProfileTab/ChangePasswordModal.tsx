// components/ChangePasswordModal.tsx
import React, { useState } from 'react';
import { X, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { usersApi } from '../../../../api/users';
import '../../styles/ChangePasswordModal.css';

interface ChangePasswordModalProps {
    userId?: number;
    username?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    userId,
    username,
    onClose,
    onSuccess
}) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Состояния для показа/скрытия паролей
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isAdminMode = !!userId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newPassword) {
            setError('Введите новый пароль');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);
        try {
            if (isAdminMode) {
                await usersApi.setUserPassword(userId, newPassword);
            } else {
                if (!oldPassword) {
                    setError('Введите текущий пароль');
                    setLoading(false);
                    return;
                }
                await usersApi.changePassword({ old_password: oldPassword, new_password: newPassword });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Ошибка при смене пароля');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-overlay" onClick={onClose}>
            <div className="change-password-modal" onClick={e => e.stopPropagation()}>
                <div className="change-password-header">
                    <div className="change-password-header-left">
                        <Key className="change-password-title-icon" size={24} />
                        <div>
                            <h2 className="change-password-title">Смена пароля</h2>
                            <p className="change-password-subtitle">
                                {isAdminMode
                                    ? `Установка нового пароля для пользователя ${username || ''}`
                                    : 'Изменение пароля вашей учетной записи'}
                            </p>
                        </div>
                    </div>
                    <button className="change-password-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form className="change-password-form" onSubmit={handleSubmit}>
                    {error && <div className="change-password-error">{error}</div>}

                    {!isAdminMode && (
                        <div className="change-password-form-group">
                            <label htmlFor="old-password">
                                <Lock size={16} />
                                Текущий пароль
                            </label>
                            <div className="change-password-input-wrapper">
                                <input
                                    id="old-password"
                                    type={showOldPassword ? 'text' : 'password'}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Введите текущий пароль"
                                    required
                                />
                                <button
                                    type="button"
                                    className="change-password-toggle-btn"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    tabIndex={-1}
                                >
                                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="change-password-form-group">
                        <label htmlFor="new-password">
                            <Key size={16} />
                            Новый пароль
                        </label>
                        <div className="change-password-input-wrapper">
                            <input
                                id="new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Введите новый пароль"
                                required
                            />
                            <button
                                type="button"
                                className="change-password-toggle-btn"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                tabIndex={-1}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="change-password-form-group">
                        <label htmlFor="confirm-password">
                            <Key size={16} />
                            Подтверждение пароля
                        </label>
                        <div className="change-password-input-wrapper">
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Повторите новый пароль"
                                required
                            />
                            <button
                                type="button"
                                className="change-password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="change-password-form-actions">
                        <button type="button" className="change-password-btn-secondary" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="change-password-btn-primary" disabled={loading}>
                            {loading ? 'Сохранение...' : 'Сменить пароль'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};