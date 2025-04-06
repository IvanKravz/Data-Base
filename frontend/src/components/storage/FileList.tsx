import React from 'react';
import { Download, Pencil, Trash2, Folder, File, ChevronRight } from 'lucide-react';
import { FileItem, Folder as FolderType } from './types';
import { formatBytes } from '../../utils/formatBytes';
import { getFileIcon } from './utils/getFileIcon';
import { format } from 'date-fns';

interface FileListProps {
  folders: FolderType[];
  files: FileItem[];
  allFiles: FileItem[]; // Все файлы для подсчета размера папок
  onFolderClick: (folderId: string) => void;
  onDownload: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onRenameFolder: (folder: FolderType) => void;
  onDeleteFolder: (folder: FolderType) => void;
}

export function FileList({ 
  folders, 
  files, 
  allFiles,
  onFolderClick,
  onDownload, 
  onRename, 
  onDelete,
  onRenameFolder,
  onDeleteFolder
}: FileListProps) {
  // Рекурсивная функция для подсчета размера папки
  const getFolderSize = (folderId: string): number => {
    const directFiles = allFiles.filter(file => file.folderId === folderId);
    const directSize = directFiles.reduce((acc, file) => acc + file.size, 0);
    
    const subFolders = folders.filter(folder => folder.parentId === folderId);
    const subFoldersSize = subFolders.reduce((acc, folder) => acc + getFolderSize(folder.id), 0);
    
    return directSize + subFoldersSize;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="grid grid-cols-[1fr,100px,180px,100px] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
        <div>Название</div>
        <div>Размер</div>
        <div>Изменен</div>
        <div className="text-right">Действия</div>
      </div>

      <div className="divide-y divide-gray-100">
        {folders.map((folder) => {
          const folderSize = getFolderSize(folder.id);
          return (
            <div 
              key={folder.id}
              className="grid grid-cols-[1fr,100px,180px,100px] gap-2 px-4 py-2 hover:bg-blue-50/50 cursor-pointer group"
            >
              <div 
                className="flex items-center gap-3"
                onClick={() => onFolderClick(folder.id)}
              >
                <div className="flex items-center text-blue-600">
                  <Folder className="h-5 w-5" />
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="font-medium text-gray-900">{folder.name}</span>
              </div>
              <div className="text-sm text-gray-500">
                {formatBytes(folderSize)}
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(folder.createdAt), 'dd.MM.yyyy HH:mm')}
              </div>
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameFolder(folder);
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-green-100 text-green-600"
                  title="Переименовать"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder);
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-100 text-red-600"
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {files.map((file) => {
          const FileIcon = getFileIcon(file.type);
          return (
            <div 
              key={file.id}
              className="grid grid-cols-[1fr,100px,180px,100px] gap-2 px-4 py-2 hover:bg-blue-50/50 group"
            >
              <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{file.name}</span>
              </div>
              <div className="text-sm text-gray-500">
                {formatBytes(file.size)}
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(file.uploadDate), 'dd.MM.yyyy HH:mm')}
              </div>
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onDownload(file)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-blue-100 text-blue-600"
                  title="Скачать"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onRename(file)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-green-100 text-green-600"
                  title="Переименовать"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(file)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-100 text-red-600"
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {folders.length === 0 && files.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            <File className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">Эта папка пуста</p>
          </div>
        )}
      </div>
    </div>
  );
}