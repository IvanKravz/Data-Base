import React from 'react';
import { EquipmentFieldPermissions } from '../../../../../types';
import '../style.css';

interface EditCommentsCardProps {
  comments: string | null;
  onChange: (value: string) => void;
  permissions: EquipmentFieldPermissions;
}

export function EditCommentsCard({ comments, onChange, permissions }: EditCommentsCardProps) {
  // Функция для разделения комментариев по строкам
  const splitComments = (commentsText: string | null) => {
    if (!commentsText) return [];
    return commentsText.split('\n').filter(comment => comment.trim() !== '');
  };

  // Обработчик изменения текста
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!permissions.canEditComments) return;
    onChange(e.target.value);
  };

  // Получаем массив комментариев
  const commentsArray = splitComments(comments);

  return (
    <div className="equipment-card-edit">
      <div className="equipment-card-header">
        <h3 className="equipment-card-title">Комментарии</h3>
      </div>
      <div className="equipment-card-content-edit">
        {/* Превью комментариев с нумерацией */}
        {commentsArray.length > 0 && (
          <div className="comments-preview">
            {commentsArray.map((comment, index) => (
              <div key={index} className="comment-line">
                <span className="comment-number">{index + 1})</span>
                <span className="comment-text">{comment}</span>
              </div>
            ))}
          </div>
        )}

        {/* Текстовое поле для редактирования */}
        <textarea
          value={comments || ''}
          onChange={handleTextChange}
          className="form-input-edit form-textarea"
          rows={4}
          placeholder="Добавьте комментарии к технике..."
          disabled={!permissions.canEditComments}
        />
      </div>
    </div>
  );
}