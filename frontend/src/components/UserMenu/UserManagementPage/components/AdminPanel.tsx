// components/AdminPanel.tsx
import React from 'react';
import { Trash2, Database, Upload, Shield } from 'lucide-react';
import '../../styles/AdminPanel.css';
import { AdminLogsCleanup } from '../../components/AdminLogsCleanup';
import { DatabaseBackup } from '../../DatabaseBackup/DatabaseBackup';
import { DatabaseRestore } from '../../DatabaseBackup/DatabaseRestore';

export const AdminPanel: React.FC = () => {
    return (
        <div className="admin-panel">
            <div className="admin-panel__header">
                <Shield size={24} />
                <div className="admin-panel__header-title">
                    <h3>Панель администратора</h3>
                    <p>Управление системными данными и резервными копиями</p>
                </div>
            </div>

            <div className="admin-panel__grid">
                <div className="admin-card">
                    <div className="admin-card__header">
                        <Trash2 size={20} />
                        <h4>Очистка журнала действий</h4>
                    </div>
                    <div className="admin-card__body">
                        <AdminLogsCleanup />
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card__header">
                        <Database size={20} />
                        <h4>Экспорт данных</h4>
                    </div>
                    <div className="admin-card__body">
                        <DatabaseBackup />
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card__header">
                        <Upload size={20} />
                        <h4>Импорт данных</h4>
                    </div>
                    <div className="admin-card__body">
                        <DatabaseRestore />
                    </div>
                </div>
            </div>
        </div>
    );
};