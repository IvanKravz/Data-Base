import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface ExportButtonProps {
  onClick: () => void;
  label: string;
}

export function ExportButton({ onClick, label }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
    >
      <FileSpreadsheet className="h-4 w-4" />
      {/* <span>Excel</span> */}
    </button>
  );
}