import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Folder } from './types';

interface BreadcrumbProps {
  path: Folder[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onNavigate(null)}
        className={`hover:text-blue-600 ${path.length === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
      >
        Главная
      </button>
      {path.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`hover:text-blue-600 ${
              index === path.length - 1 ? 'font-medium text-gray-900' : 'text-gray-600'
            }`}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}