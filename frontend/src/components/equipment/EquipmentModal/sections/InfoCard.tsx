import React from 'react';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}