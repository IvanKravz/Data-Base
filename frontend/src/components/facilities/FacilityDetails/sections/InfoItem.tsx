import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import '../style.css'

interface InfoItemProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
}

export function InfoItem({ icon: Icon, iconColor, label, value }: InfoItemProps) {
  return (
    <div className="info-item">
      <Icon className={`info-item-icon ${iconColor}`} />
      <div>
        <p className="info-item-label">{label}</p>
        <p className="info-item-value">{value}</p>
      </div>
    </div>
  );
}