import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';

interface ExportButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
}

export function ExportButton({ onClick, label, className = '' }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
        bg-gradient-to-r from-emerald-500 to-teal-600 
        hover:from-emerald-600 hover:to-teal-700 
        rounded-xl shadow-md hover:shadow-lg 
        transition-all duration-200 transform hover:scale-[1.0] active:scale-95
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        ${className}`}
    >
      <Download className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}