import React, { useMemo } from 'react';
import { ArrowLeft, Pencil, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '.././style.css'
import { isExploitationEmployee } from '../../../../api/utils/permissions';

interface HeaderProps {
  title: string;
  personId?: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEditEmployee: boolean;
}

export function Header({ 
  title, 
  personId, 
  onBack, 
  onEdit, 
  onDelete, 
  canEditEmployee,
}: HeaderProps) {
  const navigate = useNavigate();
  
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
      <div className="personnel-header-right">
        {/* ДОБАВЛЯЕМ УСЛОВИЕ ОТОБРАЖЕНИЯ */}
        {personId && !isExploitationUser && (
          <button
            onClick={() => navigate(`/personnel/${personId}/qualitative`)}
            className="action-button action-button-green"
          >
            <FileText className="action-button-icon" />
            <span>Качественная характеристика</span>
          </button>
        )}
        {onEdit && canEditEmployee && (
          <button
            onClick={onEdit}
            className="action-button action-button-blue"
          >
            <Pencil className="action-button-icon" />
            <span>Редактировать</span>
          </button>
        )}
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
    </div>
  );
}