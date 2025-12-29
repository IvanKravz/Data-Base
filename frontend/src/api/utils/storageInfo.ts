// api/storageInfo.ts
import { api } from '../client';

export interface StorageInfo {
    total_used: number;
    storage_quota: number | null;
    quota: number | null;
    remaining: number | null;
    usage_percentage: number;
    files_count: number;
    folders_count: number;
    max_file_size: number;
    personal_files?: number;
    work_files?: number;
    breakdown?: {
      personal: {
        size: number;
        files_count: number;
        folders_count: number;
      };
      work: {
        size: number;
        files_count: number;
        folders_count: number;
      };
    };
    summary?: {
      total_files: number;
      total_folders: number;
      deleted_files: number;
      deleted_folders: number;
    };
  }
  
  export const storageInfoApi = {
    // Получить информацию о хранилище пользователя
    getStorageInfo: async (): Promise<StorageInfo> => {
      try {
        const { data } = await api.get('/storage/user-storage-info/'); 
        return {
          total_used: data.total_used || 0,
          storage_quota: data.storage_quota || null,
          quota: data.storage_quota || data.quota || null,
          remaining: data.remaining || null,
          usage_percentage: data.usage_percentage || 0,
          files_count: data.files_count || 0,
          folders_count: data.folders_count || 0,
          max_file_size: data.max_file_size || 100 * 1024 * 1024, // 100MB по умолчанию
          personal_files: data.personal_files,
          work_files: data.work_files,
          breakdown: data.breakdown,
          summary: data.summary
        };
      } catch (error) {
        console.error('Error loading storage info:', error);
        // Возвращаем данные по умолчанию
        return {
          total_used: 0,
          storage_quota: null,
          quota: null,
          remaining: null,
          usage_percentage: 0,
          files_count: 0,
          folders_count: 0,
          max_file_size: 100 * 1024 * 1024,
        };
      }
    },

  // Получить статистику (детальную)
  getStatistics: async () => {
    try {
      const { data } = await api.get('/storage/files/statistics/');
      return data;
    } catch (error) {
      console.error('Error loading statistics:', error);
      return {
        personal: { total_files: 0, total_size: 0, recent_uploads: 0 },
        work: { total_files: 0, total_size: 0 },
        by_type: [],
        top_extensions: [],
      };
    }
  },
};