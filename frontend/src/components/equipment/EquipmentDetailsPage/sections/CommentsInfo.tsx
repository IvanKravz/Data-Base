import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Equipment } from '../../../../types';
import '../style.css';

interface CommentsInfoProps {
  equipment: Equipment;
}



export function CommentsInfo({ equipment }: CommentsInfoProps) {
  // Разделяем комментарии по переносам строк
  const splitComments = (comments: string | null) => {
    if (!comments) return [];
    return comments.split('\n').filter(comment => comment.trim() !== '');
  };

  const mainComments = splitComments(equipment.comments);
  const disposalComments = equipment.status === 'disposed'
    ? splitComments(equipment.disposal_comments)
    : [];

  return (
    <div className="equipment-card">
      <h2 className="equipment-card__title">Комментарии</h2>
      <div className="equipment-card-content">
        <div className="equipment-info-grid">
          <div className="equipment-info-item">
            <div className="equipment-info-item__content">
              {mainComments.length > 0 || disposalComments.length > 0 ? (
                <div className="comments-content">
                  {/* Основные комментарии */}
                  {mainComments.length > 0 && (
                    <div className="comments-section">
                      {mainComments.map((comment, index) => (
                        <div key={`main-${index}`} className="comment-line">
                          <span>{index + 1})</span>
                          <p className="comments-text">{comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {disposalComments.length > 0 && (
                    <div className="disposal-comments">
                      <h4 className="comments-subtitle">Комментарии к списанию:</h4>
                      {disposalComments.map((comment, index) => (
                        <div key={`disposal-${index}`} className="comment-line">
                          <span>{index + 1})</span>
                          <p className="comments-text">{comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="comments-empty">Нет комментариев</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}