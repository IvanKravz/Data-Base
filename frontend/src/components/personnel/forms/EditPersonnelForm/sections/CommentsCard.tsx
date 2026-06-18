import React from 'react';
import { MessageSquare } from 'lucide-react';
import '../style.css';

interface CommentsCardProps {
  description: string;
  onChange: (description: string) => void;
  readOnly?: boolean;
}

export function CommentsCard({ description, onChange, readOnly = false }: CommentsCardProps) {
  const comments = description ? description.split('\n') : [''];

  const handleCommentChange = (index: number, value: string) => {
    if (readOnly) return;
    const newComments = [...comments];
    newComments[index] = value;
    onChange(newComments.filter(c => c.trim() !== '').join('\n'));
  };

  const handleAddComment = () => {
    if (readOnly) return;
    onChange([...comments, ''].join('\n'));
  };

  const handleRemoveComment = (index: number) => {
    if (readOnly) return;
    const newComments = comments.filter((_, i) => i !== index);
    onChange(newComments.join('\n'));
  };

  return (
    <div className="ep-card ep-comments-card">
      <div className="ep-card-header">
        <MessageSquare size={20} />
        <h3 className="ep-card-title">Комментарии и заметки</h3>
      </div>
      <div className="ep-card-content">
        {comments.map((comment, index) => (
          <div key={index} className="ep-comment-group">
            <textarea
              value={comment}
              onChange={(e) => handleCommentChange(index, e.target.value)}
              className="ep-form-input ep-form-textarea"
              placeholder="Введите комментарий..."
              disabled={readOnly}
            />
            {comments.length > 1 && !readOnly && (
              <button
                type="button"
                onClick={() => handleRemoveComment(index)}
                className="ep-btn ep-btn-danger ep-btn-sm"
              >
                Удалить
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <div>
            <button
              type="button"
              onClick={handleAddComment}
              className="ep-btn ep-btn-primary ep-btn-sm"
            >
              + Добавить комментарий
            </button>
          </div>
        )}
      </div>
    </div>
  );
}