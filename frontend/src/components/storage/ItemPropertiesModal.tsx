// components/storage/ItemPropertiesModal.tsx
import React from 'react';
import { StorageFile, StorageFolder } from '../../api/storage';
import './styles/ItemPropertiesModal.css';

interface ItemPropertiesModalProps {
    item: StorageFile | StorageFolder;
    onClose: () => void;
}

const ItemPropertiesModal: React.FC<ItemPropertiesModalProps> = ({ item, onClose }) => {
    const isFile = 'file_type' in item;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="ipm-overlay" onClick={onClose}>
            <div className="ipm-container" onClick={e => e.stopPropagation()}>
                <div className="ipm-header">
                    <h3>
                        <i className={`fas ${isFile ? 'fa-file' : 'fa-folder'}`}></i>
                        Свойства {isFile ? 'файла' : 'папки'}
                    </h3>
                    <button className="ipm-close" onClick={onClose}>×</button>
                </div>
                <div className="ipm-body">
                    <table className="ipm-table">
                        <tbody>
                            <tr>
                                <td>Название:</td>
                                <td>{item.name}</td>
                            </tr>
                            {isFile ? (
                                <>
                                    <tr>
                                        <td>Тип:</td>
                                        <td>{(item as StorageFile).mime_type || 'Неизвестный'}</td>
                                    </tr>
                                    <tr>
                                        <td>Размер:</td>
                                        <td>
                                            {(item as StorageFile).human_readable_size ||
                                                formatBytes((item as StorageFile).size)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Расширение:</td>
                                        <td>{(item as StorageFile).extension}</td>
                                    </tr>
                                    <tr>
                                        <td>Загрузил:</td>
                                        <td>
                                            {(item as StorageFile).uploaded_by?.username ||
                                                (item as StorageFile).uploaded_by?.email ||
                                                '—'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Скачиваний:</td>
                                        <td>{(item as StorageFile).download_count}</td>
                                    </tr>
                                    { (item as StorageFile).last_downloaded && (
                                        <tr>
                                            <td>Последнее скачивание:</td>
                                            <td>{formatDate((item as StorageFile).last_downloaded!)}</td>
                                        </tr>
                                    )}
                                </>
                            ) : (
                                <>
                                    <tr>
                                        <td>Тип папки:</td>
                                        <td>
                                            {(item as StorageFolder).folder_type === 'personal'
                                                ? 'Личная'
                                                : 'Рабочая'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Содержит файлов:</td>
                                        <td>{(item as StorageFolder).files_count}</td>
                                    </tr>
                                    <tr>
                                        <td>Содержит подпапок:</td>
                                        <td>{(item as StorageFolder).subfolders_count}</td>
                                    </tr>
                                    <tr>
                                        <td>Общий размер:</td>
                                        <td>{formatBytes((item as StorageFolder).total_size)}</td>
                                    </tr>
                                    <tr>
                                        <td>Создал:</td>
                                        <td>
                                            {(item as StorageFolder).created_by?.username ||
                                                (item as StorageFolder).created_by?.email ||
                                                '—'}
                                        </td>
                                    </tr>
                                </>
                            )}
                            <tr>
                                <td>Создан:</td>
                                <td>{formatDate(item.created_at)}</td>
                            </tr>
                            <tr>
                                <td>Изменён:</td>
                                <td>{formatDate(item.updated_at)}</td>
                            </tr>
                            {!isFile && (item as StorageFolder).parent_name && (
                                <tr>
                                    <td>Родительская папка:</td>
                                    <td>{(item as StorageFolder).parent_name}</td>
                                </tr>
                            )}
                            {isFile && (item as StorageFile).folder_name && (
                                <tr>
                                    <td>Папка:</td>
                                    <td>{(item as StorageFile).folder_name}</td>
                                </tr>
                            )}
                            <tr>
                                <td>Закреплено:</td>
                                <td>{item.is_pinned ? 'Да' : 'Нет'}</td>
                            </tr>
                            {isFile && (
                                <tr>
                                    <td>В избранном:</td>
                                    <td>{(item as StorageFile).is_favorited ? 'Да' : 'Нет'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="ipm-footer">
                    <button className="ipm-button ipm-button--primary" onClick={onClose}>
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemPropertiesModal;