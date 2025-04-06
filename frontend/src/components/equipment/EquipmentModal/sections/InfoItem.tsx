import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface InfoItemProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
}

export function InfoItem({ icon: Icon, iconColor, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}