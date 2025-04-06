import React from 'react';
import { X } from 'lucide-react';

interface CreateModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function CreateModal({ title, description, onClose, children }: CreateModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-hidden md:max-w-3xl lg:max-w-4xl shadow-xl transform transition-all duration-300 scale-in animate-in fade-in">
        {/* Sticky header with solid background and shadow */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable content area with padding */}
        <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="p-8 pt-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}