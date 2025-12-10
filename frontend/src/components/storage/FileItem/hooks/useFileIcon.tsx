import {
    FaFile,
    FaFileAlt,
    FaFileImage,
    FaFileVideo,
    FaFileAudio,
    FaFileArchive,
    FaFileCode,
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaFilePowerpoint
} from 'react-icons/fa';

export const useFileIcon = () => {
    const getFileIcon = (file: any, viewMode: 'list' | 'grid') => {
        const type = file.type?.toLowerCase() || file.mime_type?.toLowerCase() || '';
        const extension = file.extension?.toLowerCase() || file.name?.toLowerCase()?.split('.').pop() || '';
        const size = viewMode === 'grid' ? 28 : 18;

        console.log('getFileIcon:', { 
            fileType: type, 
            extension, 
            viewMode,
            fileName: file.name 
        });

        // Определяем иконку в зависимости от типа файла
        if (type.includes('pdf') || extension === 'pdf' || file.file_type === 'pdf') {
            return <FaFilePdf size={size} />;
        }
        if (type.includes('word') || type.includes('document') || 
            extension.match(/^(doc|docx)$/) || file.file_type === 'word') {
            return <FaFileWord size={size} />;
        }
        if (type.includes('excel') || type.includes('spreadsheet') || 
            extension.match(/^(xls|xlsx|xlsm)$/) || file.file_type === 'excel') {
            return <FaFileExcel size={size} />;
        }
        if (type.includes('powerpoint') || type.includes('presentation') || 
            extension.match(/^(ppt|pptx|pps)$/) || file.file_type === 'powerpoint') {
            return <FaFilePowerpoint size={size} />;
        }
        if (type.includes('zip') || type.includes('archive') || type.includes('compressed') ||
            extension.match(/^(zip|rar|7z|tar|gz|bz2)$/) || file.file_type === 'archive') {
            return <FaFileArchive size={size} />;
        }
        if (type.startsWith('audio/') || extension.match(/^(mp3|wav|flac|aac|ogg|m4a)$/) || file.file_type === 'audio') {
            return <FaFileAudio size={size} />;
        }
        if (type.startsWith('video/') || extension.match(/^(mp4|avi|mov|mkv|wmv|flv|webm)$/) || file.file_type === 'video') {
            return <FaFileVideo size={size} />;
        }
        if (type.includes('text') || type.includes('code') || type === 'text/plain' ||
            extension.match(/^(txt|md|json|xml|js|ts|jsx|tsx|html|css|scss|py|java|cpp|c|cs|php)$/) || file.file_type === 'code') {
            return <FaFileCode size={size} />;
        }
        if (type.startsWith('image/') || extension.match(/^(jpg|jpeg|png|gif|bmp|svg|webp|ico|tiff|heic)$/) || file.file_type === 'image') {
            return <FaFileImage size={size} />;
        }
        
        return <FaFileAlt size={size} />;
    };

    const getIconColor = (file: any) => {
        const type = file.type?.toLowerCase() || file.mime_type?.toLowerCase() || '';
        const extension = file.extension?.toLowerCase() || file.name?.toLowerCase()?.split('.').pop() || '';
        
        // Цвета для разных типов файлов
        if (type.includes('pdf') || extension === 'pdf' || file.file_type === 'pdf') {
            return '#e74c3c'; // Красный
        }
        if (type.includes('word') || type.includes('document') || 
            extension.match(/^(doc|docx)$/) || file.file_type === 'word') {
            return '#2c6ab8'; // Синий
        }
        if (type.includes('excel') || type.includes('spreadsheet') || 
            extension.match(/^(xls|xlsx|xlsm)$/) || file.file_type === 'excel') {
            return '#27ae60'; // Зеленый
        }
        if (type.includes('powerpoint') || type.includes('presentation') || 
            extension.match(/^(ppt|pptx|pps)$/) || file.file_type === 'powerpoint') {
            return '#e67e22'; // Оранжевый
        }
        if (type.includes('archive') || type.includes('compressed') ||
            extension.match(/^(zip|rar|7z|tar|gz|bz2)$/) || file.file_type === 'archive') {
            return '#f1c40f'; // Желтый
        }
        if (type.startsWith('audio/') || extension.match(/^(mp3|wav|flac|aac|ogg|m4a)$/) || file.file_type === 'audio') {
            return '#9b59b6'; // Фиолетовый
        }
        if (type.startsWith('video/') || extension.match(/^(mp4|avi|mov|mkv|wmv|flv|webm)$/) || file.file_type === 'video') {
            return '#e74c3c'; // Красный
        }
        if (type.startsWith('image/') || extension.match(/^(jpg|jpeg|png|gif|bmp|svg|webp|ico|tiff|heic)$/) || file.file_type === 'image') {
            return '#3498db'; // Голубой
        }
        if (type.includes('text') || type.includes('code') || type === 'text/plain' ||
            extension.match(/^(txt|md|json|xml|js|ts|jsx|tsx|html|css|scss|py|java|cpp|c|cs|php)$/) || file.file_type === 'code') {
            return '#34495e'; // Темно-синий
        }
        
        return '#7f8c8d'; // Серый по умолчанию
    };

    return { getFileIcon, getIconColor };
};