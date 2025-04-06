import React from 'react';
import { ArrowLeft, Pencil, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '.././style.css'

interface HeaderProps {
  title: string;
  personId?: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function Header({ title, personId, onBack, onEdit, onDelete }: HeaderProps) {
  const navigate = useNavigate();

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
        {personId && (
          <button
            onClick={() => navigate(`/personnel/${personId}/qualitative`)}
            className="action-button action-button-green"
          >
            <FileText className="action-button-icon" />
            <span>Качественная характеристика</span>
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="action-button action-button-blue"
          >
            <Pencil className="action-button-icon" />
            <span>Редактировать</span>
          </button>
        )}
        {onDelete && (
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