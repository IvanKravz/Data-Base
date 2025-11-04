import React, { useMemo } from 'react';
import { ArrowLeft, Pencil, Trash2, FileText } from 'lucide-react';
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
  isEditing
}: HeaderProps) {
  // Проверяем, является ли пользователь сотрудником эксплуатации
  const isExploitationUser = useMemo(() => isExploitationEmployee(), []);

  return (
    <div className="personnel-header">
      <div className="personnel-header-left">
        <button
          onClick={onBack}
          className="icon-button"
        >
          <ArrowLeft className="button-back" />
        </button>
        <h1 className="personnel-header-title">
          {title}
        </h1>
      </div>
      
      {!isEditing && (
        <div className="personnel-header-right">
          {/* Кнопка "Качественная характеристика" */}
          {personId && !isExploitationUser && onQualitative && (
            <button
              onClick={onQualitative}
              className="action-button action-button-green"
            >
              <FileText className="action-button-icon" />
              <span>Качественная характеристика</span>
            </button>
          )}
          
          {/* Кнопка "Редактировать" */}
          {onEdit && canEditEmployee && (
            <button
              onClick={onEdit}
              className="action-button action-button-blue"
            >
              <Pencil className="action-button-icon" />
              <span>Редактировать</span>
            </button>
          )}
          
          {/* Кнопка "Удалить" */}
          {onDelete && canEditEmployee && (
            <button
              onClick={onDelete}
              className="action-button action-button-red"
            >
              <Trash2 className="action-button-icon" />
              <span>Удалить</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}