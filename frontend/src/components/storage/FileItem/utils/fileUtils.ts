// components/storage/FileItem/utils/fileUtils.ts
export const isImageFile = (file: any): boolean => {
    const type = file.type?.toLowerCase() || '';
    const name = file.name?.toLowerCase() || '';
    
    // Проверяем MIME-типы изображений
    const imageMimeTypes = [
        'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp',
        'image/webp', 'image/svg+xml', 'image/tiff', 'image/x-icon'
    ];
    
    // Проверяем расширения файлов
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'];
    
    // Проверяем по MIME-типу
    if (type && imageMimeTypes.some(mime => type.startsWith('image/'))) {
        return true;
    }
    
    // Проверяем по расширению файла
    if (name && imageExtensions.some(ext => name.endsWith(ext))) {
        return true;
    }
    
    return false;
};

export const getImageUrlFromFile = (file: any): string | null => {
    // Если это локальный файл (объект File из input)
    if (file instanceof File || file.file instanceof File) {
        const fileObj = file instanceof File ? file : file.file;
        return URL.createObjectURL(fileObj);
    }
    
    // Если есть URL превью
    if (file.preview_url) {
        return file.preview_url;
    }
    
    // Если есть прямой URL
    if (file.url) {
        return file.url;
    }
    
    // Если есть thumbnail_url
    if (file.thumbnail_url) {
        return file.thumbnail_url;
    }
    
    // Если есть blob URL
    if (file.blob_url) {
        return file.blob_url;
    }
    
    // Проверяем стандартные пути Django/Flask
    if (file.file) {
        return file.file;
    }
    
    // Проверяем стандартный медиа URL
    if (file.media_url) {
        return file.media_url;
    }
    
    return null;
};

export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (file: any): string => {
    const extension = file.extension || file.name?.split('.').pop() || '';
    return extension.toUpperCase();
};