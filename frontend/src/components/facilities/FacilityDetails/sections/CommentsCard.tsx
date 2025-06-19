import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Facility } from '../../../../types';
import { InfoCard } from './InfoCard';
import '../FacilityForm.css';

interface CommentsCardProps {
  facility: Facility;
}

export function CommentsCard({ facility }: CommentsCardProps) {
  if (!facility.comments) return null;

  return (
    <InfoCard title="Комментарии">
      <div className="flex items-start gap-3">
        <MessageSquare className="h-5 w-5 text-indigo-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-gray-900 whitespace-pre-wrap">{facility.comments}</p>
        </div>
      </div>
    </InfoCard>
  );
}
