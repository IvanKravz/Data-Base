import {
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaFilePowerpoint,
    FaFileArchive,
    FaFileAudio,
    FaFileVideo,
    FaFileCode,
    FaFileAlt
} from 'react-icons/fa';

export const useFileIcon = () => {
    const getFileIcon = (file: any, viewMode: 'list' | 'grid') => {
        const type = file.type?.toLowerCase() || '';
        const extension = file.extension?.toLowerCase() || file.name?.toLowerCase()?.split('.').pop() || '';
        const size = viewMode === 'grid' ? 48 : 24;

        if (type.includes('pdf') || extension === 'pdf' || extension === '.pdf') {
            return <FaFilePdf size={size} />;
        }
        if (type.includes('word') || type.includes('document') || 
            extension.match(/^(doc|docx)$/)) {
            return <FaFileWord size={size} />;
        }
        if (type.includes('excel') || type.includes('spreadsheet') || 
            extension.match(/^(xls|xlsx|xlsm)$/)) {
            return <FaFileExcel size={size} />;
        }
        if (type.includes('powerpoint') || type.includes('presentation') || 
            extension.match(/^(ppt|pptx|pps)$/)) {
            return <FaFilePowerpoint size={size} />;
        }
        if (type.includes('zip') || type.includes('archive') || type.includes('compressed') ||
            extension.match(/^(zip|rar|7z|tar|gz|bz2)$/)) {
            return <FaFileArchive size={size} />;
        }
        if (type.startsWith('audio/') || extension.match(/^(mp3|wav|flac|aac|ogg|m4a)$/)) {
            return <FaFileAudio size={size} />;
        }
        if (type.startsWith('video/') || extension.match(/^(mp4|avi|mov|mkv|wmv|flv|webm)$/)) {
            return <FaFileVideo size={size} />;
        }
        if (type.includes('text') || type.includes('code') ||
            extension.match(/^(txt|md|json|xml|js|ts|jsx|tsx|html|css|scss|py|java|cpp|c|cs|php)$/)) {
            return <FaFileCode size={size} />;
        }
        
        return <FaFileAlt size={size} />;
    };

    const getIconColor = (file: any) => {
        const type = file.type?.toLowerCase() || '';
        const extension = file.extension?.toLowerCase() || file.name?.toLowerCase()?.split('.').pop() || '';
        
        if (type.includes('pdf') || extension === 'pdf' || extension === '.pdf') {
            return '#F44336';
        }
        if (type.includes('word') || type.includes('document') || 
            extension.match(/^(doc|docx)$/)) {
            return '#2196F3';
        }
        if (type.includes('excel') || type.includes('spreadsheet') || 
            extension.match(/^(xls|xlsx|xlsm)$/)) {
            return '#2E7D32';
        }
        if (type.includes('powerpoint') || type.includes('presentation') || 
            extension.match(/^(ppt|pptx|pps)$/)) {
            return '#FF9800';
        }
        if (type.includes('archive') || type.includes('compressed') ||
            extension.match(/^(zip|rar|7z|tar|gz|bz2)$/)) {
            return '#795548';
        }
        if (type.startsWith('audio/') || extension.match(/^(mp3|wav|flac|aac|ogg|m4a)$/)) {
            return '#9C27B0';
        }
        if (type.startsWith('video/') || extension.match(/^(mp4|avi|mov|mkv|wmv|flv|webm)$/)) {
            return '#E91E63';
        }
        if (type.includes('text') || type.includes('code') ||
            extension.match(/^(txt|md|json|xml|js|ts|jsx|tsx|html|css|scss|py|java|cpp|c|cs|php)$/)) {
            return '#607D8B';
        }
        
        return '#757575';
    };

    return { getFileIcon, getIconColor };
};