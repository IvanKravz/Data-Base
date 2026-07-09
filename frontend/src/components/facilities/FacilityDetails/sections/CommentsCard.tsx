// CommentsCard.tsx
import React, { useMemo } from 'react';
import { Facility } from '../../../../types';
import { Section } from './Section';

interface CommentsCardProps {
  facility: Facility;
  searchTerm?: string;
}

export function CommentsCard({ facility, searchTerm = '' }: CommentsCardProps) {
  const comments = facility.comments ? facility.comments.split('\n').filter(c => c.trim() !== '') : [];

  const filteredComments = useMemo(() => {
    if (!searchTerm.trim()) return comments;
    const lower = searchTerm.toLowerCase().trim();
    return comments.filter(c => c.toLowerCase().includes(lower));
  }, [comments, searchTerm]);

  if (filteredComments.length === 0) {
    return (
      <Section title="Комментарии">
        <p className="facility-details-comments-empty">Нет комментариев</p>
      </Section>
    );
  }

  return (
    <Section title="Комментарии">
      <div className="facility-details-comments-container">
        {filteredComments.map((comment, idx) => (
          <div key={idx} className="facility-details-comment-line">
            <span className="facility-details-comment-number">{idx + 1})</span>
            <p className="facility-details-comment-text">{comment}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}