// components/DatabaseRestore.tsx
import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { backupApi } from '../../../api/users';
import './DatabaseRestore.css';

export const DatabaseRestore: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setSuccess(null);
        }
    };

    const handleRestore = async () => {
        if (!file) {
            setError('Выберите файл резервной копии');
            return;
        }

        const confirmed = window.confirm(
            '⚠️ ВНИМАНИЕ! Восстановление базы данных из резервной копии ЗАМЕНИТ существующие записи с совпадающими ID.\n' +
            'Записи, которых нет в бэкапе, останутся без изменений.\n' +
            'Рекомендуется предварительно создать резервную копию текущего состояния.\n\n' +
            'Продолжить?'
        );
        if (!confirmed) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Второй параметр false – не очищать перед загрузкой (опасно)
            const response = await backupApi.restoreBackup(file, false);
            setSuccess(response.data.message || 'База данных успешно восстановлена');
            setFile(null);
            // Сбросить input
            const fileInput = document.getElementById('restore-file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err: any) {
            const detail = err.response?.data?.error || 'Ошибка при восстановлении';
            setError(detail);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="database-restore">
            <p className="database-restore__hint">
                <AlertCircle size={16} />
                Загрузите ранее сохранённый JSON-файл резервной копии.
                Восстановление перезапишет существующие записи с теми же ID, но не удалит лишние данные.
            </p>

            <div className="database-restore__form">
                <label className="database-restore__file-label">
                    <input
                        id="restore-file-input"
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        disabled={isLoading}
                        className="database-restore__file-input"
                    />
                    <span className="database-restore__file-button">
                        <Upload size={18} />
                        Выбрать файл
                    </span>
                    {file && <span className="database-restore__file-name">{file.name}</span>}
                </label>

                <button
                    className="database-restore__restore-btn"
                    onClick={handleRestore}
                    disabled={isLoading || !file}
                >
                    {isLoading ? 'Восстановление...' : 'Восстановить базу данных'}
                </button>

                {error && <div className="database-restore__error">{error}</div>}
                {success && <div className="database-restore__success">{success}</div>}
            </div>
        </div>
    );
};