// src/components/networks/management/SubnetIPEditModal/SubnetIPEditModal.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SubnetHost, IPStatus } from '../../../../types';
import { Save, X } from 'lucide-react';
import '../../modals/Modal.css';
import './SubnetIPEditModal.css';

interface Props {
    host: SubnetHost;
    /** Должен бросить исключение при ошибке. Родитель закроет модалку сам при успехе. */
    onSave: (patch: Partial<SubnetHost>) => Promise<void>;
    onClose: () => void;
}

const STATUS_LABEL: Record<IPStatus, string> = {
    free: 'Свободен',
    reserved: 'Зарезервирован',
    in_use: 'Используется',
    deprecated: 'Устарел',
};

const SubnetIPEditModal: React.FC<Props> = ({ host, onSave, onClose }) => {
    // Для свободного адреса по умолчанию предлагаем «Используется» —
    // клик по свободной клетке почти всегда означает «занять»
    const [status, setStatus] = useState<IPStatus>(
        host.status === 'free' ? 'in_use' : host.status,
    );
    const [hostname, setHostname] = useState(host.hostname);
    const [purpose, setPurpose] = useState(host.purpose);
    const [assignedTo, setAssignedTo] = useState(host.assigned_to);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Escape — закрыть (только если не в процессе сохранения)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving) onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose, saving]);

    const isFree = status === 'free';

    const handleApply = async () => {
        setSaving(true);
        setError(null);
        try {
            await onSave({
                status,
                hostname: isFree ? '' : hostname,
                purpose: isFree ? '' : purpose,
                assigned_to: isFree ? '' : assignedTo,
            });
            // Закрытие делает родитель после успешного сохранения
        } catch (e: any) {
            const data = e?.response?.data;
            setError(
                data
                    ? typeof data === 'string'
                        ? data
                        : typeof data === 'object'
                            ? JSON.stringify(data)
                            : 'Ошибка сохранения'
                    : 'Ошибка сохранения',
            );
            setSaving(false);
        }
    };

    return createPortal(
        <div className="modal-overlay" onClick={saving ? undefined : onClose}>
            <div
                className="modal sim"
                style={{ width: 500, maxWidth: '95vw' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>
                        Редактировать <code className="sim-ip">{host.address}</code>
                    </h2>
                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                        disabled={saving}
                        title="Закрыть"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-form">
                    <div className="form-group">
                        <label>Статус</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as IPStatus)}
                            disabled={saving}
                        >
                            {(Object.keys(STATUS_LABEL) as IPStatus[]).map(s => (
                                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Hostname</label>
                        <input
                            value={hostname}
                            disabled={isFree || saving}
                            onChange={e => setHostname(e.target.value)}
                            placeholder={isFree ? '—' : 'srv-db'}
                            autoFocus={!isFree}
                        />
                    </div>

                    <div className="form-group">
                        <label>Назначение</label>
                        <input
                            value={purpose}
                            disabled={isFree || saving}
                            onChange={e => setPurpose(e.target.value)}
                            placeholder={isFree ? '—' : 'Сервер БД'}
                        />
                    </div>

                    <div className="form-group">
                        <label>Кому / чему назначен</label>
                        <input
                            value={assignedTo}
                            disabled={isFree || saving}
                            onChange={e => setAssignedTo(e.target.value)}
                            placeholder={isFree ? '—' : 'Иванов И.И.'}
                        />
                    </div>

                    {host.interface_name && (
                        <div className="sim-interface">
                            <span className="sim-interface-label">Интерфейс:</span>
                            <span>{host.equipment_name} / {host.interface_name}</span>
                        </div>
                    )}

                    {error && <div className="error">{error}</div>}

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="sim-btn-apply"
                            onClick={handleApply}
                            disabled={saving}
                        >
                            {saving ? (
                                'Сохранение…'
                            ) : (
                                <>
                                    <Save size={15} /> Применить
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default SubnetIPEditModal;