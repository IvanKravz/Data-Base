// src/components/networks/management/SubnetWizard/SubnetWizard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    CommunicationNetwork,
    VLAN,
    AvailableSlot,
    AvailableSlotsResponse,
} from '../../../../types';
import { networksApi } from '../../../../api/networksApi';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import '../../modals/Modal.css';
import './SubnetWizard.css';

interface Props {
    token: string;
    networkId?: string;
    onSaved: (createdId?: string) => void;
    onClose: () => void;
}

type Step = 1 | 2 | 3;

const PREFIX_PRESETS = [24, 25, 26, 27, 28, 29, 30, 31];

const PURPOSE_HINTS = [
    'Пользовательская',
    'Серверная',
    'DMZ',
    'CCTV',
    'VoIP',
    'Гостевая',
    'Управление',
];

/** Кол-во хостов для префикса */
function hostsFor(prefix: number): number {
    if (prefix === 31) return 2;
    if (prefix === 32) return 1;
    return Math.max(Math.pow(2, 32 - prefix) - 2, 0);
}

/** Разбор IPv4 → число */
function ipToNumber(ip: string): number | null {
    const parts = ip.split('.').map(n => parseInt(n, 10));
    if (parts.length !== 4 || parts.some(isNaN)) return null;
    const [a, b, c, d] = parts;
    if ([a, b, c, d].some(v => v < 0 || v > 255)) return null;
    return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
}

