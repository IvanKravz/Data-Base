import React from 'react';
import { Download } from 'lucide-react';
import './ExportButton.css';

interface ExportButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
}

export function ExportButton({ onClick, label, className = '' }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`export-btn ${className}`}
    >
      <Download className="export-btn-icon" />
      <span>{label}</span>
    </button>
  );
}