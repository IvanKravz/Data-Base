import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import './style.css'

interface StatCardProps {
  title: string;
  count: number;
  icon: typeof LucideIcon;
  iconColor: string;
  gradientClass: string;
  details: Array<{
    label: string;
    value: number;
  }>;
  onClick: () => void;
}

export function StatCard({
  title,
  count,
  icon: Icon,
  iconColor,
  gradientClass,
  details,
  onClick
}: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`stat-card ${gradientClass}`}
    >
      <div className="stat-card-header">
        <Icon className={`stat-card-icon ${iconColor}`} />
        <h2 className="stat-card-title">{title}</h2>
        <p className="stat-card-count">
          {count}
        </p>
      </div>
      <div className="space-y-4">
        {/* <div className="stat-card-details">
          {details.map((detail, index) => (
            <div key={index} className="stat-card-detail-item">
              <span className="stat-card-detail-label">{detail.label}</span>
              <span className="stat-card-detail-value">{detail.value}</span>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
}