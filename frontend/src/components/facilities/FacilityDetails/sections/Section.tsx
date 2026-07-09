// Section.tsx
import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="facility-details-section">
      <div className="facility-details-section-content">{children}</div>
    </div>
  );
}