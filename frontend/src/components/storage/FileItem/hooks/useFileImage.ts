// components/storage/FileItem/hooks/useFileImage.ts
import { useState, useEffect } from 'react';
import { isImageFile } from '../utils/fileUtils';

export const useFileImage = (file: any) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const isImage = isImageFile(file);
      
        if (!isImage) {
          setImageLoading(false);
          setImageUrl(null);
          setImageError(false);
          return;
        }
      
        // Получаем URL изображения
        let url = file.preview_url || file.thumbnail_url || file.url;
        if (!url && typeof file.file === 'string') {
          url = file.file;
        }
      
        if (url) {
          setImageLoading(true);
          setImageError(false);
      
          const fetchImage = async () => {
            try {
              const token = localStorage.getItem('access_token');
              const headers: HeadersInit = {};
              if (token) {
                headers['Authorization'] = `Bearer ${token}`;
              }
      
              const response = await fetch(url, { headers, credentials: 'include' });
              if (!response.ok) throw new Error('Failed to load image');
      
              const blob = await response.blob();
              const objectUrl = URL.createObjectURL(blob);
              setImageUrl(objectUrl);
              setImageLoading(false);
            } catch (error) {
              setImageError(true);
              setImageLoading(false);
              setImageUrl(null);
            }
          };
      
          fetchImage();
      
          return () => {
            if (imageUrl?.startsWith('blob:')) {
              URL.revokeObjectURL(imageUrl);
            }
          };
        } else {
          setImageLoading(false);
          setImageUrl(null);
          setImageError(true);
        }
      }, [file]);

    return { imageUrl, imageLoading, imageError };
};