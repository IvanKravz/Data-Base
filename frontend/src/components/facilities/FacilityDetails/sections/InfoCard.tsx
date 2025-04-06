import React from 'react';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}