// Интерфейсы для хранилища файлов

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  }
  
  export interface Division {
    id: number;
    name: string;
    code?: string;
    description?: string;
  }
  
  export interface Subdivision {
    id: number;
    name: string;
    division: Division;
    code?: string;
    description?: string;
  }
  
  export interface StorageFolder {
    id: number;
    name: string;
    parent: number | null;
    parent_name: string | null;
    folder_type: 'personal' | 'work';
    division: Division | null;
    subdivision: Subdivision | null;
    created_by: User;
    files_count: number;
    subfolders_count: number;
    total_size: number;
    full_path: string;
    is_pinned: boolean;
    color: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at?: string;
    deleted_by?: User;
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
    division: Division | null;
    subdivision: Subdivision | null;
    uploaded_by: User;
    download_url: string;
    is_favorited: boolean;
    is_pinned: boolean;
    download_count: number;
    last_downloaded: string | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at?: string;
    deleted_by?: User;
  }
  
  export interface FileShareLink {
    id: number;
    token: string;
    file: StorageFile;
    password: string | null;
    expires_at: string | null;
    max_downloads: number | null;
    download_count: number;
    created_by: User;
    created_at: string;
    is_active: boolean;
  }
  
  export interface Favorite {
    id: number;
    user: User;
    folder: StorageFolder | null;
    file: StorageFile | null;
    created_at: string;
  }
  
  export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
  }
  
  export interface StorageStatistics {
    total_files: number;
    total_size: number;
    used_storage: number;
    storage_quota: number;
    by_type: Array<{ file_type: string; count: number }>;
    top_extensions: Array<{ extension: string; count: number }>;
    recent_uploads: StorageFile[];
  }
  
  export interface BatchOperation {
    type: 'move' | 'delete' | 'copy';
    items: Array<StorageFolder | StorageFile>;
    target_folder_id?: number | null;
  }
  
  export interface SearchFilters {
    query: string;
    type?: 'personal' | 'work';
    mime_type?: string;
    min_size?: number;
    max_size?: number;
    date_from?: string;
    date_to?: string;
    folder_id?: number | null;
    division_id?: number;
    subdivision_id?: number;
  }
  
  export interface SortOptions {
    field: 'name' | 'size' | 'created_at' | 'updated_at';
    order: 'asc' | 'desc';
  }
  
  export interface ViewConfig {
    mode: 'list' | 'grid';
    sort: SortOptions;
    group_by?: 'type' | 'date' | 'extension';
  }
  
  // Типы для компонентов
  export interface FolderItemProps {
    folder: StorageFolder;
    viewMode: 'list' | 'grid';
    isSelected: boolean;
    onSelect: () => void;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    permissions: StoragePermissions;
  }
  
  export interface FileItemProps {
    file: StorageFile;
    viewMode: 'list' | 'grid';
    isSelected: boolean;
    onSelect: () => void;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    permissions: StoragePermissions;
  }
  
  // Типы для прав доступа
  export interface StoragePermissions {
    canViewStorage: boolean;
    canCreateFolders: boolean;
    canUploadFiles: boolean;
    canEditFiles: boolean;
    canDeleteFiles: boolean;
    canEditFolders: boolean;
    canDeleteFolders: boolean;
    canShareFiles: boolean;
    canViewTrash: boolean;
    canEmptyTrash: boolean;
    canViewStatistics: boolean;
    canViewAllStorage: boolean;
    storageQuota: number | null;
    maxFileSize: number;
    usedStorage: number;
    canEditItem: (item: any) => boolean;
    canDeleteItem: (item: any) => boolean;
    canShareItem: (item: any) => boolean;
  }
  
  // Контекст хранилища
  export interface StorageContextType {
    currentFolder: StorageFolder | null;
    selectedItems: Array<StorageFolder | StorageFile>;
    viewMode: 'list' | 'grid';
    viewType: 'work' | 'personal';
    sortBy: 'name' | 'date' | 'size';
    sortOrder: 'asc' | 'desc';
    searchQuery: string;
    isUploading: boolean;
    uploadProgress: number;
    uploadQueue: Array<{
      id: string;
      file: File;
      progress: number;
      status: 'pending' | 'uploading' | 'completed' | 'error';
      error?: string;
    }>;
    dispatch: React.Dispatch<StorageAction>;
    selectItem: (item: StorageFolder | StorageFile) => void;
    deselectItem: (item: StorageFolder | StorageFile) => void;
    toggleItemSelection: (item: StorageFolder | StorageFile) => void;
    clearSelection: () => void;
    setViewMode: (mode: 'list' | 'grid') => void;
    setViewType: (type: 'work' | 'personal') => void;
    startUpload: (files: File[]) => void;
    cancelUpload: (id: string) => void;
  }
  
  export type StorageAction =
    | { type: 'SET_CURRENT_FOLDER'; payload: StorageFolder | null }
    | { type: 'SET_SELECTED_ITEMS'; payload: Array<StorageFolder | StorageFile> }
    | { type: 'TOGGLE_ITEM_SELECTION'; payload: StorageFolder | StorageFile }
    | { type: 'CLEAR_SELECTION' }
    | { type: 'SET_VIEW_MODE'; payload: 'list' | 'grid' }
    | { type: 'SET_VIEW_TYPE'; payload: 'work' | 'personal' }
    | { type: 'SET_SORT_BY'; payload: 'name' | 'date' | 'size' }
    | { type: 'SET_SORT_ORDER'; payload: 'asc' | 'desc' }
    | { type: 'SET_SEARCH_QUERY'; payload: string }
    | { type: 'ADD_TO_UPLOAD_QUEUE'; payload: File[] }
    | { type: 'UPDATE_UPLOAD_PROGRESS'; payload: { id: string; progress: number } }
    | { type: 'COMPLETE_UPLOAD'; payload: { id: string; fileData: StorageFile } }
    | { type: 'FAIL_UPLOAD'; payload: { id: string; error: string } }
    | { type: 'REMOVE_FROM_UPLOAD_QUEUE'; payload: string }
    | { type: 'CLEAR_UPLOAD_QUEUE' };
  
  // Вспомогательные типы
  export type FileType = 'personal' | 'work';
  export type SortField = 'name' | 'date' | 'size';
  export type SortOrder = 'asc' | 'desc';
  export type ViewType = 'explorer' | 'recent' | 'favorites' | 'statistics' | 'trash';
  
  export interface BreadcrumbItem {
    id: number;
    name: string;
  }
  
  export interface ColorOption {
    value: string;
    label: string;
  }
  
  export interface UploadFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
  }