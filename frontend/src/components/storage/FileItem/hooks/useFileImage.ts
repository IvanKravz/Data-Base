// components/storage/FileItem/hooks/useFileImage.ts
import { useState, useEffect } from 'react';
import { isImageFile } from '../utils/fileUtils';

export const useFileImage = (file: any) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const isImage = isImageFile(file);
        
        console.log('useFileImage - File:', {
            name: file.name,
            isImage,
            file_type: file.file_type,
            mime_type: file.mime_type,
            extension: file.extension,
            file: file.file,
            preview_url: file.preview_url,
            thumbnail_url: file.thumbnail_url,
            url: file.url
        });
        
        if (!isImage) {
            console.log('Not an image file, skipping preview');
            setImageLoading(false);
            setImageUrl(null);
            setImageError(false);
            return;
        }

        // Получаем URL изображения - проверяем все возможные источники
        let url = null;
        
        if (file.preview_url) {
            url = file.preview_url;
        } else if (file.thumbnail_url) {
            url = file.thumbnail_url;
        } else if (file.url) {
            url = file.url;
        } else if (file.file) {
            // file.file может быть строкой URL или объектом File
            if (typeof file.file === 'string') {
                url = file.file;
            } else if (file.file instanceof File) {
                url = URL.createObjectURL(file.file);
            }
        }

        console.log('Image URL found:', url);

        if (url) {
            setImageLoading(true);
            setImageError(false);
            
            const img = new Image();
            img.src = url;
            
            img.onload = () => {
                console.log('Image loaded successfully:', url);
                setImageLoading(false);
                setImageUrl(url);
                setImageError(false);
            };
            
            img.onerror = () => {
                console.log('Image failed to load:', url);
                setImageLoading(false);
                setImageUrl(null);
                setImageError(true);
            };
        } else {
            console.log('No image URL available');
            setImageLoading(false);
            setImageUrl(null);
            setImageError(true);
        }

        // Cleanup function
        return () => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        };
    }, [file]);

    return { imageUrl, imageLoading, imageError };
};