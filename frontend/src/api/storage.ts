import { api } from './client';

export interface StorageFolder {
  id: number;
  name: string;
  parent: number | null;
  parent_name: string | null;
  folder_type: 'personal' | 'work';
  division: any | null;
  subdivision: any | null;
  created_by: any;
  files_count: number;
  subfolders_count: number;
  total_size: number;
  full_path: string;
  is_pinned: boolean;
  color: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface StorageFile {
  id: number;
  name: string;
  original_name: string;
  file: string;
  size: number;
  human_readable_size: string;
  mime_type: string;
  extension: string;
  file_type: 'personal' | 'work';
  folder: number | null;
  folder_name: string | null;
  division: any | null;
  subdivision: any | null;
  uploaded_by: any;
  download_url: string;
  is_favorited: boolean;
  is_pinned: boolean;
  download_count: number;
  last_downloaded: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface FileShareLink {
  id: number;
  token: string;
  file: number;
  file_info: StorageFile;
  password: string | null;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  created_by: any;
  created_at: string;
  is_active: boolean;
}

export interface Favorite {
  id: number;
  user: number;
  folder: StorageFolder | null;
  file: StorageFile | null;
  created_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const storageApi = {
  // === Папки ===
  getFolders: async (params?: {
    parent_id?: string | null;
    type?: 'personal' | 'work';
    division_id?: number;
    subdivision_id?: number;
    search?: string;
    ordering?: string;
  }) => {
    const { data } = await api.get('/storage/folders/', { params });
    return data;
  },

  createFolder: async (folderData: {
    name: string;
    parent?: number | null;
    folder_type: 'personal' | 'work';
    color?: string;
    division?: number | null;
    subdivision?: number | null;
  }) => {
    const { data } = await api.post('/storage/folders/', folderData);
    return data;
  },

  updateFolder: async (folderId: number, folderData: Partial<StorageFolder>) => {
    const { data } = await api.patch(`/storage/folders/${folderId}/`, folderData);
    return data;
  },

  deleteFolder: async (folderId: number) => {
    await api.delete(`/storage/folders/${folderId}/`);
  },

  softDeleteFolder: async (folderId: number) => {
    const { data } = await api.post(`/storage/folders/${folderId}/soft_delete/`);
    return data;
  },

  restoreFolder: async (folderId: number) => {
    const { data } = await api.post(`/storage/folders/${folderId}/restore/`);
    return data;
  },

  hardDeleteFolder: async (folderId: number) => {
    await api.delete(`/storage/folders/${folderId}/hard_delete/`);
  },

  getFolderContents: async (folderId: number) => {
    const { data } = await api.get(`/storage/folders/${folderId}/contents/`);
    return data;
  },

  getFolderPath: async (folderId: number) => {
    const { data } = await api.get(`/storage/folders/${folderId}/path/`);
    return data;
  },

  pinFolder: async (folderId: number) => {
    const { data } = await api.post(`/storage/folders/${folderId}/pin/`);
    return data;
  },

  // === Файлы ===
  getFiles: async (params?: {
    folder_id?: number | null;
    type?: 'personal' | 'work';
    division_id?: number;
    subdivision_id?: number;
    search?: string;
    ordering?: string;
    mime_type?: string;
    min_size?: number;
    max_size?: number;
  }) => {
    const { data } = await api.get('/storage/files/', { params });
    return data;
  },

  // Используем специальный endpoint для множественной загрузки
  uploadMultipleFiles: async (
    files: File[],
    folderId?: number | null,
    fileType: 'personal' | 'work' = 'work'
  ) => {
    const formData = new FormData();

    // Добавляем все файлы с ключом 'files[]' для множественной загрузки
    files.forEach(file => {
      formData.append('files', file); // Используем 'files' (множественное число)
    });

    if (folderId) {
      formData.append('folder_id', folderId.toString());
    }

    formData.append('file_type', fileType);

    // Используем специальный endpoint для множественной загрузки
    const { data } = await api.post('/storage/files/upload_multiple/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return data;
  },

  updateFile: async (fileId: number, fileData: Partial<StorageFile>) => {
    const { data } = await api.patch(`/storage/files/${fileId}/`, fileData);
    return data;
  },

  deleteFile: async (fileId: number) => {
    await api.delete(`/storage/files/${fileId}/`);
  },

  softDeleteFile: async (fileId: number) => {
    const { data } = await api.post(`/storage/files/${fileId}/soft_delete/`);
    return data;
  },

  restoreFile: async (fileId: number) => {
    const { data } = await api.post(`/storage/files/${fileId}/restore/`);
    return data;
  },

  hardDeleteFile: async (fileId: number) => {
    await api.post(`/storage/files/${fileId}/hard_delete/`);
  },

  downloadFile: async (fileId: number) => {
    const response = await api.get(`/storage/files/${fileId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  pinFile: async (fileId: number) => {
    const { data } = await api.post(`/storage/files/${fileId}/pin/`);
    return data;
  },

  // === Общие ссылки ===
  getShareLinks: async () => {
    const { data } = await api.get('/storage/share-links/');
    return data;
  },

  createShareLink: async (shareData: {
    file: number;
    password?: string;
    expires_at?: string;
    max_downloads?: number;
  }) => {
    const { data } = await api.post('/storage/share-links/', shareData);
    return data;
  },

  updateShareLink: async (linkId: number, shareData: Partial<FileShareLink>) => {
    const { data } = await api.patch(`/storage/share-links/${linkId}/`, shareData);
    return data;
  },

  deleteShareLink: async (linkId: number) => {
    await api.delete(`/storage/share-links/${linkId}/`);
  },

  toggleShareLink: async (linkId: number) => {
    const { data } = await api.post(`/storage/share-links/${linkId}/toggle/`);
    return data;
  },

  downloadSharedFile: async (token: string, password?: string) => {
    const params = password ? { password } : {};
    const { data } = await api.get(`/storage/share/download/${token}/`, { params });
    return data;
  },

  // === Избранное ===
  getFavorites: async () => {
    const { data } = await api.get('/storage/favorites/');
    return data;
  },

  toggleFavorite: async (data: { folder_id?: number; file_id?: number }) => {
    const response = await api.post('/storage/favorites/toggle/', data);
    return response.data;
  },

  // === Корзина ===
  getTrashFolders: async () => {
    const { data } = await api.get('/storage/folders/trash/');
    return data;
  },

  getTrashFiles: async () => {
    const { data } = await api.get('/storage/files/trash/');
    return data;
  },

  emptyTrash: async () => {
    // Используем endpoint для папок, который очищает корзину
    await api.post('/storage/folders/empty_trash/');
  },

  // === Статистика ===
  getStatistics: async () => {
    const { data } = await api.get('/storage/files/statistics/');
    return data;
  },

  getRecentFiles: async () => {
    const { data } = await api.get('/storage/files/recent/');
    return data;
  },

  // === Поиск ===
  searchFiles: async (query: string, params?: Record<string, any>) => {
    const { data } = await api.get('/storage/files/', {
      params: { ...params, search: query }
    });
    return data;
  },

  searchFolders: async (query: string, params?: Record<string, any>) => {
    const { data } = await api.get('/storage/folders/', {
      params: { ...params, search: query }
    });
    return data;
  },

  // === Пакетные операции ===
  moveMultipleFiles: async (fileIds: number[], folderId: number | null) => {
    const { data } = await api.post('/storage/files/batch_move/', {
      file_ids: fileIds,
      folder_id: folderId
    });
    return data;
  },

  deleteMultipleFiles: async (fileIds: number[]) => {
    const { data } = await api.post('/storage/files/batch_delete/', {
      file_ids: fileIds
    });
    return data;
  },

  moveMultipleFolders: async (folderIds: number[], parentId: number | null) => {
    const { data } = await api.post('/storage/folders/batch_move/', {
      folder_ids: folderIds,
      parent_id: parentId
    });
    return data;
  },

  deleteMultipleFolders: async (folderIds: number[]) => {
    const { data } = await api.post('/storage/folders/batch_delete/', {
      folder_ids: folderIds
    });
    return data;
  }
};