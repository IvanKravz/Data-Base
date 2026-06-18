import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { Employee } from '../../../../types';
import { InfoCard } from './InfoCard';
import '../PersonnelDetails.css';

interface CommentsInfoProps {
  person: Employee;
  searchTerm?: string;
}

export function CommentsInfo({ person, searchTerm = '' }: CommentsInfoProps) {
  const comments = person.description ? person.description.split('\n').filter(c => c.trim() !== '') : [];

  const filteredComments = useMemo(() => {
    if (!searchTerm.trim()) return comments;
    const lower = searchTerm.toLowerCase().trim();
    return comments.filter(c => c.toLowerCase().includes(lower));
  }, [comments, searchTerm]);

  return (
    <InfoCard title="Примечания">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredComments.length > 0 ? (
          filteredComments.map((comment, index) => (
            <div key={index} className="info-item-personel">
              <FileText className="info-item-icon" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
              <p className="info-item-value" style={{ fontSize: '0.875rem' }}>{comment}</p>
            </div>
          ))
        ) : (
          <p className="no-comments-text" style={{ color: 'var(--text-label)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
            {searchTerm ? 'Ничего не найдено' : 'Нет комментариев'}
          </p>
        )}
      </div>
    </InfoCard>
  );
}