import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
}

export function SectionHeader({ icon: Icon, title, iconColor = 'text-blue-500' }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <h3 className="text-base font-medium text-gray-900">{title}</h3>
    </div>
  );
}