// Header.tsx
import React, { useMemo } from 'react';
import { ArrowLeft, Pencil, Trash2, FileText } from 'lucide-react';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';
import '.././style.css'
import { isExploitationEmployee } from '../../../../api/utils/permissions';

interface HeaderProps {
  title: string;
  personId?: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onQualitative?: () => void;
  canEditEmployee: boolean;
  canDeleteEmployee: boolean;
  isEditing: boolean;
}

export function Header({
  title,
  personId,
  onBack,
  onEdit,
  onDelete,
  onQualitative,
  canEditEmployee,
  canDeleteEmployee,
  isEditing
}: HeaderProps) {
  const { personnelFilters, isEditorShaWorker } = useAppPermissions();
  const isExploitationUser = useMemo(() => isExploitationEmployee(), []);

  const hasEmployeeFilters = useMemo(() => {
    return personnelFilters && Object.keys(personnelFilters).length > 0;
  }, [personnelFilters]);

  // Качественная характеристика – только для полного доступа
  const canAccessQualitative = useMemo(() => {
    return canEditEmployee && !hasEmployeeFilters && !isExploitationUser && !isEditorShaWorker;
  }, [canEditEmployee, hasEmployeeFilters, isExploitationUser, isEditorShaWorker]);

  // Удаление – только для полного доступа
  const canDelete = useMemo(() => {
    return canDeleteEmployee && !hasEmployeeFilters && !isEditorShaWorker;
  }, [canDeleteEmployee, hasEmployeeFilters, isEditorShaWorker]);

  // Редактирование – доступно всем, у кого есть право change (даже для редактора ШаРаботников)
  const canEdit = canEditEmployee;

  return (
    <div className="personnel-header">
      <div className="personnel-header-left">
        <button onClick={onBack} className="icon-button">
          <ArrowLeft className="button-back" />
        </button>
        <h1 className="personnel-header-title">{title}</h1>
      </div>

      {!isEditing && (
        <div className="personnel-header-right">
          {personId && canAccessQualitative && onQualitative && (
            <button onClick={onQualitative} className="action-button action-button-green">
              <FileText className="action-button-icon" />
              <span>Качественная характеристика</span>
            </button>
          )}
          {onEdit && canEdit && (
            <button onClick={onEdit} className="action-button action-button-blue">
              <Pencil className="action-button-icon" />
              <span>Редактировать</span>
            </button>
          )}
          {onDelete && canDelete && (
            <button onClick={onDelete} className="action-button action-button-red">
              <Trash2 className="action-button-icon" />
              <span>Удалить</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}