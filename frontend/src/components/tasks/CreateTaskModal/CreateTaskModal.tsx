import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TaskForm } from './TaskForm';

interface CreateTaskModalProps {
  onClose: () => void;
}

export function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto md:max-w-3xl lg:max-w-4xl shadow-xl transform transition-all duration-300 scale-in animate-in fade-in">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Новая задача
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Создайте новую задачу и добавьте этапы её выполнения
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mx-8 mt-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start">
              <div className="flex-1">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="ml-3 p-1 hover:bg-red-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="p-8 pt-6">
          <TaskForm
            onSuccess={onClose}
            onError={setError}
          />
        </div>
      </div>
    </div>
  );
}