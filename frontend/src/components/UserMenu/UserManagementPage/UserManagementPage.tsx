// UserManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Filter } from 'lucide-react';
import { UserTable } from './components/UserTable';
import { UserDetailsModal } from './components/UserDetailsModal';
import { UserFormModal } from './components/UserFormModal';
import './styles/UserManagementPage.css';
import { usersApi, User, AvailableRole } from '../../../api/users';
import { SearchBar } from '../../../components/common/SearchBar';
import { useDebounce } from './hooks/useDebounce';

export const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [filters, setFilters] = useState({ search: '', role: '' });
    const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: 20 });
    const debouncedSearch = useDebounce(filters.search, 300);

    // Список доступных ролей для группировки и отображения
    const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);

    // Загрузка списка ролей при монтировании
    useEffect(() => {
        const loadRoles = async () => {
            setRolesLoading(true);
            try {
                const response = await usersApi.getAvailableRoles();
                setAvailableRoles(response.data);
            } catch (error) {
                console.error('Failed to load roles', error);
            } finally {
                setRolesLoading(false);
            }
        };
        loadRoles();
    }, []);

    useEffect(() => {
        // Сброс страницы при изменении фильтров
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [debouncedSearch, filters.role]);

    useEffect(() => {
        loadUsers();
    }, [debouncedSearch, filters.role, pagination.page]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                page_size: pagination.pageSize,
                search: debouncedSearch,
                role: filters.role,
            };
            const response = await usersApi.getUsers(params);
            setUsers(response.data.results || response.data);
            setPagination(prev => ({ ...prev, total: response.data.count || 0 }));
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewUser = (userId: number) => {
        setSelectedUserId(userId);
        setIsDetailsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsFormModalOpen(true);
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
        try {
            await usersApi.deleteUser(userId);
            loadUsers();
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleCreateUser = () => {
        setEditingUser(null);
        setIsFormModalOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormModalOpen(false);
        loadUsers();
    };

    return (
        <div className="user-management-page">
            <div className="page-header">
                <h1>Управление пользователями</h1>
                <button className="btn-primary" onClick={handleCreateUser}>
                    <UserPlus size={18} />
                    Создать пользователя
                </button>
            </div>

            <div className="filters-bar">
                <SearchBar
                    searchTerm={filters.search}
                    setSearchTerm={(value) => setFilters({ ...filters, search: value })}
                    placeholder="Поиск по имени или email"
                />
                {/* можно добавить фильтр по ролям */}
            </div>

            <UserTable
                users={users}
                loading={loading || rolesLoading}
                onView={handleViewUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                pagination={pagination}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                availableRoles={availableRoles} // передаём список ролей
            />

            {isDetailsModalOpen && selectedUserId && (
                <UserDetailsModal
                    userId={selectedUserId}
                    onClose={() => setIsDetailsModalOpen(false)}
                    onEdit={() => {
                        setIsDetailsModalOpen(false);
                        const user = users.find(u => u.id === selectedUserId);
                        if (user) handleEditUser(user);
                    }}
                    onDelete={() => {
                        if (selectedUserId) {
                            handleDeleteUser(selectedUserId);
                            setIsDetailsModalOpen(false);
                        }
                    }}
                />
            )}

            {isFormModalOpen && (
                <UserFormModal
                    key={editingUser ? editingUser.id : 'create'}
                    user={editingUser}
                    onClose={() => setIsFormModalOpen(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};