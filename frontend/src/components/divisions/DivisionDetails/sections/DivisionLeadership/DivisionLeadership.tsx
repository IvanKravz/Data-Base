import React from 'react';
import { User, Phone, Smartphone } from 'lucide-react';
import { Division } from '../../../../../types';
import './DivisionLeadership.css';

interface DivisionLeadershipProps {
  division: Division;
}

export function DivisionLeadership({ division }: DivisionLeadershipProps) {
  const { head, deputy_head } = division;

  if (!head && !deputy_head) {
    return null;
  }

  const renderLeader = (leader: any, title: string) => {
    if (!leader) return null;
    return (
      <div className="division-leader-item">
        <div className="division-leader-info">
          <div className="division-leader-position">{leader.position || '—'}</div>
          <div className="division-leader-name">{leader.full_name}</div>
          <div className="division-leader-contacts">
            {leader.work_phone && (
              <span><Phone size={14} /> Рабочий: {leader.work_phone}</span>
            )}
            {leader.personal_phone && (
              <span><Smartphone size={14} /> Личный: {leader.personal_phone}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="division-leadership-grid">
      {renderLeader(head, 'Начальник отдела')}
      {renderLeader(deputy_head, 'Заместитель начальника отдела')}
    </div>
  );
}