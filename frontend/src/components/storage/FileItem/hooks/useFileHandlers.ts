// components/storage/FileItem/hooks/useFileHandlers.ts
import React from 'react';
import { isImageFile } from '../utils/fileUtils';

interface UseFileHandlersProps {
    file: any;
    imageUrl?: string | null;
    onClick: () => void;
    onDownload: () => void;
    onContextMenu?: (e: React.MouseEvent, file: any) => void;
    setContextMenuPosition: (pos: { x: number; y: number }) => void;
    setShowContextMenu: (show: boolean) => void;
}

// Создаем статический элемент для скачивания
let staticDownloadLink: HTMLAnchorElement | null = null;

export const useFileHandlers = ({
    file,
    imageUrl = null,
    onClick,
    onDownload,
    onContextMenu,
    setContextMenuPosition,
    setShowContextMenu
}: UseFileHandlersProps) => {
    
    // Инициализация статического элемента
    if (!staticDownloadLink && typeof document !== 'undefined') {
        staticDownloadLink = document.createElement('a');
        staticDownloadLink.style.cssText = `
            position: fixed !important;
            left: -9999px !important;
            top: -9999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
            width: 1px !important;
            height: 1px !important;
            overflow: hidden !important;
        `;
        staticDownloadLink.setAttribute('aria-hidden', 'true');
        staticDownloadLink.setAttribute('tabindex', '-1');
        document.body.appendChild(staticDownloadLink);
    }

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
        e.preventDefault();
        e.stopPropagation();

        // Сначала вызываем переданный обработчик (если есть)
        if (onDownload) {
            onDownload();
            return;
        }

        // Определяем URL для скачивания
        const downloadUrl = file.download_endpoint || file.download_url || file.file;
        const fileName = file.name || file.original_name || 'file';
        const isImage = isImageFile(file);

        if (!downloadUrl) {
            console.warn('No download URL available for file:', file.name);
            return;
        }

        try {
            
            if (isImage) {
                // Для изображений используем специальную функцию
                await downloadImage(downloadUrl, fileName);
            } else {
                // Для остальных файлов используем простую ссылку
                downloadFile(downloadUrl, fileName);
            }

            // Увеличиваем счетчик скачиваний локально
            if (file.download_count !== undefined) {
                file.download_count = (file.download_count || 0) + 1;
            }

        } catch (error) {
            console.error('Error downloading file:', error);
            // В случае ошибки показываем сообщение
            alert(`Не удалось скачать файл: ${file.name}\nПопробуйте открыть ссылку напрямую.`);
        }
    };

    const downloadFile = (url: string, fileName: string) => {
        // Используем статическую ссылку, если она доступна
        if (staticDownloadLink) {
            try {
                staticDownloadLink.href = url;
                staticDownloadLink.download = fileName;
                staticDownloadLink.setAttribute('download', fileName);
                staticDownloadLink.rel = 'noopener noreferrer';
                staticDownloadLink.target = '_self'; // Важно: не '_blank'
                
                // Создаем синтетическое событие клика
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: false
                });
                
                // Даем время браузеру обработать изменения
                setTimeout(() => {
                    staticDownloadLink?.dispatchEvent(clickEvent);
                }, 50);
                
            } catch (error) {
                console.error('Static link download failed:', error);
                // Fallback: создаем новую ссылку
                createAndClickLink(url, fileName);
            }
        } else {
            // Fallback: создаем новую ссылку
            createAndClickLink(url, fileName);
        }
    };

    const createAndClickLink = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.setAttribute('download', fileName);
        link.rel = 'noopener noreferrer';
        link.target = '_self'; // Важно: не '_blank'
        link.style.cssText = `
            position: fixed !important;
            left: -9999px !important;
            top: -9999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
        `;
        
        document.body.appendChild(link);
        
        // Используем requestAnimationFrame для правильного времени
        requestAnimationFrame(() => {
            try {
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: false
                });
                link.dispatchEvent(clickEvent);
            } catch (error) {
                console.error('Link click failed:', error);
                // Последний fallback: используем location.href
                window.location.href = url;
            }
            
            // Удаляем элемент через некоторое время
            setTimeout(() => {
                if (link.parentNode) {
                    document.body.removeChild(link);
                }
            }, 5000);
        });
    };

    const downloadImage = async (url: string, fileName: string) => {
        try {
            // Пытаемся использовать fetch для скачивания изображения
            const response = await fetch(url, {
                cache: 'no-cache',
                mode: 'cors',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            // Создаем ссылку для скачивания blob
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
                try {
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: false
                    });
                    link.dispatchEvent(clickEvent);
                } catch (error) {
                    console.error('Blob link click failed:', error);
                    // Fallback для blob
                    window.open(blobUrl, '_blank');
                }
                
                // Удаляем элемент и освобождаем blob URL через некоторое время
                setTimeout(() => {
                    if (link.parentNode) {
                        document.body.removeChild(link);
                    }
                    window.URL.revokeObjectURL(blobUrl);
                }, 5000);
            });

        } catch (error) {
            console.error('Fetch download failed:', error);
            // Если fetch не удался, используем обычное скачивание
            downloadFile(url, fileName);
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