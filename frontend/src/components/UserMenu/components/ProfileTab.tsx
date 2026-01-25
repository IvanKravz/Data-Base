// components/ProfileTab.tsx
import React, { useState } from 'react';
import { User, Mail, Globe, Calendar, Edit, Check } from 'lucide-react';
import '../styles/ProfileTab.css';

interface ProfileTabProps {
    userData: any;
}

export function ProfileTab({ userData }: ProfileTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        email: userData?.email || '',
        division: userData?.division_info?.name || '',
        subdivision: userData?.division_info?.subdivision?.name || '',
    });

    const handleSaveChanges = async () => {
        try {
            if (userData) {
                const updatedUser = {
                    ...userData,
                    email: editForm.email,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            setIsEditing(false);
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
                hour: '2-digit',
                minute: '2-digit',
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

    return (
        <>
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

            <div className="cabinet-form-section">
                <div className="form-section-header">
                    <h4 className="form-section-title">Основная информация</h4>
                    {isEditing ? (
                        <div className="form-actions">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditForm({
                                        email: userData?.email || '',
                                        division: userData?.division_info?.name || '',
                                        subdivision: userData?.division_info?.subdivision?.name || '',
                                    });
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
        </>
    );
}