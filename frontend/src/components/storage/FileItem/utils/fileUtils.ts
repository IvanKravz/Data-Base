// components/storage/FileItem/utils/fileUtils.ts
export const isImageFile = (file: any): boolean => {
    const type = file.type?.toLowerCase() || '';
    const extension = file.extension?.toLowerCase() || file.name?.toLowerCase()?.split('.').pop() || '';
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff'];
    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp'];
    
    return imageMimeTypes.includes(type) || imageExtensions.includes(extension);
};

export const getImageUrlFromFile = (file: any): string | null => {
    // Проверяем наличие URL для превью
    console.log('file', file)
    if (file.preview_url) return file.preview_url;
    if (file.thumbnail_url) return file.thumbnail_url;
    if (file.url) return file.url;
    
    // Для локальных файлов
    if (file.file && file.file instanceof File) {
        return URL.createObjectURL(file.file);
    }
    
    return null;
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getFileType = (file: any): string => {
    const type = file.type?.toLowerCase() || '';
    const extension = file.extension?.toLowerCase() || file.name?.toLowerCase()?.split('.').pop() || '';
    
    if (!type && !extension) return 'unknown';
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', 'mpg', 'mpeg'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'odt'];
    const spreadsheetExtensions = ['xls', 'xlsx', 'csv', 'ods'];
    const presentationExtensions = ['ppt', 'pptx', 'odp'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go'];
    
    if (imageExtensions.includes(extension) || type.startsWith('image/')) return 'image';
    if (videoExtensions.includes(extension) || type.startsWith('video/')) return 'video';
    if (audioExtensions.includes(extension) || type.startsWith('audio/')) return 'audio';
    if (documentExtensions.includes(extension)) return 'document';
    if (spreadsheetExtensions.includes(extension)) return 'spreadsheet';
    if (presentationExtensions.includes(extension)) return 'presentation';
    if (archiveExtensions.includes(extension)) return 'archive';
    if (codeExtensions.includes(extension)) return 'code';
    
    return extension || 'file';
};