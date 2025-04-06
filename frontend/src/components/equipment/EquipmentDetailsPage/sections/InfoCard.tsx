import React from 'react';
import '.././style.css'

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div className="equipment-card">
      <h2 className="equipment-card__title">{title}</h2>
      <div className="equipment-card-content">
        {children}
      </div>
    </div>
  );
}