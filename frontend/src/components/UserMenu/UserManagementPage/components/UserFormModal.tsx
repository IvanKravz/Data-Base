import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Key, Building2, Layers } from 'lucide-react'; // переименовали User в UserIcon
import { usersApi, User, UserCreateData, UserUpdateData } from '../../../../api/users';
import { divisionsApi } from '../../../../api/divisions';
import '../styles/UserFormModal.css';

interface Division {
    id: number;
    name: string;
}

interface Subdivision {
    id: number;
    name: string;
    division: number;
}

interface UserFormModalProps {
    user?: User | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        confirmPassword: '',
        user_division_id: user?.division_info?.id ? Number(user.division_info.id) : null,
        user_subdivision_id: user?.division_info?.subdivision?.id ? Number(user.division_info.subdivision.id) : null,
        is_active: user?.is_active ?? true,
    });
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDivisions = async () => {
            try {
                const data = await divisionsApi.getDivisions();
                setDivisions(data);
            } catch (err) {
                console.error('Failed to load divisions', err);
            }
        };
        fetchDivisions();
    }, []);

    useEffect(() => {
        if (formData.user_division_id) {
            const fetchSubdivisions = async () => {
                try {
                    const data = await divisionsApi.getSubdivisions(formData.user_division_id);
                    setSubdivisions(data);
                } catch (err) {
                    console.error('Failed to load subdivisions', err);
                }
            };
            fetchSubdivisions();
        } else {
            setSubdivisions([]);
        }
    }, [formData.user_division_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user && formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (user) {
                const updateData: UserUpdateData = {
                    email: formData.email || undefined,
                    user_division_id: formData.user_division_id,
                    user_subdivision_id: formData.user_subdivision_id,
                    is_active: formData.is_active,
                };
                await usersApi.updateUser(user.id, updateData);
            } else {
                const createData: UserCreateData = {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email || undefined,
                    user_division_id: formData.user_division_id,
                    user_subdivision_id: formData.user_subdivision_id,
                };
                await usersApi.createUser(createData);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-user user-form-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <UserIcon className="modal-title-icon" size={24} />
                        <div>
                            <h2 className="modal-title">
                                {user ? 'Редактирование пользователя' : 'Создание пользователя'}
                            </h2>
                            <p className="modal-subtitle">
                                {user ? 'Измените данные пользователя' : 'Заполните информацию для нового пользователя'}
                            </p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="username">
                            <UserIcon size={16} />
                            Имя пользователя <span className="required">*</span>
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            required
                            disabled={!!user}
                            placeholder="Введите имя пользователя"
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            <Mail size={16} />
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="user@example.com"
                            autoComplete="email"
                        />
                    </div>

                    {!user && (
                        <>
                            <div className="form-group">
                                <label htmlFor="password">
                                    <Key size={16} />
                                    Пароль <span className="required">*</span>
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    placeholder="Введите пароль"
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">
                                    <Key size={16} />
                                    Подтверждение пароля <span className="required">*</span>
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    placeholder="Повторите пароль"
                                    autoComplete="new-password"
                                />
                            </div>
                        </>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="division">
                                <Building2 size={16} />
                                Подразделение
                            </label>
                            <select
                                id="division"
                                value={formData.user_division_id || ''}
                                onChange={e => setFormData({ ...formData, user_division_id: e.target.value ? Number(e.target.value) : null, user_subdivision_id: null })}
                            >
                                <option value="">Не выбрано</option>
                                {divisions.map(div => (
                                    <option key={div.id} value={div.id}>{div.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="subdivision">
                                <Layers size={16} />
                                Отделение
                            </label>
                            <select
                                id="subdivision"
                                value={formData.user_subdivision_id || ''}
                                onChange={e => setFormData({ ...formData, user_subdivision_id: e.target.value ? Number(e.target.value) : null })}
                                disabled={!formData.user_division_id}
                            >
                                <option value="">Не выбрано</option>
                                {subdivisions.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {user && (
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                Активен
                            </label>
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Сохранение...' : (user ? 'Сохранить изменения' : 'Создать пользователя')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};