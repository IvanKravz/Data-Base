import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Folder } from './types';

interface DeleteFolderModalProps {
  folder: Folder;
  filesCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteFolderModal({ folder, filesCount, onConfirm, onCancel }: DeleteFolderModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold">Удаление папки</h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Вы уверены, что хотите удалить папку "{folder.name}"?
            {filesCount > 0 && (
              <>
                <br />
                <br />
                <span className="font-medium text-red-600">
                  Внимание: папка содержит {filesCount} {
                    filesCount === 1 ? 'файл' : 
                    filesCount < 5 ? 'файла' : 'файлов'
                  }. Все файлы будут удалены безвозвратно.
                </span>
              </>
            )}
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}