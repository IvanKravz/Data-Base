
import { api } from './client';
import { FileItem, Folder } from '../components/storage/types';

export const storageApi = {
  // Folder operations
  getFolders: async (parentId?: string | null) => {
    const params = parentId ? { parent: parentId === 'root' ? null : parentId } : {};
    const { data } = await api.get('/storage/folders/', { params });
    return data;
  },

  createFolder: async (name: string, parentId?: string | null) => {
    const { data } = await api.post('/storage/folders/', {
      name,
      parent: parentId === 'root' ? null : parentId
    });
    return data;
  },

  deleteFolder: async (folderId: string) => {
    await api.delete(`/storage/folders/${folderId}/`);
  },

  renameFolder: async (folderId: string, newName: string) => {
    const { data } = await api.patch(`/storage/folders/${folderId}/`, {
      name: newName
    });
    return data;
  },

  getFolderPath: async (folderId: string) => {
    const { data } = await api.get(`/storage/folders/${folderId}/path/`);
    return data;
  },

  // File operations
  getFiles: async (folderId?: string | null) => {
    const params = folderId ? { folder: folderId === 'root' ? null : folderId } : {};
    const { data } = await api.get('/storage/files/', { params });
    return data;
  },

  uploadFile: async (file: File, folderId?: string | null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    if (folderId && folderId !== 'root') {
      formData.append('folder', folderId);
    }

    const { data } = await api.post('/storage/files/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  },

  deleteFile: async (fileId: string) => {
    await api.delete(`/storage/files/${fileId}/`);
  },

  renameFile: async (fileId: string, newName: string) => {
    const { data } = await api.post(`/storage/files/${fileId}/rename/`, {
      name: newName
    });
    return data;
  },

  moveFile: async (fileId: string, newFolderId: string | null) => {
    const { data } = await api.post(`/storage/files/${fileId}/move/`, {
      folder: newFolderId === 'root' ? null : newFolderId
    });
    return data;
  },

  // Redux thunk actions
  fetchFolderContents: async (folderId?: string | null) => {
    const [folders, files] = await Promise.all([
      storageApi.getFolders(folderId),
      storageApi.getFiles(folderId)
    ]);
    return { folders, files };
  }
};
