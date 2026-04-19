// components/DatabaseBackup.tsx
import React, { useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import './DatabaseBackup.css';
import { backupApi } from '../../../api/users';

export const DatabaseBackup: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async () => {
        const confirmed = window.confirm(
            'Создать резервную копию всей базы данных?\n' +
            'Файл может быть большим, операция займёт некоторое время.'
        );
        if (!confirmed) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await backupApi.downloadBackup();
            // Создаём ссылку для скачивания
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            // Имя файла из заголовка Content-Disposition или генерируем сами
            const contentDisposition = response.headers['content-disposition'];
            let filename = `backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match?.[1]) filename = match[1];
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Ошибка при создании резервной копии');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="database-backup">
            <p className="database-backup__hint">
                <AlertCircle size={16} />
                Создание резервной копии всех данных (кроме логов и сессий).
                Файл будет сохранён в формате JSON.
            </p>
            <button
                className="database-backup__button"
                onClick={handleDownload}
                disabled={isLoading}
            >
                <Download size={18} />
                {isLoading ? 'Создание...' : 'Скачать резервную копию'}
            </button>
            {error && <div className="database-backup__error">{error}</div>}
        </div>
    );
};