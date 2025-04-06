import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import '.././style.css'

interface InfoItemProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
}

export function InfoItem({ icon: Icon, iconColor, label, value }: InfoItemProps) {
  return (
    <div className="equipment-info-item">
      <Icon className={`equipment-info-item__icon ${iconColor}`} size={20} />
      <div>
        <p className="equipment-info-item__label">{label}</p>
        <p className="equipment-info-item__value">{value}</p>
      </div>
    </div>
  );
}