function numberToIp(n: number): string {
    return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

/** Валидация + расчёт сети/broadcast/hosts */
function calcPreview(address: string, prefix: number) {
    const ipNum = ipToNumber(address);
    if (ipNum === null) return null;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const netNum = (ipNum & mask) >>> 0;
    const bcast = (netNum | (~mask >>> 0)) >>> 0;
    return {
        netmask: numberToIp(mask),
        network: numberToIp(netNum),
        broadcast: numberToIp(bcast),
        hosts: prefix === 31 ? 2 : Math.max((bcast - netNum - 1) >>> 0, 0),
        isNetwork: netNum === ipNum,
    };
}

const SubnetWizard: React.FC<Props> = ({ token, networkId, onSaved, onClose }) => {
    const [step, setStep] = useState<Step>(1);

    // Шаг 1
    const [prefix, setPrefix] = useState<number>(24);

    // Шаг 2
    const [slots, setSlots] = useState<AvailableSlot[]>([]);
    const [slotsHint, setSlotsHint] = useState<string | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotError, setSlotError] = useState<string | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [manualMode, setManualMode] = useState(false);

    // Шаг 3
    const [network, setNetwork] = useState<string>(networkId || '');
    const [vlanId, setVlanId] = useState('');
    const [purpose, setPurpose] = useState('');
    const [gateway, setGateway] = useState('');
    const [description, setDescription] = useState('');
    const [dhcpEnabled, setDhcpEnabled] = useState(false);
    const [dhcpStart, setDhcpStart] = useState('');
    const [dhcpEnd, setDhcpEnd] = useState('');

    // Общее
    const [networks, setNetworks] = useState<CommunicationNetwork[]>([]);
    const [vlans, setVlans] = useState<VLAN[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Загрузка network/vlan при монтировании
    useEffect(() => {
        Promise.all([networksApi.getNetworks(token), networksApi.getVlans(token)])
            .then(([nets, vs]) => {
                setNetworks(nets);
                setVlans(vs);
                if (!network && nets.length === 1) setNetwork(String(nets[0].id));
            })
            .catch(() => { /* не критично */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // При переходе на шаг 2 — загрузка свободных слотов
    useEffect(() => {
        if (step !== 2) return;
        if (!network) return;
        setLoadingSlots(true);
        setSlotError(null);
        setSlotsHint(null);
        networksApi
            .getAvailableSlots(token, network, prefix, 12)
            .then((resp: AvailableSlotsResponse) => {
                setSlots(resp.results || []);
                setSlotsHint(resp.hint || null);
                if (resp.results?.length && !selectedAddress) {
                    setSelectedAddress(resp.results[0].network_address);
                }
                if (resp.hint) setManualMode(true);
            })
            .catch((e: any) => {
                setSlotError(
                    e?.response?.data?.detail || 'Не удалось загрузить свободные подсети',
                );
            })
            .finally(() => setLoadingSlots(false));
    }, [step, network, prefix, token]); // eslint-disable-line react-hooks/exhaustive-deps

    const preview = useMemo(
        () => calcPreview(selectedAddress, prefix),
        [selectedAddress, prefix],
    );

    const canGoNext = (): boolean => {
        if (step === 1) return !!prefix;
        if (step === 2) return !!selectedAddress && !!preview && preview.isNetwork;
        return false;
    };

    const handleNext = () => {
        setError(null);
        if (step === 1) {
            if (!network) {
                setError('Выберите сеть связи');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!preview || !preview.isNetwork) {
                setError('Введите корректный сетевой адрес');
                return;
            }
            setStep(3);
        }
    };

    const handleBack = () => {
        setError(null);
        if (step === 1) return;
        setStep((step - 1) as Step);
    };

    const handleCreate = async () => {
        if (!network || !selectedAddress || !preview) return;
        setSaving(true);
        setError(null);
        try {
            const payload = {
                network,
                network_address: preview.network,
                prefix_length: prefix,
                vlan: vlanId || null,
                purpose: purpose || '',
                gateway: gateway || null,
                description: description || '',
                dhcp_enabled: dhcpEnabled,
                dhcp_pool_start: dhcpEnabled ? dhcpStart || null : null,
                dhcp_pool_end: dhcpEnabled ? dhcpEnd || null : null,
            };
            const created = await networksApi.createSubnet(token, payload);
            onSaved(String(created.id));
        } catch (e: any) {
            const data = e?.response?.data;
            setError(
                data
                    ? typeof data === 'string'
                        ? data
                        : Object.entries(data)
                            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                            .join('; ')
                    : 'Ошибка создания',
            );
        } finally {
            setSaving(false);
        }
    };

    // Закрытие через Escape (кроме момента сохранения)
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
                className="modal swiz"
                style={{ width: 720, maxWidth: '95vw' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Мастер создания подсети</h2>
                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                        disabled={saving}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Шаги */}
                <div className="swiz-steps">
                    <div className={`swiz-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
                        <div className="swiz-step-num">{step > 1 ? <Check size={14} /> : 1}</div>
                        <div className="swiz-step-label">Размер</div>
                    </div>
                    <div className="swiz-step-line" />
                    <div className={`swiz-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
                        <div className="swiz-step-num">{step > 2 ? <Check size={14} /> : 2}</div>
                        <div className="swiz-step-label">Расположение</div>
                    </div>
                    <div className="swiz-step-line" />
                    <div className={`swiz-step ${step >= 3 ? 'active' : ''}`}>
                        <div className="swiz-step-num">3</div>
                        <div className="swiz-step-label">Детали</div>
                    </div>
                </div>

                {/* Содержимое */}
                <div className="swiz-body">
                    {/* ============ ШАГ 1 ============ */}
                    {step === 1 && (
                        <div className="swiz-panel">
                            <div className="swiz-panel-title">Какой размер подсети нужен?</div>

                            <div className="form-group">
                                <label>Сеть связи *</label>
                                <select value={network} onChange={e => setNetwork(e.target.value)}>
                                    <option value="">— выберите сеть —</option>
                                    {networks.map(n => (
                                        <option key={n.id} value={n.id}>{n.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="swiz-prefix-cards">
                                {PREFIX_PRESETS.map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`swiz-prefix-card ${prefix === p ? 'active' : ''}`}
                                        onClick={() => setPrefix(p)}
                                    >
                                        <div className="swiz-prefix-value">/{p}</div>
                                        <div className="swiz-prefix-hosts">
                                            {hostsFor(p)} {hostsFor(p) === 1 ? 'хост' : 'хостов'}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="swiz-prefix-custom">
                                <label>Или введите вручную:</label>
                                <input
                                    type="number"
                                    min={8}
                                    max={31}
                                    value={prefix}
                                    onChange={e => setPrefix(Math.min(31, Math.max(8, Number(e.target.value))))}
                                />
                                <span className="swiz-prefix-custom-hint">
                                    /{prefix} · маска {calcPreview('0.0.0.0', prefix)?.netmask}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ============ ШАГ 2 ============ */}
                    {step === 2 && (
                        <div className="swiz-panel">
                            <div className="swiz-panel-title">
                                Где разместить <b>/{prefix}</b> в сети?
                            </div>

                            {loadingSlots && <div className="loading">Поиск свободных мест…</div>}

                            {!loadingSlots && slotsHint === 'no_ip_range' && (
                                <div className="swiz-hint">
                                    У этой сети не задан IP-диапазон. Введите адрес вручную ниже.
                                </div>
                            )}

                            {!loadingSlots && slotsHint === 'parent_too_small' && (
                                <div className="swiz-hint swiz-hint-warn">
                                    IP-диапазон сети меньше, чем /{prefix}. Введите адрес вручную или вернитесь к шагу 1 и выберите маску поменьше.
                                </div>
                            )}

                            {!loadingSlots && !manualMode && slots.length > 0 && (
                                <div className="swiz-slot-list">
                                    {slots.map(slot => (
                                        <label
                                            key={slot.cidr}
                                            className={`swiz-slot ${selectedAddress === slot.network_address ? 'active' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="slot"
                                                value={slot.network_address}
                                                checked={selectedAddress === slot.network_address}
                                                onChange={() => setSelectedAddress(slot.network_address)}
                                            />
                                            <div className="swiz-slot-body">
                                                <div className="swiz-slot-cidr">{slot.cidr}</div>
                                                <div className="swiz-slot-meta">
                                                    в {slot.parent_cidr} · {hostsFor(prefix)} хостов
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    <button
                                        type="button"
                                        className="swiz-slot-manual-btn"
                                        onClick={() => {
                                            setManualMode(true);
                                            setSelectedAddress('');
                                        }}
                                    >
                                        или ввести адрес вручную →
                                    </button>
                                </div>
                            )}

                            {!loadingSlots && (manualMode || (slots.length === 0 && !slotsHint)) && (
                                <div className="swiz-manual">
                                    {slots.length === 0 && !manualMode && !slotsHint && (
                                        <div className="swiz-hint">
                                            Свободных подсетей /{prefix} в диапазоне сети не найдено. Введите адрес вручную.
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Адрес сети</label>
                                        <input
                                            value={selectedAddress}
                                            onChange={e => setSelectedAddress(e.target.value)}
                                            placeholder={`192.168.10.${prefix === 31 ? '0' : '0'}`}
                                            autoFocus
                                        />
                                    </div>
                                    {slots.length > 0 && (
                                        <button
                                            type="button"
                                            className="swiz-back-to-list"
                                            onClick={() => {
                                                setManualMode(false);
                                                setSelectedAddress(slots[0]?.network_address || '');
                                            }}
                                        >
                                            ← вернуться к списку свободных
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Preview выбранного адреса */}
                            {selectedAddress && (
                                <div className="swiz-preview">
                                    {preview ? (
                                        <>
                                            <div className="swiz-preview-row">
                                                <span>Сеть:</span>
                                                <b>{preview.network}/{prefix}</b>
                                            </div>
                                            <div className="swiz-preview-row">
                                                <span>Маска:</span>
                                                <b>{preview.netmask}</b>
                                            </div>
                                            <div className="swiz-preview-row">
                                                <span>Broadcast:</span>
                                                <b>{preview.broadcast}</b>
                                            </div>
                                            <div className="swiz-preview-row">
                                                <span>Хостов:</span>
                                                <b>{preview.hosts}</b>
                                            </div>
                                            {preview.isNetwork ? (
                                                <div className="swiz-preview-ok">✓ Корректный сетевой адрес</div>
                                            ) : (
                                                <div className="swiz-preview-warn">
                                                    Адрес не сетевой — будет сохранён как {preview.network}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="swiz-preview-warn">
                                            Введите корректный IPv4-адрес
                                        </div>
                                    )}
                                </div>
                            )}

                            {slotError && <div className="error">{slotError}</div>}
                        </div>
                    )}

                    {/* ============ ШАГ 3 ============ */}
                    {step === 3 && preview && (
                        <div className="swiz-panel">
                            <div className="swiz-panel-title">Детали подсети</div>

                            <div className="form-group">
                                <label>VLAN</label>
                                <select value={vlanId} onChange={e => setVlanId(e.target.value)}>
                                    <option value="">— не указан —</option>
                                    {vlans.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} (VLAN {v.vlan_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Назначение</label>
                                <input
                                    value={purpose}
                                    onChange={e => setPurpose(e.target.value)}
                                    placeholder="Серверная / DMZ / CCTV…"
                                    list="swiz-purpose-list"
                                />
                                <datalist id="swiz-purpose-list">
                                    {PURPOSE_HINTS.map(h => <option key={h} value={h} />)}
                                </datalist>
                                <div className="swiz-hint-inline">
                                    {PURPOSE_HINTS.slice(0, 5).map(h => (
                                        <button
                                            key={h}
                                            type="button"
                                            className="swiz-chip"
                                            onClick={() => setPurpose(h)}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Шлюз</label>
                                <input
                                    value={gateway}
                                    onChange={e => setGateway(e.target.value)}
                                    placeholder="192.168.10.1"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={dhcpEnabled}
                                        onChange={e => setDhcpEnabled(e.target.checked)}
                                    />{' '}
                                    DHCP включён
                                </label>
                            </div>

                            {dhcpEnabled && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>DHCP: начало</label>
                                        <input value={dhcpStart} onChange={e => setDhcpStart(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>DHCP: конец</label>
                                        <input value={dhcpEnd} onChange={e => setDhcpEnd(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            {/* Итоговая карточка */}
                            <div className="swiz-summary">
                                <div className="swiz-summary-title">Итог:</div>
                                <div className="swiz-summary-body">
                                    <b>{preview.network}/{prefix}</b>
                                    {vlanId && ` · VLAN ${vlans.find(v => v.id === vlanId)?.vlan_id ?? ''}`}
                                    {' · '}
                                    {preview.hosts} хостов
                                    {gateway && ` · шлюз ${gateway}`}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {error && <div className="swiz-error">{error}</div>}

                {/* Навигация */}
                <div className="swiz-footer">
                    <button
                        type="button"
                        className="swiz-btn swiz-btn-ghost"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <div className="swiz-footer-right">
                        {step > 1 && (
                            <button
                                type="button"
                                className="swiz-btn swiz-btn-secondary"
                                onClick={handleBack}
                                disabled={saving}
                            >
                                <ChevronLeft size={14} /> Назад
                            </button>
                        )}
                        {step < 3 && (
                            <button
                                type="button"
                                className="swiz-btn swiz-btn-primary"
                                onClick={handleNext}
                                disabled={!canGoNext()}
                            >
                                Далее <ChevronRight size={14} />
                            </button>
                        )}
                        {step === 3 && (
                            <button
                                type="button"
                                className="swiz-btn swiz-btn-primary"
                                onClick={handleCreate}
                                disabled={saving}
                            >
                                {saving ? 'Создание…' : 'Создать'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default SubnetWizard;