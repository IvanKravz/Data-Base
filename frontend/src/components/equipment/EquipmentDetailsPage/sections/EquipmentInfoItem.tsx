// EquipmentInfoItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EquipmentInfoItemProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}

export function EquipmentInfoItem({ icon: Icon, label, value }: EquipmentInfoItemProps) {
  return (
    <div className="equipment-info-item">
      <Icon className="equipment-info-item__icon" size={20} />
      <div className="equipment-info-item__content">
        <span className="equipment-info-item__label">{label}</span>
        <span className="equipment-info-item__value">{value || '—'}</span>
      </div>
    </div>
  );
}