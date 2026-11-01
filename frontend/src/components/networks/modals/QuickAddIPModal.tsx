// src/components/networks/modals/QuickAddIPModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Subnet, SubnetHost, IPStatus } from '../../../types';
import { networksApi } from '../../../api/networksApi';
import { X, Save } from 'lucide-react';
import './Modal.css';

interface Props {
    token: string;
    subnets: Subnet[];
    onSave: (subnetId: string, hostData: Partial<SubnetHost>) => Promise<void> | void;
    onClose: () => void;
}

const STATUS_LABEL: Record<IPStatus, string> = {
    free: 'Свободен',
    reserved: 'Зарезервирован',
    in_use: 'Используется',
    deprecated: 'Устарел',
};

const QuickAddIPModal: React.FC<Props> = ({ token, subnets, onSave, onClose }) => {
    const [subnetId, setSubnetId] = useState<string>(subnets[0]?.id || '');
    const [address, setAddress] = useState('');
    const [status, setStatus] = useState<IPStatus>('in_use');
    const [hostname, setHostname] = useState('');
    const [purpose, setPurpose] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedSubnet = useMemo(
        () => subnets.find(s => s.id === subnetId) || null,
        [subnetId, subnets],
    );

    // Простая проверка: адрес в формате IPv4 и (если выбрана подсеть) в её диапазоне
    const ipValidation = useMemo(() => {
        if (!address) return { ok: false, msg: '' };
        const parts = address.split('.').map(n => parseInt(n, 10));
        if (parts.length !== 4 || parts.some(isNaN) || parts.some(v => v < 0 || v > 255)) {
            return { ok: false, msg: 'Некорректный IPv4' };
        }
        if (!selectedSubnet) return { ok: true, msg: '' };

        const ipNum = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
        const netParts = selectedSubnet.network_address.split('.').map(n => parseInt(n, 10));
        const base = ((netParts[0] << 24) | (netParts[1] << 16) | (netParts[2] << 8) | netParts[3]) >>> 0;
        const mask = selectedSubnet.prefix_length === 0
            ? 0
            : (~0 << (32 - selectedSubnet.prefix_length)) >>> 0;
        const netNum = (base & mask) >>> 0;
        const bcast = (netNum | (~mask >>> 0)) >>> 0;
        const isNetwork = ipNum === netNum;
        const isBroadcast = ipNum === bcast;

        if (ipNum < netNum || ipNum > bcast) {
            return { ok: false, msg: 'Адрес вне подсети' };
        }
        if (selectedSubnet.prefix_length <= 30 && (isNetwork || isBroadcast)) {
            return { ok: false, msg: 'Сетевой/broadcast адрес нельзя назначить' };
        }
        return { ok: true, msg: '' };
    }, [address, selectedSubnet]);

    const isFree = status === 'free';
    const canSubmit = !!subnetId && !!address && ipValidation.ok && !saving;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSaving(true);
        setError(null);
        try {
            await onSave(subnetId, {
                address,
                status,
                hostname: isFree ? '' : hostname,
                purpose: isFree ? '' : purpose,
                assigned_to: isFree ? '' : assignedTo,
            });
        } catch (e: any) {
            const data = e?.response?.data;
            setError(
                data
                    ? typeof data === 'string'
                        ? data
                        : JSON.stringify(data)
                    : 'Ошибка сохранения',
            );
            setSaving(false);
        }
    };

    // Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving) onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose, saving]);

    return createPortal(
        <div className="modal-overlay" onClick={saving ? undefined : onClose}>
            <div
                className="modal"
                style={{ width: 520, maxWidth: '95vw' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Новый IP-адрес</h2>
                    <button className="close-button" onClick={onClose} disabled={saving}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-form">
                    {subnets.length === 0 ? (
                        <div className="error" style={{ margin: 0 }}>
                            Сначала создайте подсеть — IP-адрес должен принадлежать ей.
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Подсеть *</label>
                                <select
                                    value={subnetId}
                                    onChange={e => setSubnetId(e.target.value)}
                                    disabled={saving}
                                >
                                    {subnets.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.cidr} · {s.used_count}/{s.host_count}
                                            {s.purpose ? ` · ${s.purpose}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>IP-адрес *</label>
                                <input
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder={selectedSubnet?.first_host || '192.168.10.10'}
                                    disabled={saving}
                                    autoFocus
                                />
                                {address && !ipValidation.ok && (
                                    <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>
                                        {ipValidation.msg}
                                    </div>
                                )}
                                {selectedSubnet && (
                                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4 }}>
                                        Свободно {selectedSubnet.free_count} из {selectedSubnet.host_count}
                                    </div>
                                )}
                            </div>

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
                                    onChange={e => setHostname(e.target.value)}
                                    placeholder={isFree ? '—' : 'srv-db'}
                                    disabled={isFree || saving}
                                />
                            </div>

                            <div className="form-group">
                                <label>Назначение</label>
                                <input
                                    value={purpose}
                                    onChange={e => setPurpose(e.target.value)}
                                    placeholder={isFree ? '—' : 'Сервер БД'}
                                    disabled={isFree || saving}
                                />
                            </div>

                            <div className="form-group">
                                <label>Кому / чему</label>
                                <input
                                    value={assignedTo}
                                    onChange={e => setAssignedTo(e.target.value)}
                                    placeholder={isFree ? '—' : 'Иванов И.И.'}
                                    disabled={isFree || saving}
                                />
                            </div>

                            {error && <div className="error">{error}</div>}

                            <div className="modal-actions">
                                <button type="button" onClick={onClose} disabled={saving}>
                                    Отмена
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                    {saving ? 'Сохранение…' : <><Save size={15} /> Создать</>}
                                </button>
                            </div>
                        </>
                    )}

                    {subnets.length === 0 && (
                        <div className="modal-actions">
                            <button type="button" onClick={onClose}>Закрыть</button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default QuickAddIPModal;