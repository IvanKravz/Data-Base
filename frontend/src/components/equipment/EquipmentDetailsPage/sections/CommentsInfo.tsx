// CommentsInfo.tsx
import React from 'react';
import { Equipment } from '../../../../types';
import { Section } from './Section';

export function CommentsInfo({ equipment }: { equipment: Equipment }) {
  const splitComments = (comments: string | null) => {
    if (!comments) return [];
    return comments.split('\n').filter(c => c.trim() !== '');
  };

  const mainComments = splitComments(equipment.comments);
  const disposalComments = equipment.status === 'disposed' ? splitComments(equipment.disposal_comments) : [];

  if (mainComments.length === 0 && disposalComments.length === 0) {
    return (
      <Section title="Комментарии">
        <p className="comments-empty">Нет комментариев</p>
      </Section>
    );
  }

  return (
    <Section title="Комментарии">
      <div className="comments-content">
        {mainComments.length > 0 && (
          <div className="comments-section">
            {mainComments.map((comment, idx) => (
              <div key={`main-${idx}`} className="comment-line">
                <span>{idx + 1})</span>
                <p className="comments-text">{comment}</p>
              </div>
            ))}
          </div>
        )}
        {disposalComments.length > 0 && (
          <div className="disposal-comments">
            <h4 className="comments-subtitle">Комментарии к списанию:</h4>
            {disposalComments.map((comment, idx) => (
              <div key={`disposal-${idx}`} className="comment-line">
                <span>{idx + 1})</span>
                <p className="comments-text">{comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}