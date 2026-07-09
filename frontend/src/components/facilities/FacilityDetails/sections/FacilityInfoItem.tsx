// FacilityInfoItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FacilityInfoItemProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}

export function FacilityInfoItem({ icon: Icon, label, value }: FacilityInfoItemProps) {
  return (
    <div className="facility-details-info-item">
      <Icon className="facility-details-info-item__icon" size={20} />
      <div className="facility-details-info-item__content">
        <span className="facility-details-info-item__label">{label}</span>
        <span className="facility-details-info-item__value">{value}</span>
      </div>
    </div>
  );
}