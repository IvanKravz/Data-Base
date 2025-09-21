import React from 'react';
import { LucideIcon } from 'lucide-react';
import '.././style.css';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
}

export function SectionHeader({ icon: Icon, title, iconColor = 'text-blue-500' }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className={`section-icon ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="form-section-title">{title}</h3>
    </div>
  );
}