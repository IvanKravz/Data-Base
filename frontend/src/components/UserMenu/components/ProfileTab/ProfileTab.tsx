// components/ProfileTab/ProfileTab.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    User, Mail, Globe, Calendar, Edit, Check, Shield,
    Eye, PlusCircle, Edit2, Trash2, Users, Building,
    Network, Server, Briefcase, Target, Wrench, Cpu,
    MapPin, Layers, Folder, Settings, Database, Key, Lock
} from 'lucide-react';
import { usersApi, AvailableRole } from '../../../../api/users';
import { divisionsApi } from '../../../../api/divisions';
import { UserInfoCard } from './UserInfoCard';
import { RoleEditor } from './RoleEditor';
import { PermissionsModules } from './PermissionsModules';
import { PermissionsDetails } from './PermissionsDetails';
import { ChangePasswordModal } from './ChangePasswordModal';
import '../../styles/ProfileTab.css';

// --- Интерфейсы ---
interface ProfileTabProps {
    userData?: any;
    userId?: number;
    onEdit?: () => void;
    onDelete?: () => void;
}

interface Division {
    id: number;
    name: string;
}

interface Subdivision {
    id: number;
    name: string;
    division: number;
}

interface ModuleSubsection {
    id: string;
    name: string;
    models: string[];
}

// --- Конфигурация модулей (объединены подсекции) ---
const MODULE_SECTIONS: Record<string, ModuleSubsection[]> = {
    employees: [
        { id: 'employees', name: 'Сотрудники', models: ['Employee', 'ShaWorkerDetails', 'ShaEquipmentConclusion'] },
    ],
    equipment: [
        { id: 'common', name: 'Оборудование', models: ['Equipment', 'EquipmentCategory'] },
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
        { id: 'users', name: 'Пользователи', models: ['User'] },
    ],
    storage: [
        { id: 'storage', name: 'Хранилище', models: ['StorageFolder', 'StorageFile'] },
    ],
    maps: [
        { id: 'offices', name: 'Территориальные органы ФСБ', models: ['FSBOffice'] },
    ],
    organs: [
        { id: 'interest', name: 'Заинтересованные органы', models: ['InterestOrgan'] },
    ],
};

const MAIN_MODULES = Object.keys(MODULE_SECTIONS);

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

const ROLE_ORDER = [
    'admin',
    'leader',
    'deputy_director',
    'head_of_department_1',
    'head_of_section_1_1',
    'head_of_section_2_1', 
    'hr_section_1_1',
    'tech_section_1_1',
    'employee_section_1_2',
    'tech_section_1_3',
    'exploitation_chief',
    'exploitation_employee',
];

// --- Вспомогательные функции (вынесены из компонента) ---
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

