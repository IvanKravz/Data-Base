// components/storage/FileItem/hooks/useFileHandlers.ts
import React from 'react';
import { isImageFile } from '../utils/fileUtils';

interface UseFileHandlersProps {
    file: any;
    imageUrl: string | null;
    onClick: () => void;
    onDownload: () => void;
    onContextMenu?: (e: React.MouseEvent, file: any) => void;
    setContextMenuPosition: (pos: { x: number; y: number }) => void;
    setShowContextMenu: (show: boolean) => void;
}

export const useFileHandlers = ({
    file,
    imageUrl,
    onClick,
    onDownload,
    onContextMenu,
    setContextMenuPosition,
    setShowContextMenu
}: UseFileHandlersProps) => {
    const handleFileClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Если файл - изображение, открываем его
        if (isImageFile(file) && imageUrl) {
            window.open(imageUrl, '_blank');
        } else if (file.file || file.download_url) {
            // Для других файлов открываем URL
            window.open(file.file || file.download_url, '_blank');
        } else if (onClick) {
            // Или вызываем переданный обработчик
            onClick();
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('Download clicked for file:', file.name);
        console.log('File ID:', file.id);
        console.log('File MIME type:', file.mime_type);

        // Сначала вызываем переданный обработчик (если есть)
        if (onDownload) {
            console.log('Calling onDownload callback');
            onDownload();
            return;
        }

        // Определяем URL для скачивания
        // Приоритет: download_endpoint > download_url > file
        const downloadUrl = file.download_endpoint || file.download_url || file.file;
        const fileName = file.name || file.original_name || 'file';
        const isImage = isImageFile(file);

        if (downloadUrl) {
            try {
                console.log('Downloading from URL:', downloadUrl);
                
                if (downloadUrl.includes('/download/')) {
                    // Если это эндпоинт скачивания API, просто открываем его
                    window.open(downloadUrl, '_blank');
                    
                    // Увеличиваем счетчик скачиваний локально
                    if (file.download_count !== undefined) {
                        file.download_count = (file.download_count || 0) + 1;
                    }
                } else if (isImage) {
                    // Для изображений через прямые ссылки используем fetch
                    await downloadImage(downloadUrl, fileName);
                } else {
                    // Для других файлов используем стандартный метод
                    downloadFile(downloadUrl, fileName);
                }

            } catch (error) {
                console.error('Error downloading file:', error);
                
                // Альтернативный способ: открыть в новой вкладке
                window.open(downloadUrl, '_blank');
            }
        } else {
            console.warn('No download URL available for file:', file.name);
        }
    };

    // Функция для скачивания файлов (не изображений)
    const downloadFile = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.setAttribute('download', fileName);
        link.rel = 'noopener noreferrer';
        link.target = '_blank';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Функция для скачивания изображений через fetch
    const downloadImage = async (url: string, fileName: string) => {
        try {
            const response = await fetch(url, {
                cache: 'no-cache',
                mode: 'cors',
                credentials: 'include'  // Для передачи куки аутентификации
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.setAttribute('download', fileName);

            document.body.appendChild(link);
            link.click();

            // Очистка после скачивания
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }, 100);

            return true;
        } catch (error) {
            console.error('Fetch download failed:', error);
            
            // Попробуем просто открыть ссылку
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.setAttribute('download', fileName);
            link.target = '_blank';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return false;
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);

        if (onContextMenu) {
            onContextMenu(e, file);
        }
    };

    return {
        handleFileClick,
        handleDownload,
        handleContextMenu
    };
};