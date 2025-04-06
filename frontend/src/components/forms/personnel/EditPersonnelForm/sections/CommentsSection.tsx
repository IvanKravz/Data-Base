import React from 'react';
import { MessageSquare } from 'lucide-react';
import '.././style.css';

interface CommentsSectionProps {
  description: string;
  onChange: (description: string) => void;
}

export function CommentsSection({ description, onChange }: CommentsSectionProps) {
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
    <div className="space-y-4">
      {comments.map((comment, index) => (
        <div key={index} className="flex items-start gap-2">
          <textarea
            value={comment}
            onChange={(e) => handleCommentChange(index, e.target.value)}
            className="form-input form-textarea"
            placeholder="Введите комментарий..."
          />
          {comments.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveComment(index)}
              className="btn btn-danger"
            >
              Удалить
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddComment}
        className="btn btn-primary"
      >
        + Добавить комментарий
      </button>
    </div>
  );
}