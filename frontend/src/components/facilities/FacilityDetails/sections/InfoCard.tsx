import React from 'react';
import '../style.css';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div className="facility-info-card">
      <h2 className="facility-info-card__title">{title}</h2>
      <div className="facility-info-card__content">
        {children}
      </div>
    </div>
  );
}