
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FileItem, Folder } from '../../components/storage/types';

interface StorageState {
  folders: Folder[];
  files: FileItem[];
  currentFolder: string | null;
  loading: boolean;
  error: string | null;
  totalSize: number;
}

const initialState: StorageState = {
  folders: [],
  files: [],
  currentFolder: null,
  loading: false,
  error: null,
  totalSize: 0
};

const storageSlice = createSlice({
  name: 'storage',
  initialState,
  reducers: {
    setFolders: (state, action: PayloadAction<Folder[]>) => {
      state.folders = action.payload;
    },
    setFiles: (state, action: PayloadAction<FileItem[]>) => {
      state.files = action.payload;
      state.totalSize = action.payload.reduce((acc, file) => acc + file.size, 0);
    },
    setCurrentFolder: (state, action: PayloadAction<string | null>) => {
      state.currentFolder = action.payload;
    },
    addFolder: (state, action: PayloadAction<Folder>) => {
      state.folders.push(action.payload);
    },
    removeFolder: (state, action: PayloadAction<string>) => {
      state.folders = state.folders.filter(folder => folder.id !== action.payload);
    },
    updateFolder: (state, action: PayloadAction<Folder>) => {
      const index = state.folders.findIndex(folder => folder.id === action.payload.id);
      if (index !== -1) {
        state.folders[index] = action.payload;
      }
    },
    addFile: (state, action: PayloadAction<FileItem>) => {
      state.files.push(action.payload);
      state.totalSize += action.payload.size;
    },
    removeFile: (state, action: PayloadAction<string>) => {
      const file = state.files.find(f => f.id === action.payload);
      if (file) {
        state.totalSize -= file.size;
      }
      state.files = state.files.filter(file => file.id !== action.payload);
    },
    updateFile: (state, action: PayloadAction<FileItem>) => {
      const index = state.files.findIndex(file => file.id === action.payload.id);
      if (index !== -1) {
        const oldSize = state.files[index].size;
        state.files[index] = action.payload;
        state.totalSize = state.totalSize - oldSize + action.payload.size;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const {
  setFolders,
  setFiles,
  setCurrentFolder,
  addFolder,
  removeFolder,
  updateFolder,
  addFile,
  removeFile,
  updateFile,
  setLoading,
  setError
} = storageSlice.actions;

export default storageSlice.reducer;
