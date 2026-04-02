import React from 'react';
import { Users } from 'lucide-react';
import { AvailableRole } from '../../../../api/users';

interface RoleEditorProps {
    availableRoles: AvailableRole[];
    selectedRoleIds: number[]; // массив с 0 или 1 элементом (радио-кнопка)
    loading: boolean;
    onChange: (roleId: number) => void;
}

// Категории ролей
const ROLE_CATEGORIES: Record<string, { name: string; roles: string[] }> = {
    admin: {
        name: 'Администратор',
        roles: ['admin'],
    },
    leadership: {
        name: 'Руководство',
        roles: ['leader', 'deputy_director'],
    },
    department1: {
        name: '1 отдел',
        roles: [
            'head_of_department_1',
            'head_of_section_1_1',
            'hr_section_1_1',
            'tech_section_1_1',
            'employee_section_1_2',
            'tech_section_1_3',
        ],
    },
    exploitation: {
        name: 'Эксплуатация',
        roles: ['exploitation_chief', 'exploitation_employee'],
    },
};

export const RoleEditor: React.FC<RoleEditorProps> = ({
    availableRoles,
    selectedRoleIds,
    loading,
    onChange,
}) => {
    // Группируем доступные роли по категориям
    const groupedRoles = React.useMemo(() => {
        const groups: Record<string, AvailableRole[]> = {};
        Object.keys(ROLE_CATEGORIES).forEach(cat => {
            groups[cat] = [];
        });
        groups['other'] = []; // для ролей, не попавших в категории

        availableRoles.forEach(role => {
            let assigned = false;
            for (const [catKey, cat] of Object.entries(ROLE_CATEGORIES)) {
                if (cat.roles.includes(role.role_id)) {
                    groups[catKey].push(role);
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                groups['other'].push(role);
            }
        });
        return groups;
    }, [availableRoles]);

    const renderCategory = (title: string, roles: AvailableRole[]) => {
        if (roles.length === 0) return null;
        return (
            <div className="role-category">
                <h5 className="role-category-title">{title}</h5>
                <div className="role-category-items">
                    {roles.map(role => (
                        <label key={role.id} className="role-checkbox">
                            <input
                                type="radio"
                                name="role"
                                checked={selectedRoleIds.includes(role.id)}
                                onChange={() => onChange(role.id)}
                            />
                            <div className="role-text">
                                <span className="role-name">{role.name}</span>
                                <span className="role-description">{role.description}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="cabinet-form-section role-editor-section">
            <div className="form-section-header">
                <h4 className="form-section-title">
                    <Users className="w-5 h-5 mr-2" />
                    Редактирование ролей
                </h4>
            </div>
            {loading ? (
                <div className="role-editor-loading">Загрузка ролей...</div>
            ) : (
                <div className="roles-checkbox-group">
                    {renderCategory('Администратор', groupedRoles.admin)}
                    {renderCategory('Руководство', groupedRoles.leadership)}
                    {renderCategory('1 отдел', groupedRoles.department1)}
                    {renderCategory('Эксплуатация', groupedRoles.exploitation)}
                    {renderCategory('Другие', groupedRoles.other)}
                </div>
            )}
        </div>
    );
};