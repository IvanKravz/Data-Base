import React from 'react';
import '.././style.css'

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div className="info-card">
      <h2 className="info-card-title">{title}</h2>
      <div className="info-card-content">
        {children}
      </div>
    </div>
  );
}