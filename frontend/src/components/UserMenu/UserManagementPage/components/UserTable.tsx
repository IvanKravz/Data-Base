// UserTable.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { User, AvailableRole } from '../../../../api/users';
import '../styles/UserTable.css';

interface UserTableProps {
    users: User[];
    loading: boolean;
    onView: (id: number) => void;
    pagination: { page: number; total: number; pageSize: number };
    onPageChange: (page: number) => void;
    availableRoles: AvailableRole[];
}

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

export const UserTable: React.FC<UserTableProps> = ({
    users,
    loading,
    onView,
    pagination,
    onPageChange,
    availableRoles,
}) => {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const roleMap = useMemo(() => {
        const map = new Map<string, { name: string; description: string }>();
        availableRoles.forEach(role => {
            map.set(role.role_id, { name: role.name, description: role.description });
        });
        return map;
    }, [availableRoles]);

    const getPrimaryRole = (userRoles: string[]): string | null => {
        if (!userRoles || userRoles.length === 0) return null;
        const sorted = [...userRoles].sort((a, b) => {
            const indexA = ROLE_ORDER.indexOf(a);
            const indexB = ROLE_ORDER.indexOf(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        return sorted[0];
    };

    const groupedUsers = useMemo(() => {
        const groups: { roleId: string; roleName: string; users: User[] }[] = [];
        const sortedRoles = [...availableRoles].sort((a, b) => {
            const indexA = ROLE_ORDER.indexOf(a.role_id);
            const indexB = ROLE_ORDER.indexOf(b.role_id);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        sortedRoles.forEach(role => {
            groups.push({ roleId: role.role_id, roleName: role.name, users: [] });
        });
        const noRoleGroup = { roleId: 'no-role', roleName: 'Без роли', users: [] as User[] };
        users.forEach(user => {
            const primaryRole = getPrimaryRole(user.roles);
            if (primaryRole) {
                const group = groups.find(g => g.roleId === primaryRole);
                if (group) group.users.push(user);
                else {
                    const fallbackGroup = groups.find(g => g.roleId === 'other');
                    if (fallbackGroup) fallbackGroup.users.push(user);
                    else {
                        groups.push({ roleId: 'other', roleName: 'Прочие', users: [user] });
                    }
                }
            } else {
                noRoleGroup.users.push(user);
            }
        });
        const filteredGroups = groups.filter(g => g.users.length > 0);
        if (noRoleGroup.users.length > 0) filteredGroups.push(noRoleGroup);
        return filteredGroups;
    }, [users, availableRoles]);

    const toggleGroup = (roleId: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(roleId)) {
                newSet.delete(roleId);
            } else {
                newSet.add(roleId);
            }
            return newSet;
        });
    };

    if (loading) {
        return <div className="loading-state">Загрузка пользователей...</div>;
    }

    if (users.length === 0) {
        return <div className="empty-state">Пользователи не найдены</div>;
    }

    return (
        <div className="user-table-container">
            <table className="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Имя пользователя</th>
                        <th>Email</th>
                        <th>Роли</th>
                        <th>Подразделение</th>
                        <th>Отделение</th>
                        <th>Статус</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedUsers.map(group => (
                        <React.Fragment key={group.roleId}>
                            <tr className="group-header-row" onClick={() => toggleGroup(group.roleId)}>
                                <td colSpan={7}>
                                    <div className="group-header">
                                        {collapsedGroups.has(group.roleId) ? (
                                            <ChevronRightIcon size={18} />
                                        ) : (
                                            <ChevronDown size={18} />
                                        )}
                                        <span className="group-title">{group.roleName}</span>
                                        <span className="group-count">({group.users.length})</span>
                                    </div>
                                </td>
                            </tr>
                            {!collapsedGroups.has(group.roleId) && group.users.map(user => (
                                <tr key={user.id} onClick={() => onView(user.id)} className="clickable-row">
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email || '—'}</td>
                                    <td>
                                        {user.roles.map(roleId => roleMap.get(roleId)?.name || roleId).join(', ')}
                                    </td>
                                    <td>{user.division_info?.name || '—'}</td>
                                    <td>{user.division_info?.subdivision?.name || '—'}</td>
                                    <td>
                                        <span className={`status-badge ${user.is_online ? 'online' : 'offline'}`}>
                                            {user.is_online ? 'Онлайн' : 'Офлайн'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span>{pagination.page} / {totalPages}</span>
                    <button
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page === totalPages}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};