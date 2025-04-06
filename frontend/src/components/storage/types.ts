export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  file: File;
  folderId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}