import React, { useState, useRef } from 'react';
import { Upload, Search, HardDrive, FileText, FolderPlus, ChevronLeft } from 'lucide-react';
import { formatBytes } from '../../utils/formatBytes';
import { FileItem, Folder } from './types';
import { FileList } from './FileList';
import { RenameFileModal } from './RenameFileModal';
import { DeleteFileModal } from './DeleteFileModal';
import { CreateFolderModal } from './CreateFolderModal';
import { RenameFolderModal } from './RenameFolderModal';
import { DeleteFolderModal } from './DeleteFolderModal';
import { Breadcrumb } from './Breadcrumb';

export function StorageSection() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current folder path
  const getFolderPath = (folderId: string | null): Folder[] => {
    const path: Folder[] = [];
    let currentId = folderId;

    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }

    return path;
  };

  // Рекурсивная функция для получения всех файлов в папке и подпапках
  const getAllFilesInFolder = (folderId: string): FileItem[] => {
    const directFiles = files.filter(file => file.folderId === folderId);
    const subFolders = folders.filter(folder => folder.parentId === folderId);
    const subFolderFiles = subFolders.flatMap(folder => getAllFilesInFolder(folder.id));
    return [...directFiles, ...subFolderFiles];
  };

  // Filter files and folders for current view
  const currentFiles = files.filter(file => file.folderId === currentFolder);
  const currentFolders = folders.filter(folder => folder.parentId === currentFolder);
  
  const filteredItems = {
    folders: currentFolders.filter(folder => 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    files: currentFiles.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: FileItem[] = Array.from(uploadedFiles).map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toISOString(),
      file: file,
      folderId: currentFolder
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleCreateFolder = (name: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      parentId: currentFolder,
      createdAt: new Date().toISOString()
    };
    setFolders(prev => [...prev, newFolder]);
    setShowCreateFolderModal(false);
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolder(folderId);
    setSearchTerm('');
  };

  const handleNavigateUp = () => {
    const currentFolderObj = folders.find(f => f.id === currentFolder);
    setCurrentFolder(currentFolderObj?.parentId || null);
  };

  const handleDownload = (file: FileItem) => {
    const url = URL.createObjectURL(file.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRename = (file: FileItem) => {
    setSelectedFile(file);
    setShowRenameModal(true);
  };

  const handleDelete = (file: FileItem) => {
    setSelectedFile(file);
    setShowDeleteModal(true);
  };

  const handleRenameFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowRenameFolderModal(true);
  };

  const handleDeleteFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowDeleteFolderModal(true);
  };

  const confirmRename = (newName: string) => {
    if (!selectedFile) return;
    setFiles(prev => prev.map(file => 
      file.id === selectedFile.id ? { ...file, name: newName } : file
    ));
    setShowRenameModal(false);
    setSelectedFile(null);
  };

  const confirmDelete = () => {
    if (!selectedFile) return;
    setFiles(prev => prev.filter(file => file.id !== selectedFile.id));
    setShowDeleteModal(false);
    setSelectedFile(null);
  };

  const confirmRenameFolder = (newName: string) => {
    if (!selectedFolder) return;
    setFolders(prev => prev.map(folder =>
      folder.id === selectedFolder.id ? { ...folder, name: newName } : folder
    ));
    setShowRenameFolderModal(false);
    setSelectedFolder(null);
  };

  const confirmDeleteFolder = () => {
    if (!selectedFolder) return;
    // Рекурсивно удаляем все файлы из папки и её подпапок
    const filesToDelete = getAllFilesInFolder(selectedFolder.id);
    setFiles(prev => prev.filter(file => !filesToDelete.some(f => f.id === file.id)));
    
    // Рекурсивно удаляем все подпапки
    const foldersToDelete = new Set<string>([selectedFolder.id]);
    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      folders.forEach(folder => {
        if (!foldersToDelete.has(folder.id) && folder.parentId && foldersToDelete.has(folder.parentId)) {
          foldersToDelete.add(folder.id);
          foundNew = true;
        }
      });
    }
    
    setFolders(prev => prev.filter(folder => !foldersToDelete.has(folder.id)));
    setShowDeleteFolderModal(false);
    setSelectedFolder(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with storage info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Хранилище</h2>
              <p className="text-sm text-gray-500">
                {files.length} файлов • {formatBytes(totalSize)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Новая папка</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Загрузить файлы</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 mb-4">
          {currentFolder && (
            <button
              onClick={handleNavigateUp}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <Breadcrumb
            path={getFolderPath(currentFolder)}
            onNavigate={setCurrentFolder}
          />
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Поиск файлов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* File list */}
      <FileList
        folders={filteredItems.folders}
        files={filteredItems.files}
        allFiles={files}
        onFolderClick={handleFolderClick}
        onDownload={handleDownload}
        onRename={handleRename}
        onDelete={handleDelete}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
      />

      {/* Modals */}
      {showCreateFolderModal && (
        <CreateFolderModal
          onConfirm={handleCreateFolder}
          onCancel={() => setShowCreateFolderModal(false)}
        />
      )}

      {showRenameModal && selectedFile && (
        <RenameFileModal
          file={selectedFile}
          onConfirm={confirmRename}
          onCancel={() => {
            setShowRenameModal(false);
            setSelectedFile(null);
          }}
        />
      )}

      {showDeleteModal && selectedFile && (
        <DeleteFileModal
          file={selectedFile}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedFile(null);
          }}
        />
      )}

      {showRenameFolderModal && selectedFolder && (
        <RenameFolderModal
          folder={selectedFolder}
          onConfirm={confirmRenameFolder}
          onCancel={() => {
            setShowRenameFolderModal(false);
            setSelectedFolder(null);
          }}
        />
      )}

      {showDeleteFolderModal && selectedFolder && (
        <DeleteFolderModal
          folder={selectedFolder}
          filesCount={getAllFilesInFolder(selectedFolder.id).length}
          onConfirm={confirmDeleteFolder}
          onCancel={() => {
            setShowDeleteFolderModal(false);
            setSelectedFolder(null);
          }}
        />
      )}
    </div>
  );
}