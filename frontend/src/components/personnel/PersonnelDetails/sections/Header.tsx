import React from 'react';
import { ArrowLeft } from 'lucide-react';
import '../PersonnelDetails.css';

interface HeaderProps {
  title: string;
  onBack: () => void;
}

export function Header({ title, onBack }: HeaderProps) {
  return (
    <div className="personnel-header">
      <div className="personnel-header-left">
        <button onClick={onBack} className="personnel-header-icon-button">
          <ArrowLeft size={18} />
        </button>
        <h1 className="personnel-header-title">{title}</h1>
      </div>
    </div>
  );
}