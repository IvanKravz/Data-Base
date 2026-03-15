import React from 'react';
import { Users } from 'lucide-react';
import { AvailableRole } from '../../../../api/users';

interface RoleEditorProps {
    availableRoles: AvailableRole[];
    selectedRoleIds: number[]; // теперь будет массив с 0 или 1 элементом
    loading: boolean;
    onChange: (roleId: number) => void; // теперь передаём только id
}

export const RoleEditor: React.FC<RoleEditorProps> = ({
    availableRoles,
    selectedRoleIds,
    loading,
    onChange,
}) => {
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
                    {availableRoles.map(role => (
                        <label key={role.id} className="role-checkbox">
                            <input
                                type="radio"
                                name="role" // группируем радио-кнопки
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
            )}
        </div>
    );
};