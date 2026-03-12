import React from 'react';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usersApi, User } from '../../../../api/users';
import '../styles/UserTable.css';

interface UserTableProps {
    users: User[];
    loading: boolean;
    onView: (id: number) => void;
    onEdit: (user: User) => void;
    onDelete: (id: number) => void;
    pagination: { page: number; total: number; pageSize: number };
    onPageChange: (page: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
    users,
    loading,
    onView,
    onEdit,
    onDelete,
    pagination,
    onPageChange,
}) => {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);

    const getRoleDisplay = (roles: string[]) => {
        if (!roles.length) return '—';
        const roleMap: Record<string, string> = {
            admin: 'Админ',
            leader: 'Руководитель',
            user: 'Пользователь',
            // ... другие роли
        };
        return roles.map(r => roleMap[r] || r).join(', ');
    };

    return (
        <div className="user-table-container">
            {loading ? (
                <div className="loading">Загрузка...</div>
            ) : (
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя пользователя</th>
                            <th>Email</th>
                            <th>Роли</th>
                            <th>Подразделение</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} onClick={() => onView(user.id)} className="clickable-row">
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td>{user.email || '—'}</td>
                                <td>{getRoleDisplay(user.roles)}</td>
                                <td>{user.division_info?.name || '—'}</td>
                                <td>
                                    <span className={`status-badge ${user.is_online ? 'online' : 'offline'}`}>
                                        {user.is_online ? 'Онлайн' : 'Офлайн'}
                                    </span>
                                </td>
                                <td onClick={e => e.stopPropagation()}>
                                    <button onClick={() => onEdit(user)} title="Редактировать">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => onDelete(user.id)} title="Удалить">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

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