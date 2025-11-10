import React from 'react';
import { Building2, MessageSquare } from 'lucide-react';
import '.././style.css';

interface CommentsCardProps {
  description: string;
  onChange: (description: string) => void;
}

export function CommentsCard({ description, onChange }: CommentsCardProps) {
  const comments = description ? description.split('\n') : [''];

  const handleCommentChange = (index: number, value: string) => {
    const newComments = [...comments];
    newComments[index] = value;
    onChange(newComments.filter(c => c.trim() !== '').join('\n'));
  };

  const handleAddComment = () => {
    onChange([...comments, ''].join('\n'));
  };

  const handleRemoveComment = (index: number) => {
    const newComments = comments.filter((_, i) => i !== index);
    onChange(newComments.join('\n'));
  };

  return (
    <div className="personnel-card comments-card">
      <div className="personnel-card-header-edit">
        <Building2 size={20} />
        <h3 className="personnel-card-title">Комментарии и заметки</h3>
      </div>
      <div className="personnel-card-content">
        {comments.map((comment, index) => (
          <div key={index} className="personnel-comment-group">
            <textarea
              value={comment}
              onChange={(e) => handleCommentChange(index, e.target.value)}
              className="personnel-form-input personnel-form-textarea"
              placeholder="Введите комментарий..."
            />
            {comments.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveComment(index)}
                className="personnel-btn personnel-btn-danger personnel-btn-sm"
              >
                Удалить
              </button>
            )}
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={handleAddComment}
            className="personnel-btn personnel-btn-primary personnel-btn-sm"
          >
            + Добавить комментарий
          </button>
        </div>
      </div>
    </div>
  );
}