// components/ProfileTab.tsx
import React, { useState } from 'react';
import { 
  User, Mail, Globe, Calendar, Edit, Check, Shield, 
  Eye, PlusCircle, Edit2, Trash2, Users, Building, 
  Network, Server, Briefcase, Target, Wrench, Cpu,
  MapPin, Layers, Folder, Settings, Database
} from 'lucide-react';
import '../styles/ProfileTab.css';

interface ProfileTabProps {
    userData: any;
}

// Маппинг модулей к соответствующим моделям
const MODULE_TO_MODELS: Record<string, string[]> = {
  'equipment': ['Equipment', 'EquipmentCategory'],
  'networks': ['CommunicationNetwork', 'CommunicationPost'],
  'divisions': ['Division', 'Subdivision', 'Facility', 'FacilityType'],
  'tasks': ['Task'],
  'employees': ['Employee'],
  'users': ['User'],
  'storage': ['StorageFile', 'StorageFolder'],
  'maps': ['Map'],
  'organs': ['InterestOrgan'],
  'sha_equipment': ['Equipment', 'EquipmentCategory'],
  'sha_workers': ['Employee']
};

export function ProfileTab({ userData }: ProfileTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
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

    const getModelDisplayName = (model: string) => {
        const modelNames: Record<string, string> = {
            'CommunicationNetwork': 'Коммуникационные сети',
            'CommunicationPost': 'Посты связи',
            'Division': 'Подразделения',
            'Subdivision': 'Отделения',
            'Employee': 'Сотрудники',
            'Equipment': 'Оборудование',
            'EquipmentCategory': 'Категории оборудования',
            'Facility': 'Объекты',
            'FacilityType': 'Типы объектов',
            'InterestOrgan': 'Заинтересованные органы',
            'Map': 'Карты',
            'StorageFile': 'Файлы хранилища',
            'StorageFolder': 'Папки хранилища',
            'Task': 'Задачи',
            'User': 'Пользователи',
        };
        return modelNames[model] || model;
    };

    const getActionDisplayName = (action: string) => {
        const actionNames: Record<string, string> = {
            'view': 'Просмотр',
            'add': 'Добавление',
            'change': 'Редактирование',
            'delete': 'Удаление',
        };
        return actionNames[action] || action;
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'view': return <Eye className="permission-icon" />;
            case 'add': return <PlusCircle className="permission-icon" />;
            case 'change': return <Edit2 className="permission-icon" />;
            case 'delete': return <Trash2 className="permission-icon" />;
            default: return <Eye className="permission-icon" />;
        }
    };

    const getModuleDisplayName = (module: string) => {
        const moduleNames: Record<string, string> = {
            'equipment': 'Оборудование',
            'networks': 'Сети',
            'divisions': 'Подразделения',
            'tasks': 'Задачи',
            'employees': 'Сотрудники',
            'users': 'Пользователи',
            'storage': 'Хранилище',
            'maps': 'Карты',
            'organs': 'Органы',
            'sha_equipment': 'Шатехника',
            'sha_workers': 'Шаработники',
        };
        return moduleNames[module] || module;
    };

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'equipment':
            case 'sha_equipment':
                return <Server className="module-icon" />;
            case 'networks': return <Network className="module-icon" />;
            case 'divisions': return <Building className="module-icon" />;
            case 'tasks': return <Target className="module-icon" />;
            case 'employees':
            case 'sha_workers':
            case 'users':
                return <Users className="module-icon" />;
            case 'storage': return <Folder className="module-icon" />;
            case 'maps': return <MapPin className="module-icon" />;
            case 'organs': return <Briefcase className="module-icon" />;
            default: return <Settings className="module-icon" />;
        }
    };

    // Фильтрация модулей для отображения
    const filteredModules = userData?.permissions?.modules?.filter(
        (module: string) => module !== 'subdivisions'
    ) || [];

    // Функция для фильтрации моделей по выбранному модулю
    const getFilteredModels = () => {
        if (!selectedModule || !userData?.permissions?.models) {
            return userData?.permissions?.models || {};
        }
        
        const modelsForModule = MODULE_TO_MODELS[selectedModule] || [];
        const filtered: Record<string, any> = {};
        
        Object.entries(userData.permissions.models).forEach(([model, actions]) => {
            if (modelsForModule.includes(model)) {
                filtered[model] = actions;
            }
        });
        
        return filtered;
    };

    const handleModuleClick = (module: string) => {
        if (selectedModule === module) {
            setSelectedModule(null);
        } else {
            setSelectedModule(module);
        }
    };

    console.log('userData', userData);

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

            <div className="profile-grid-container">
                <div className="profile-grid">
                    {/* Основная информация */}
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

                        <table className="info-table">
                            <tbody>
                                <tr className="info-table-row">
                                    <td className="info-table-label">
                                        <label className="form-label-user">
                                            <Globe className="form-label-icon" />
                                            <span>Подразделение</span>
                                        </label>
                                    </td>
                                    <td className="info-table-value">
                                        <div className="form-value">
                                            {userData?.division_info?.name || 'Не назначено'}
                                        </div>
                                    </td>
                                </tr>
                                <tr className="info-table-row">
                                    <td className="info-table-label">
                                        <label className="form-label-user">
                                            <Globe className="form-label-icon" />
                                            <span>Отделение</span>
                                        </label>
                                    </td>
                                    <td className="info-table-value">
                                        <div className="form-value">
                                            {userData?.division_info?.subdivision?.name || 'Не назначено'}
                                        </div>
                                    </td>
                                </tr>
                                <tr className="info-table-row">
                                    <td className="info-table-label">
                                        <label className="form-label-user">
                                            <Calendar className="form-label-icon" />
                                            <span>Дата регистрации</span>
                                        </label>
                                    </td>
                                    <td className="info-table-value">
                                        <div className="form-value">
                                            {formatDate(userData?.date_joined)}
                                        </div>
                                    </td>
                                </tr>
                                <tr className="info-table-row">
                                    <td className="info-table-label">
                                        <label className="form-label-user">
                                            <Mail className="form-label-icon" />
                                            <span>Email</span>
                                        </label>
                                    </td>
                                    <td className="info-table-value">
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
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Блоки прав доступа */}
                    {userData?.permissions && (
                        <>
                            <div className="cabinet-form-section permissions-modules-section">
                                <div className="form-section-header">
                                    <h4 className="form-section-title">
                                        <Shield className="w-5 h-5 mr-2" />
                                        Доступные модули
                                    </h4>
                                    {selectedModule && (
                                        <button
                                            onClick={() => setSelectedModule(null)}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Показать все
                                        </button>
                                    )}
                                </div>
                                <div className="modules-grid">
                                    {filteredModules.map((module: string, index: number) => (
                                        <div 
                                            key={index} 
                                            className={`module-card ${selectedModule === module ? 'module-card-selected' : ''}`}
                                            onClick={() => handleModuleClick(module)}
                                            title={`Нажмите для просмотра разрешений модуля "${getModuleDisplayName(module)}"`}
                                        >
                                            <div className="module-icon-container">
                                                {getModuleIcon(module)}
                                            </div>
                                            <span className="module-name">{getModuleDisplayName(module)}</span>
                                            {selectedModule === module && (
                                                <div className="module-selected-indicator"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="cabinet-form-section permissions-details-section">
                                <div className="form-section-header">
                                    <h4 className="form-section-title">
                                        <Shield className="w-5 h-5 mr-2" />
                                        {selectedModule ? 
                                            `Детальные разрешения: ${getModuleDisplayName(selectedModule)}` : 
                                            'Детальные разрешения'
                                        }
                                    </h4>
                                </div>
                                <div className="permissions-table-container">
                                    <table className="permissions-table">
                                        <thead>
                                            <tr>
                                                <th>Модель</th>
                                                <th>Доступные действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(getFilteredModels()).map(([model, actions]: [string, any], index: number) => (
                                                <tr key={index} className="permission-row">
                                                    <td className="permission-model">
                                                        <div className="permission-model-name">
                                                            {getModelDisplayName(model)}
                                                        </div>
                                                    </td>
                                                    <td className="permission-actions">
                                                        <div className="actions-container">
                                                            {Array.isArray(actions) && actions.map((action: string, actionIndex: number) => (
                                                                <div key={actionIndex} className="action-badge">
                                                                    {getActionIcon(action)}
                                                                    <span>{getActionDisplayName(action)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {Object.keys(getFilteredModels()).length === 0 && (
                                                <tr>
                                                    <td colSpan={2} className="text-center py-4 text-gray-500">
                                                        {selectedModule ? 
                                                            `Нет детальных разрешений для модуля "${getModuleDisplayName(selectedModule)}"` : 
                                                            'Нет данных о разрешениях'
                                                        }
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}