// --- Компонент (обёрнут в React.memo) ---
const ProfileTab = React.memo(function ProfileTab({
    userData: propUserData,
    userId,
    onEdit,
    onDelete
}: ProfileTabProps) {
    const [userData, setUserData] = useState(propUserData || null);
    const [loading, setLoading] = useState(!!userId);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
    const [loadingDivisions, setLoadingDivisions] = useState(false);
    const [editForm, setEditForm] = useState({
        email: '',
        user_division_id: null as number | null,
        user_subdivision_id: null as number | null,
    });
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [twoFACode, setTwoFACode] = useState('');
    const [originalTwoFAEnabled, setOriginalTwoFAEnabled] = useState(false);
    const [originalTwoFACode, setOriginalTwoFACode] = useState('');

    const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Флаг, что первоначальная инициализация модуля выполнена
    const [initialized, setInitialized] = useState(false);

    // Загрузка данных пользователя
    useEffect(() => {
        if (userId) {
            usersApi.getUser(userId)
                .then(res => {
                    setUserData(res.data);
                    setEditForm({
                        email: res.data.email || '',
                        user_division_id: res.data.division_info?.id ? Number(res.data.division_info.id) : null,
                        user_subdivision_id: res.data.division_info?.subdivision?.id ? Number(res.data.division_info.subdivision.id) : null,
                    });
                    const enabled = res.data.two_factor_enabled || false;
                    setTwoFAEnabled(enabled);
                    setOriginalTwoFAEnabled(enabled);
                    setTwoFACode('');
                    setOriginalTwoFACode('');
                    setInitialized(false); // разрешаем установку модуля при первой загрузке
                })
                .catch(err => console.error('Error loading user:', err))
                .finally(() => setLoading(false));
        } else if (propUserData) {
            setUserData(propUserData);
            setEditForm({
                email: propUserData.email || '',
                user_division_id: propUserData.division_info?.id ? Number(propUserData.division_info.id) : null,
                user_subdivision_id: propUserData.division_info?.subdivision?.id ? Number(propUserData.division_info.subdivision.id) : null,
            });
            setTwoFAEnabled(propUserData.two_factor_enabled || false);
            setOriginalTwoFAEnabled(propUserData.two_factor_enabled || false);
            setTwoFACode('');
            setOriginalTwoFACode('');
            setLoading(false);
            setInitialized(false);
        }
    }, [userId, propUserData]);

    // Установка первого модуля по умолчанию только при первой загрузке (initialized === false)
    useEffect(() => {
        if (userData?.permissions?.modules && !initialized) {
            const modules = userData.permissions.modules.filter((m: string) => MAIN_MODULES.includes(m));
            if (modules.length > 0) {
                setSelectedModule(modules[0]);
            }
            setInitialized(true);
        }
    }, [userData, initialized]);

    // Загрузка доступных ролей
    useEffect(() => {
        if (isEditing && userId) {
            setLoadingRoles(true);
            usersApi.getAvailableRoles()
                .then(res => {
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

    // Загрузка подразделений
    useEffect(() => {
        if (isEditing && userId) {
            setLoadingDivisions(true);
            divisionsApi.getDivisions()
                .then(data => setDivisions(data))
                .catch(err => console.error('Ошибка загрузки подразделений:', err))
                .finally(() => setLoadingDivisions(false));
        }
    }, [isEditing, userId]);

    useEffect(() => {
        if (editForm.user_division_id) {
            divisionsApi.getSubdivisions(editForm.user_division_id)
                .then(data => setSubdivisions(data))
                .catch(err => console.error('Ошибка загрузки отделений:', err));
        } else {
            setSubdivisions([]);
        }
    }, [editForm.user_division_id]);

    useEffect(() => {
        if (availableRoles.length > 0 && userData?.roles) {
            const roleIds = availableRoles
                .filter(role => userData.roles.includes(role.role_id))
                .map(role => role.id);
            setSelectedRoleIds(roleIds);
        }
    }, [availableRoles, userData]);

    // Мемоизация вычислений разрешений
    const groupedByModule = useMemo(() => {
        if (!userData?.permissions?.models) return {};
        const models = userData.permissions.models;
        const grouped: Record<string, Record<string, any>> = {};
        Object.entries(models).forEach(([model, actions]) => {
            const module = MODEL_TO_MODULE[model] || 'other';
            if (!grouped[module]) grouped[module] = {};
            grouped[module][model] = actions;
        });
        return grouped;
    }, [userData]);

    const filteredModules = useMemo(() => {
        return (userData?.permissions?.modules || [])
            .filter((module: string) => MAIN_MODULES.includes(module));
    }, [userData]);

    const handleSaveChanges = async () => {
        try {
            const updateData: any = {
                email: editForm.email,
                user_division_id: editForm.user_division_id,
                user_subdivision_id: editForm.user_subdivision_id,
            };
            if (selectedRoleIds.length > 0) {
                updateData.groups = selectedRoleIds;
            }
            if (userId) {
                await usersApi.updateUser(userId, updateData);
                if (twoFAEnabled && twoFACode && twoFACode.length === 4 && /^\d+$/.test(twoFACode)) {
                    await usersApi.set2FA(userId, twoFACode);
                } else if (!twoFAEnabled && originalTwoFAEnabled) {
                    await usersApi.disable2FA(userId);
                } else if (twoFAEnabled && twoFACode !== originalTwoFACode && twoFACode.length === 4) {
                    await usersApi.disable2FA(userId);
                    await usersApi.set2FA(userId, twoFACode);
                }
                const res = await usersApi.getUser(userId);
                setUserData(res.data);
                setOriginalTwoFAEnabled(res.data.two_factor_enabled || false);
                setTwoFAEnabled(res.data.two_factor_enabled || false);
                setTwoFACode('');
                setOriginalTwoFACode('');
            } else if (userData) {
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

    const handleModuleClick = (module: string) => {
        setSelectedModule(selectedModule === module ? null : module);
    };

    const handleRoleChange = (roleId: number) => {
        setSelectedRoleIds(prev => prev.includes(roleId) ? [] : [roleId]);
    };

    const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        setEditForm(prev => ({
            ...prev,
            user_division_id: value,
            user_subdivision_id: null,
        }));
    };

    const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        setEditForm(prev => ({ ...prev, user_subdivision_id: value }));
    };

    const handleTwoFAEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = e.target.checked;
        setTwoFAEnabled(enabled);
        if (!enabled) {
            setTwoFACode('');
        }
    };

    const handleTwoFACodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 4);
        setTwoFACode(value);
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
                onDelete={onDelete}
                onPasswordChange={() => setIsPasswordModalOpen(true)}
                showEditButton={!!onEdit && !isEditing}
                showDeleteButton={!!onDelete && !isEditing}
                showPasswordButton={!!userId}
                twoFAEnabled={twoFAEnabled}
            />

            {isPasswordModalOpen && (
                <ChangePasswordModal
                    userId={userId}
                    username={userData.username}
                    onClose={() => setIsPasswordModalOpen(false)}
                    onSuccess={() => console.log('Пароль успешно изменён')}
                />
            )}

            <div className="profile-grid-container">
                <div className="profile-grid">
                    <div className="profile-left">
                        {/* Блок основной информации */}
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
                                                    user_division_id: userData?.division_info?.id ? Number(userData.division_info.id) : null,
                                                    user_subdivision_id: userData?.division_info?.subdivision?.id ? Number(userData.division_info.subdivision.id) : null,
                                                });
                                                setTwoFAEnabled(originalTwoFAEnabled);
                                                setTwoFACode('');
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
                                            {isEditing && userId ? (
                                                <select
                                                    value={editForm.user_division_id || ''}
                                                    onChange={handleDivisionChange}
                                                    disabled={loadingDivisions}
                                                    className="form-select-user"
                                                >
                                                    <option value="">Не выбрано</option>
                                                    {divisions.map(div => (
                                                        <option key={div.id} value={div.id}>{div.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="form-value">
                                                    {userData?.division_info?.name || 'Не назначено'}
                                                </div>
                                            )}
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
                                            {isEditing && userId ? (
                                                <select
                                                    value={editForm.user_subdivision_id || ''}
                                                    onChange={handleSubdivisionChange}
                                                    disabled={!editForm.user_division_id || subdivisions.length === 0}
                                                    className="form-select-user"
                                                >
                                                    <option value="">Не выбрано</option>
                                                    {subdivisions.map(sub => (
                                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="form-value">
                                                    {userData?.division_info?.subdivision?.name || 'Не назначено'}
                                                </div>
                                            )}
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
                                    {isEditing && userId && (
                                        <tr className="info-table-row">
                                            <td className="info-table-label">
                                                <label className="form-label-user">
                                                    <Lock className="form-label-icon" />
                                                    <span>Двухфакторная аутентификация</span>
                                                </label>
                                            </td>
                                            <td className="info-table-value">
                                                <div className="twofa-edit-container">
                                                    <label className="twofa-checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={twoFAEnabled}
                                                            onChange={handleTwoFAEnabledChange}
                                                        />
                                                        <span>Включить 2FA</span>
                                                    </label>
                                                    {twoFAEnabled && (
                                                        <div className="twofa-code-input">
                                                            <input
                                                                type="text"
                                                                value={twoFACode}
                                                                onChange={handleTwoFACodeChange}
                                                                placeholder="4 цифры"
                                                                maxLength={4}
                                                                pattern="\d*"
                                                                className="form-input"
                                                                style={{ width: '100px', textAlign: 'center' }}
                                                            />
                                                            <small className="twofa-hint">Установите 4-значный код (только цифры)</small>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Блок доступных модулей */}
                        <PermissionsModules
                            modules={filteredModules}
                            selectedModule={selectedModule}
                            onModuleClick={handleModuleClick}
                            getModuleDisplayName={getModuleDisplayName}
                            getModuleIcon={getModuleIcon}
                        />

                        {/* Блок редактирования ролей */}
                        {isEditing && userId && (
                            <RoleEditor
                                availableRoles={availableRoles}
                                selectedRoleIds={selectedRoleIds}
                                loading={loadingRoles}
                                onChange={handleRoleChange}
                            />
                        )}
                    </div>

                    {/* Правая колонка – детальные разрешения */}
                    <div className="profile-permissions">
                        <PermissionsDetails
                            groupedModels={groupedByModule}
                            selectedModule={selectedModule}
                            moduleSections={MODULE_SECTIONS}
                            getModuleDisplayName={getModuleDisplayName}
                            getModelDisplayName={getModelDisplayName}
                            getActionDisplayName={getActionDisplayName}
                            getActionIcon={getActionIcon}
                        />
                    </div>
                </div>
            </div>
        </>
    );
});

// Экспорт по умолчанию (React.memo-обёрнутый компонент)
export default ProfileTab;