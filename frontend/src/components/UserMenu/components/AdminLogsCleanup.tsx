// components/AdminLogsCleanup.tsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import '../styles/AdminLogsCleanup.css';
import { logsApi } from '../../../api/logs';

interface ModuleChoice {
    value: string;
    label: string;
}

const PERIODS = [
    { value: '1d', label: '1 день' },
    { value: '3d', label: '3 дня' },
    { value: '1w', label: 'Неделя' },
    { value: '1m', label: '1 месяц' },
    { value: '3m', label: '3 месяца' },
    { value: '6m', label: 'Полгода' },
    { value: '1y', label: 'Год' },
] as const;

interface AdminLogsCleanupProps {
    userId?: number;
}

export const AdminLogsCleanup: React.FC<AdminLogsCleanupProps> = ({ userId }) => {
    const [modules, setModules] = useState<ModuleChoice[]>([]);
    const [selectedModule, setSelectedModule] = useState<string>('');
    const [selectedPeriod, setSelectedPeriod] = useState<typeof PERIODS[number]['value']>('1m');
    const [isDeleting, setIsDeleting] = useState(false);
    const [result, setResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        logsApi.getChoices().then(data => {
            const allModulesOption = { value: 'all', label: 'Все модули' };
            const modulesWithAll = [allModulesOption, ...data.modules];
            setModules(modulesWithAll);
            setSelectedModule(modulesWithAll[0].value);
        });
    }, []);

    const handleDelete = async () => {
        if (!selectedModule) {
            setResult({ message: 'Выберите модуль', type: 'error' });
            return;
        }

        const moduleLabel = modules.find(m => m.value === selectedModule)?.label || selectedModule;
        const periodLabel = PERIODS.find(p => p.value === selectedPeriod)?.label;

        const confirmed = window.confirm(
            `Вы уверены, что хотите удалить логи ${moduleLabel === 'Все модули' ? 'ВСЕХ МОДУЛЕЙ' : `модуля "${moduleLabel}"`} за последний ${periodLabel}?`
        );
        if (!confirmed) return;

        setIsDeleting(true);
        setResult(null);

        try {
            const response = await logsApi.bulkDeleteLogs({
                module: selectedModule,
                period: selectedPeriod,
                user_id: userId,
            });
            setResult({ message: response.message, type: 'success' });
        } catch (error: any) {
            const detail = error.response?.data?.error || 'Ошибка при удалении';
            setResult({ message: detail, type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="admin-logs-cleanup">
            <div className="admin-logs-cleanup__hint">
                <AlertCircle size={16} />
                <span>
                    {userId 
                        ? 'Удаление записей этого пользователя необратимо.' 
                        : 'Удаление записей необратимо. Доступно только администраторам.'}
                </span>
            </div>

            <div className="admin-logs-cleanup__field">
                <label>Модуль</label>
                <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    disabled={isDeleting}
                >
                    {modules.map((m) => (
                        <option key={m.value} value={m.value}>
                            {m.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="admin-logs-cleanup__field">
                <label>Период</label>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as typeof PERIODS[number]['value'])}
                    disabled={isDeleting}
                >
                    {PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
            </div>

            <button
                className="admin-logs-cleanup__button"
                onClick={handleDelete}
                disabled={isDeleting || !selectedModule}
            >
                <Trash2 size={18} />
                {isDeleting ? 'Удаление...' : 'Удалить логи'}
            </button>

            {result && (
                <div className={`admin-logs-cleanup__result admin-logs-cleanup__result--${result.type}`}>
                    {result.message}
                </div>
            )}
        </div>
    );
};