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
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {division.name}
            {activeSubdivision && ` - ${activeSubdivision}`}
          </h1>
        </div>
      </div>
    </div>
  );
}