// components/storage/FileItem/hooks/useFileHandlers.ts
import React from 'react';
import { isImageFile } from '../utils/fileUtils';
import { storageApi } from '../../../../api/storage';

interface UseFileHandlersProps {
    file: any;
    imageUrl?: string | null;
    onClick: () => void;
    onDownload: () => void;
    onContextMenu?: (e: React.MouseEvent, file: any) => void;
    setContextMenuPosition: (pos: { x: number; y: number }) => void;
    setShowContextMenu: (show: boolean) => void;
}

export const useFileHandlers = ({
    file,
    imageUrl = null,
    onClick,
    onDownload,
    onContextMenu,
    setContextMenuPosition,
    setShowContextMenu
}: UseFileHandlersProps) => {

    const handleFileClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Если файл - изображение, открываем его (предпросмотр)
        if (isImageFile(file) && imageUrl) {
            window.open(imageUrl, '_blank');
        } else if (file.file || file.download_url) {
            // Для других файлов открываем URL (если нужно просто открыть, а не скачать)
            window.open(file.file || file.download_url, '_blank');
        } else if (onClick) {
            onClick();
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (onDownload) {
            onDownload();
            return;
        }

        // Если есть ID файла – используем API
        if (file.id) {
            try {
                const blob = await storageApi.downloadFile(file.id);
                const blobUrl = window.URL.createObjectURL(blob);
                const fileName = file.name || file.original_name || 'file';

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                link.style.cssText = `
                    position: fixed !important;
                    left: -9999px !important;
                    top: -9999px !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    visibility: hidden !important;
                `;
                document.body.appendChild(link);

                requestAnimationFrame(() => {
                    link.click();
                    setTimeout(() => {
                        if (link.parentNode) document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                    }, 5000);
                });

                // Увеличиваем счётчик локально
                if (file.download_count !== undefined) {
                    file.download_count = (file.download_count || 0) + 1;
                }
            } catch (error) {
                console.error('Error downloading file via API:', error);
                alert(`Не удалось скачать файл: ${file.name}\nПопробуйте позже.`);
            }
            return;
        }

        // Fallback на прямую ссылку (если нет id)
        const downloadUrl = file.download_endpoint || file.download_url || file.file;
        const fileName = file.name || file.original_name || 'file';

        if (!downloadUrl) {
            console.warn('No download URL available for file:', file.name);
            return;
        }

        try {
            // Пробуем скачать через fetch с токеном (как запасной вариант)
            await downloadWithFetch(downloadUrl, fileName);
            if (file.download_count !== undefined) {
                file.download_count = (file.download_count || 0) + 1;
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            alert(`Не удалось скачать файл: ${file.name}\nПопробуйте открыть ссылку напрямую.`);
        }
    };

    // Вспомогательная функция для скачивания через fetch (оставлена как fallback)
    const downloadWithFetch = async (url: string, fileName: string) => {
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            cache: 'no-cache',
            mode: 'cors',
            credentials: 'include',
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.cssText = `
            position: fixed !important;
            left: -9999px !important;
            top: -9999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
        `;
        document.body.appendChild(link);

        requestAnimationFrame(() => {
            link.click();
            setTimeout(() => {
                if (link.parentNode) document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }, 5000);
        });
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