// sections/CommentsInfo.tsx
import React, { useMemo } from 'react';
import { Equipment } from '../../../../types';
import { Section } from './Section';

interface CommentsInfoProps {
  equipment: Equipment;
  searchTerm?: string;
}

export function CommentsInfo({ equipment, searchTerm = '' }: CommentsInfoProps) {
  const splitComments = (comments: string | null) => {
    if (!comments) return [];
    return comments.split('\n').filter(c => c.trim() !== '');
  };

  const mainComments = splitComments(equipment.comments);
  const disposalComments = equipment.status === 'disposed' ? splitComments(equipment.disposal_comments) : [];

  const filteredMain = useMemo(() => {
    if (!searchTerm.trim()) return mainComments;
    const lower = searchTerm.toLowerCase().trim();
    return mainComments.filter(c => c.toLowerCase().includes(lower));
  }, [mainComments, searchTerm]);

  const filteredDisposal = useMemo(() => {
    if (!searchTerm.trim()) return disposalComments;
    const lower = searchTerm.toLowerCase().trim();
    return disposalComments.filter(c => c.toLowerCase().includes(lower));
  }, [disposalComments, searchTerm]);

  if (filteredMain.length === 0 && filteredDisposal.length === 0) {
    return (
      <Section title="Комментарии">
        <p className="comments-empty">Нет комментариев</p>
      </Section>
    );
  }

  return (
    <Section title="Комментарии">
      <div className="comments-content">
        {filteredMain.length > 0 && (
          <div className="comments-section">
            {filteredMain.map((comment, idx) => (
              <div key={`main-${idx}`} className="comment-line">
                <span>{idx + 1})</span>
                <p className="comments-text">{comment}</p>
              </div>
            ))}
          </div>
        )}
        {filteredDisposal.length > 0 && (
          <div className="disposal-comments">
            <h4 className="comments-subtitle">Комментарии к списанию:</h4>
            {filteredDisposal.map((comment, idx) => (
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