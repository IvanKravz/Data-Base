import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Division } from '../../../../types';
import './style.css'

interface HeaderProps {
  division: Division;
  activeSection: string;
  activeSubdivision: string | null;
  onBack: () => void;
}

export function Header({ division, activeSubdivision, onBack }: HeaderProps) {
  return (
    <div className="header-divisions">
      <div className="divisions-title-container">
        <button type="button" onClick={onBack} className="back-button">
          <ArrowLeft className="back-button-icon" />
        </button>
        <div>
          <h1 className="divisions-title">
            {division.name}
            {activeSubdivision && ` - ${activeSubdivision}`}
          </h1>
        </div>
      </div>
    </div>
  );
}