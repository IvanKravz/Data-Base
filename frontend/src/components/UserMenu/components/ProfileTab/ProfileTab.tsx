// components/ProfileTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    User, Mail, Globe, Calendar, Edit, Check, Shield,
    Eye, PlusCircle, Edit2, Trash2, Users, Building,
    Network, Server, Briefcase, Target, Wrench, Cpu,
    MapPin, Layers, Folder, Settings, Database
} from 'lucide-react';
import { usersApi, AvailableRole } from '../../../../api/users';
import { UserInfoCard } from './UserInfoCard';
import { RoleEditor } from './RoleEditor';
import { PermissionsModules } from './PermissionsModules';
import { PermissionsDetails } from './PermissionsDetails';
import '../../styles/ProfileTab.css';

interface ProfileTabProps {
    userData?: any;
    userId?: number;
    onEdit?: () => void;
}

interface ModuleSubsection {
    id: string;
    name: string;
    models: string[];
}

// Конфигурация модулей и подразделов
const MODULE_SECTIONS: Record<string, ModuleSubsection[]> = {
    employees: [
        { id: 'common', name: 'Обычные сотрудники', models: ['Employee'] },
        { id: 'sha', name: 'Шаработники', models: ['ShaWorkerDetails', 'ShaEquipmentConclusion'] },
    ],
    equipment: [
        { id: 'common', name: 'Обычное оборудование', models: ['Equipment', 'EquipmentCategory'] },
    ],
    divisions: [
        { id: 'structure', name: 'Структура подразделений', models: ['Division', 'Subdivision', 'Facility', 'FacilityType', 'CommunicationPost'] },
    ],
    networks: [
        { id: 'main', name: 'Основные сети', models: ['CommunicationNetwork', 'NetworkMembership', 'NetworkDirection'] },
        { id: 'details', name: 'Детали сети', models: ['VLAN', 'NetworkInterface', 'VLANConfiguration', 'IPAddress', 'RoutingTable', 'ACL', 'IPRange'] },
    ],
    tasks: [
        { id: 'tasks', name: 'Задачи', models: ['Task'] },
        { id: 'steps', name: 'Этапы задач', models: ['TaskStep'] },
    ],
    users: [
        { id: 'users', name: 'Учётные записи', models: ['User'] },
    ],
    storage: [
        { id: 'folders', name: 'Папки', models: ['StorageFolder'] },
        { id: 'files', name: 'Файлы', models: ['StorageFile'] },
    ],
    maps: [
        { id: 'offices', name: 'Территориальные органы ФСБ', models: ['FSBOffice'] },
    ],
    organs: [
        { id: 'interest', name: 'Заинтересованные органы', models: ['InterestOrgan'] },
    ],
};

// Список основных модулей для отображения в плитках
const MAIN_MODULES = Object.keys(MODULE_SECTIONS);

// Построение обратного маппинга модель -> модуль
const buildModelToModuleMap = (): Record<string, string> => {
    const map: Record<string, string> = {};
    Object.entries(MODULE_SECTIONS).forEach(([module, sections]) => {
        sections.forEach(section => {
            section.models.forEach(model => {
                map[model] = module;
            });
        });
    });
    return map;
};
const MODEL_TO_MODULE = buildModelToModuleMap();

// Порядок сортировки ролей (как в permissions_config.py)
const ROLE_ORDER = [
    'admin',
    'leader',
    'deputy_director',
    'head_of_department_1',
    'head_of_section_1_1',
    'hr_section_1_1',
    'tech_section_1_1',
    'employee_section_1_2',
    'exploitation_chief',
    'exploitation_employee'
];

