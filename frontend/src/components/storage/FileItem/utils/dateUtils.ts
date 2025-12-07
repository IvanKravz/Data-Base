// components/storage/FileItem/utils/dateUtils.ts
export const formatDate = (dateString: string): string => {
    if (!dateString) return 'Неизвестно';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'Неизвестно';
    }
};