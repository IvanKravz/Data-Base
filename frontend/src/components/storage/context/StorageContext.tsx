// components/storage/context/StorageContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface StorageState {
    currentFolder: any | null;
    selectedItems: Array<any>;
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
}

type StorageAction =
    | { type: 'SET_CURRENT_FOLDER'; payload: any | null }
    | { type: 'SET_SELECTED_ITEMS'; payload: Array<any> }
    | { type: 'TOGGLE_ITEM_SELECTION'; payload: any }
    | { type: 'CLEAR_SELECTION' }
    | { type: 'SET_VIEW_MODE'; payload: 'list' | 'grid' }
    | { type: 'SET_VIEW_TYPE'; payload: 'work' | 'personal' }
    | { type: 'SET_SORT_BY'; payload: 'name' | 'date' | 'size' }
    | { type: 'SET_SORT_ORDER'; payload: 'asc' | 'desc' }
    | { type: 'SET_SEARCH_QUERY'; payload: string }
    | { type: 'ADD_TO_UPLOAD_QUEUE'; payload: File[] }
    | { type: 'UPDATE_UPLOAD_PROGRESS'; payload: { id: string; progress: number } }
    | { type: 'COMPLETE_UPLOAD'; payload: { id: string; fileData: any } }
    | { type: 'FAIL_UPLOAD'; payload: { id: string; error: string } }
    | { type: 'REMOVE_FROM_UPLOAD_QUEUE'; payload: string }
    | { type: 'CLEAR_UPLOAD_QUEUE' };

interface StorageContextType extends StorageState {
    dispatch: React.Dispatch<StorageAction>;
    selectItem: (item: any) => void;
    deselectItem: (item: any) => void;
    toggleItemSelection: (item: any) => void;
    clearSelection: () => void;
    setViewMode: (mode: 'list' | 'grid') => void;
    setViewType: (type: 'work' | 'personal') => void;
    startUpload: (files: File[]) => void;
    cancelUpload: (id: string) => void;
}

const initialState: StorageState = {
    currentFolder: null,
    selectedItems: [],
    viewMode: 'grid',
    viewType: 'work',
    sortBy: 'date',
    sortOrder: 'desc',
    searchQuery: '',
    isUploading: false,
    uploadProgress: 0,
    uploadQueue: [],
};

const StorageContext = createContext<StorageContextType | undefined>(undefined);

const storageReducer = (state: StorageState, action: StorageAction): StorageState => {
    switch (action.type) {
        case 'SET_CURRENT_FOLDER':
            return { ...state, currentFolder: action.payload, selectedItems: [] };

        case 'SET_SELECTED_ITEMS':
            return { ...state, selectedItems: action.payload };

        case 'TOGGLE_ITEM_SELECTION': {
            const isSelected = state.selectedItems.some(item => item.id === action.payload.id);
            if (isSelected) {
                return {
                    ...state,
                    selectedItems: state.selectedItems.filter(item => item.id !== action.payload.id)
                };
            } else {
                return {
                    ...state,
                    selectedItems: [...state.selectedItems, action.payload]
                };
            }
        }

        case 'CLEAR_SELECTION':
            return { ...state, selectedItems: [] };

        case 'SET_VIEW_MODE':
            return { ...state, viewMode: action.payload };

        case 'SET_VIEW_TYPE':
            return { ...state, viewType: action.payload, selectedItems: [] };

        case 'SET_SORT_BY':
            return { ...state, sortBy: action.payload };

        case 'SET_SORT_ORDER':
            return { ...state, sortOrder: action.payload };

        case 'SET_SEARCH_QUERY':
            return { ...state, searchQuery: action.payload };

        case 'ADD_TO_UPLOAD_QUEUE': {
            const newUploads = action.payload.map(file => ({
                id: `${Date.now()}-${Math.random()}`,
                file,
                progress: 0,
                status: 'pending' as const
            }));
            return {
                ...state,
                uploadQueue: [...state.uploadQueue, ...newUploads],
                isUploading: true
            };
        }

        case 'UPDATE_UPLOAD_PROGRESS': {
            return {
                ...state,
                uploadQueue: state.uploadQueue.map(upload =>
                    upload.id === action.payload.id
                        ? { ...upload, progress: action.payload.progress, status: 'uploading' as const }
                        : upload
                ),
                uploadProgress: Math.round(
                    state.uploadQueue.reduce((sum, upload) => sum + upload.progress, 0) /
                    state.uploadQueue.length
                )
            };
        }

        case 'COMPLETE_UPLOAD': {
            const updatedQueue = state.uploadQueue.map(upload =>
                upload.id === action.payload.id
                    ? { ...upload, status: 'completed' as const, progress: 100 }
                    : upload
            );

            const allCompleted = updatedQueue.every(upload => upload.status === 'completed');

            return {
                ...state,
                uploadQueue: updatedQueue,
                isUploading: !allCompleted,
                uploadProgress: allCompleted ? 100 : state.uploadProgress
            };
        }

        case 'FAIL_UPLOAD': {
            return {
                ...state,
                uploadQueue: state.uploadQueue.map(upload =>
                    upload.id === action.payload.id
                        ? { ...upload, status: 'error' as const, error: action.payload.error }
                        : upload
                )
            };
        }

        case 'REMOVE_FROM_UPLOAD_QUEUE': {
            const updatedQueue = state.uploadQueue.filter(upload => upload.id !== action.payload);
            const allCompleted = updatedQueue.every(upload => upload.status === 'completed');

            return {
                ...state,
                uploadQueue: updatedQueue,
                isUploading: !allCompleted && updatedQueue.length > 0
            };
        }

        case 'CLEAR_UPLOAD_QUEUE':
            return { ...state, uploadQueue: [], isUploading: false, uploadProgress: 0 };

        default:
            return state;
    }
};

export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(storageReducer, initialState);

    const selectItem = (item: any) => {
        if (!state.selectedItems.some(selected => selected.id === item.id)) {
            dispatch({ type: 'SET_SELECTED_ITEMS', payload: [...state.selectedItems, item] });
        }
    };

    const deselectItem = (item: any) => {
        dispatch({
            type: 'SET_SELECTED_ITEMS',
            payload: state.selectedItems.filter(selected => selected.id !== item.id)
        });
    };

    const toggleItemSelection = (item: any) => {
        dispatch({ type: 'TOGGLE_ITEM_SELECTION', payload: item });
    };

    const clearSelection = () => {
        dispatch({ type: 'CLEAR_SELECTION' });
    };

    const setViewMode = (mode: 'list' | 'grid') => {
        dispatch({ type: 'SET_VIEW_MODE', payload: mode });
    };

    const setViewType = (type: 'work' | 'personal') => {
        dispatch({ type: 'SET_VIEW_TYPE', payload: type });
    };

    const startUpload = (files: File[]) => {
        dispatch({ type: 'ADD_TO_UPLOAD_QUEUE', payload: files });
    };

    const cancelUpload = (id: string) => {
        dispatch({ type: 'REMOVE_FROM_UPLOAD_QUEUE', payload: id });
    };

    const value: StorageContextType = {
        ...state,
        dispatch,
        selectItem,
        deselectItem,
        toggleItemSelection,
        clearSelection,
        setViewMode,
        setViewType,
        startUpload,
        cancelUpload,
    };

    return (
        <StorageContext.Provider value={value}>
            {children}
        </StorageContext.Provider>
    );
};

export const useStorage = () => {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error('useStorage must be used within a StorageProvider');
    }
    return context;
};