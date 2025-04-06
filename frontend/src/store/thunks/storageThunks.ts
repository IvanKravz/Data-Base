import { createAsyncThunk } from '@reduxjs/toolkit';
import { storageApi } from '../../api/storage';
import {
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
} from '../slices/storageSlice';

export const fetchFolderContents = createAsyncThunk(
  'storage/fetchFolderContents',
  async (folderId: string | null, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const { folders, files } = await storageApi.fetchFolderContents(folderId);
      dispatch(setFolders(folders));
      dispatch(setFiles(files));
      dispatch(setCurrentFolder(folderId));
      return { folders, files };
    } catch (error: any) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const createFolder = createAsyncThunk(
  'storage/createFolder',
  async ({ name, parentId }: { name: string; parentId?: string | null }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const folder = await storageApi.createFolder(name, parentId);
      dispatch(addFolder(folder));
      return folder;
    } catch (error: any) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const deleteFolder = createAsyncThunk(
  'storage/deleteFolder',
  async (folderId: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      await storageApi.deleteFolder(folderId);
      dispatch(removeFolder(folderId));
    } catch (error: any) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const renameFolder = createAsyncThunk(
  'storage/renameFolder',
  async ({ folderId, newName }: { folderId: string; newName: string }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const folder = await storageApi.renameFolder(folderId, newName);
      dispatch(updateFolder(folder));
      return folder;
    } catch (error: any) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const uploadFile = createAsyncThunk(
  'storage/uploadFile',
  async ({ file, folderId }: { file: File; folderId?: string | null }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const uploadedFile = await storageApi.uploadFile(file, folderId);
      dispatch(addFile(uploadedFile));
      return uploadedFile;
    } catch (error: any) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const deleteFile = createAsyncThunk(
  'storage/deleteFile',
  async (fileId: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      await storageApi.deleteFile(fileId);
      dispatch(removeFile(fileId));
    } catch (error: any) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const renameFile = createAsyncThunk(
  'storage/renameFile',
  async ({ fileId, newName }: { fileId: string; newName: string }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const file = await storageApi.renameFile(fileId, newName);
      dispatch(updateFile(file));
      return file;
    } catch (error: any) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const moveFile = createAsyncThunk(
  'storage/moveFile',
  async ({ fileId, newFolderId }: { fileId: string; newFolderId: string | null }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const file = await storageApi.moveFile(fileId, newFolderId);
      dispatch(updateFile(file));
      return file;
    } catch (error: any) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);