export function ProfileTab({ userData: propUserData, userId, onEdit }: ProfileTabProps) {
    const [userData, setUserData] = useState(propUserData || null);
    const [loading, setLoading] = useState(!!userId);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        email: '',
        division: '',
        subdivision: '',
    });

    // Состояния для редактирования ролей
    const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);

    useEffect(() => {
        if (userId) {
            usersApi.getUser(userId)
                .then(res => {
                    setUserData(res.data);
                    setEditForm({
                        email: res.data.email || '',
                        division: res.data.division_info?.name || '',
                        subdivision: res.data.division_info?.subdivision?.name || '',
                    });
                })
                .catch(err => console.error('Error loading user:', err))
                .finally(() => setLoading(false));
        } else if (propUserData) {
            setUserData(propUserData);
            setEditForm({
                email: propUserData.email || '',
                division: propUserData.division_info?.name || '',
                subdivision: propUserData.division_info?.subdivision?.name || '',
            });
            setLoading(false);
        }
    }, [userId, propUserData]);

    // Загрузка доступных ролей при входе в режим редактирования (только для другого пользователя)
    useEffect(() => {
        if (isEditing && userId) {
            setLoadingRoles(true);
            usersApi.getAvailableRoles()
                .then(res => {
                    // Сортируем роли согласно порядку из конфига
                    const sorted = [...res.data].sort((a, b) => {
                        const indexA = ROLE_ORDER.indexOf(a.role_id);
                        const indexB = ROLE_ORDER.indexOf(b.role_id);
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });
                    setAvailableRoles(sorted);
                })
                .catch(err => console.error('Ошибка загрузки ролей:', err))
                .finally(() => setLoadingRoles(false));
        } else {
            setAvailableRoles([]);
            setSelectedRoleIds([]);
        }
    }, [isEditing, userId]);

    // Инициализация выбранных ролей из userData.roles при загрузке availableRoles
    useEffect(() => {
        if (availableRoles.length > 0 && userData?.roles) {
            const roleIds = availableRoles
                .filter(role => userData.roles.includes(role.role_id))
                .map(role => role.id);
            setSelectedRoleIds(roleIds);
        }
    }, [availableRoles, userData]);

    const handleSaveChanges = async () => {
        try {
            const updateData: any = { email: editForm.email };
            if (selectedRoleIds.length > 0) {
                updateData.groups = selectedRoleIds;
            }
            if (userId) {
                await usersApi.updateUser(userId, updateData);
                // Перезагружаем данные пользователя
                const res = await usersApi.getUser(userId);
                setUserData(res.data);
            } else if (userData) {
                // Для текущего пользователя сохраняем только email в localStorage
                const updatedUser = { ...userData, email: editForm.email };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUserData(updatedUser);
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
            'ShaWorkerDetails': 'Детали Шаработников',
            'ShaEquipmentConclusion': 'Заключения на технику',
            'NetworkMembership': 'Принадлежность к сетям',
            'NetworkDirection': 'Направления сетей',
            'VLAN': 'VLAN',
            'NetworkInterface': 'Сетевые интерфейсы',
            'VLANConfiguration': 'Конфигурация VLAN',
            'IPAddress': 'IP-адреса',
            'RoutingTable': 'Таблицы маршрутизации',
            'ACL': 'ACL',
            'IPRange': 'Диапазоны IP',
            'TaskStep': 'Этапы задач',
            'FSBOffice': 'Территориальные органы ФСБ',
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
        };
        return moduleNames[module] || module;
    };

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'equipment': return <Server className="module-icon" />;
            case 'networks': return <Network className="module-icon" />;
            case 'divisions': return <Building className="module-icon" />;
            case 'tasks': return <Target className="module-icon" />;
            case 'employees':
            case 'users': return <Users className="module-icon" />;
            case 'storage': return <Folder className="module-icon" />;
            case 'maps': return <MapPin className="module-icon" />;
            case 'organs': return <Briefcase className="module-icon" />;
            default: return <Settings className="module-icon" />;
        }
    };

    // Фильтруем модули: оставляем только основные
    const filteredModules = (userData?.permissions?.modules || [])
        .filter((module: string) => MAIN_MODULES.includes(module));

    // Получить список моделей для выбранного модуля
    const getModelsForModule = (moduleKey: string): string[] => {
        const sections = MODULE_SECTIONS[moduleKey] || [];
        return sections.flatMap(section => section.models);
    };

    // Фильтровать модели по выбранному модулю
    const getFilteredModels = () => {
        if (!selectedModule || !userData?.permissions?.models) {
            return userData?.permissions?.models || {};
        }
        const allowedModels = getModelsForModule(selectedModule);
        const filtered: Record<string, any> = {};
        Object.entries(userData.permissions.models).forEach(([model, actions]) => {
            if (allowedModels.includes(model)) {
                filtered[model] = actions;
            }
        });
        return filtered;
    };

    // Группировка моделей по модулям для отображения всех разрешений
    const groupedByModule = useMemo(() => {
        if (!userData?.permissions?.models) return {};
        const models = userData.permissions.models;
        const grouped: Record<string, Record<string, any>> = {};
        Object.entries(models).forEach(([model, actions]) => {
            const module = MODEL_TO_MODULE[model];
            if (module) {
                if (!grouped[module]) grouped[module] = {};
                grouped[module][model] = actions;
            } else {
                if (!grouped['other']) grouped['other'] = {};
                grouped['other'][model] = actions;
            }
        });
        return grouped;
    }, [userData]);

    const handleModuleClick = (module: string) => {
        setSelectedModule(selectedModule === module ? null : module);
    };

    const handleRoleChange = (roleId: number) => {
        // Если эта роль уже выбрана – снимаем выбор, иначе выбираем её одну
        setSelectedRoleIds(prev => prev.includes(roleId) ? [] : [roleId]);
    };

    if (loading) return <div className="loading">Загрузка профиля...</div>;
    if (!userData) return <div className="error">Нет данных</div>;

    const rolesDisplay = userData?.permissions?.roles?.map((r: any) => r.name).join(', ') ||
        userData?.roles?.map((r: string) => getRoleDisplayName(r)).join(', ') ||
        'Роли не назначены';

    return (
        <>
            <UserInfoCard
                username={userData.username}
                rolesDisplay={rolesDisplay}
                onEdit={() => setIsEditing(true)}
                showEditButton={!!onEdit && !isEditing}
            />

            <div className="profile-grid-container">
                <div className="profile-grid">
                    {/* Левая колонка: основная информация + редактор ролей */}
                    <div className="profile-left-column">
                        <div className="cabinet-form-section">
                            <div className="form-section-header">
                                <h4 className="form-section-title">Основная информация</h4>
                                {isEditing && (
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
                                        <button onClick={handleSaveChanges} className="form-save-btn">
                                            <Check className="w-4 h-4" />
                                            Сохранить
                                        </button>
                                    </div>
                                )}
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
                                            <div className="form-value">{userData?.division_info?.name || 'Не назначено'}</div>
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
                                            <div className="form-value">{userData?.division_info?.subdivision?.name || 'Не назначено'}</div>
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
                                            <div className="form-value">{formatDate(userData?.date_joined)}</div>
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
                                                <div className="form-value">{userData?.email || 'Не указан'}</div>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Редактор ролей под основной информацией */}
                        {isEditing && userId && (
                            <RoleEditor
                                availableRoles={availableRoles}
                                selectedRoleIds={selectedRoleIds}
                                loading={loadingRoles}
                                onChange={handleRoleChange}
                            />
                        )}
                    </div>

                    {/* Средняя колонка: модули (без редактора ролей) */}
                    <div className="profile-middle-column">
                        <PermissionsModules
                            modules={filteredModules}
                            selectedModule={selectedModule}
                            onModuleClick={handleModuleClick}
                            getModuleDisplayName={getModuleDisplayName}
                            getModuleIcon={getModuleIcon}
                        />
                    </div>

                    {/* Правая колонка: детальные разрешения */}
                    <PermissionsDetails
                        groupedModels={groupedByModule}
                        selectedModule={selectedModule}
                        filteredModels={getFilteredModels()}
                        moduleSections={MODULE_SECTIONS}
                        getModuleDisplayName={getModuleDisplayName}
                        getModelDisplayName={getModelDisplayName}
                        getActionDisplayName={getActionDisplayName}
                        getActionIcon={getActionIcon}
                    />
                </div>
            </div>
        </>
    );
}