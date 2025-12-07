// components/storage/FileItem/hooks/useFileImage.ts
import { useState, useEffect } from 'react';
import { isImageFile, getImageUrlFromFile } from '../utils/fileUtils';

export const useFileImage = (file: any) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [urlCleanup, setUrlCleanup] = useState<(() => void) | null>(null);

    useEffect(() => {
        const isImage = isImageFile(file);
        
        if (isImage) {
            setImageLoading(true);
            setImageError(false);
            
            const url = getImageUrlFromFile(file);
            
            if (url) {
                setImageUrl(url);
                
                // Если это URL blob (локальный файл), нужно освободить память
                if (url.startsWith('blob:')) {
                    setUrlCleanup(() => () => URL.revokeObjectURL(url));
                } else {
                    setUrlCleanup(null);
                }
            } else {
                setImageLoading(false);
                setImageUrl(null);
                setImageError(true);
            }
        } else {
            // Для не-изображений сразу выключаем загрузку
            setImageLoading(false);
            setImageUrl(null);
            setImageError(false);
        }
        
        return () => {
            if (urlCleanup) {
                urlCleanup();
            }
        };
    }, [file]);

    return { imageUrl, imageLoading, imageError };
};