import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { Employee } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import '.././style.css'

interface ContactInfoProps {
  person: Employee;
}

export function CommentsInfo({ person }: ContactInfoProps) {
  const comments = person.description ? person.description.split('\n').filter(c => c.trim() !== '') : [];

  return (
    <InfoCard title="Примечания">
      {comments.length > 0 ? (
        comments.map((comment, index) => (
          <div key={index} >
            <InfoItem 
              value={`${index+1}) ${comment}`}
            />
          </div>
        ))
      ) : (
        <p className="no-comments-text">Нет комментариев</p>
      )}
    </InfoCard>
  );
}