import React, { useState } from 'react';
import { ArrowRight, Link2 } from 'lucide-react';
import { Connection } from '@xyflow/react';
import { SchemaModal } from './SchemaModal';

export interface ConnectDraft {
    params: Connection;
    fromMembershipId: number;
    toMembershipId: number;
    fromEquipment: any;
    toEquipment: any;
    fromInterfaces: any[];
    toInterfaces: any[];
}

interface Props {
    draft: ConnectDraft;
    saving?: boolean;
    onCancel: () => void;
    onConfirm: (opts: {
        fromInterface: number | null;
        toInterface: number | null;
    }) => Promise<void>;
}

export const ConnectionSetupModal: React.FC<Props> = ({
    draft, saving, onCancel, onConfirm,
}) => {
    const [fromIface, setFromIface] = useState<number | null>(
        draft.fromInterfaces[0]?.id ?? null,
    );
    const [toIface, setToIface] = useState<number | null>(
        draft.toInterfaces[0]?.id ?? null,
    );

    const noInterfaces =
        draft.fromInterfaces.length === 0 &&
        draft.toInterfaces.length === 0;

    const footer = (
        <>
            <button
                type="button"
                className="schema-btn schema-btn--ghost"
                onClick={onCancel}
                disabled={saving}
            >
                Отмена
            </button>
            <button
                type="button"
                className="schema-btn schema-btn--primary"
                disabled={saving}
                onClick={() => onConfirm({ fromInterface: fromIface, toInterface: toIface })}
            >
                {saving ? 'Создание…' : 'Создать связь'}
            </button>
        </>
    );

    return (
        <SchemaModal
            title="Настройка соединения"
            icon={<Link2 size={18} />}
            onClose={onCancel}
            footer={footer}
            disabled={saving}
        >
            <div className="schema-connection-summary">
                <strong>{draft.fromEquipment?.name || '—'}</strong>
                <ArrowRight size={16} className="schema-connection-summary__arrow" />
                <strong>{draft.toEquipment?.name || '—'}</strong>
            </div>

            <div className="schema-field">
                <label className="schema-field__label">Интерфейс источника</label>
                <select
                    className="schema-select"
                    value={fromIface ?? ''}
                    onChange={e => setFromIface(e.target.value ? Number(e.target.value) : null)}
                    disabled={saving || draft.fromInterfaces.length === 0}
                >
                    <option value="">— не указан —</option>
                    {draft.fromInterfaces.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                </select>
            </div>

            <div className="schema-field">
                <label className="schema-field__label">Интерфейс назначения</label>
                <select
                    className="schema-select"
                    value={toIface ?? ''}
                    onChange={e => setToIface(e.target.value ? Number(e.target.value) : null)}
                    disabled={saving || draft.toInterfaces.length === 0}
                >
                    <option value="">— не указан —</option>
                    {draft.toInterfaces.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                </select>
            </div>

            {noInterfaces && (
                <div className="schema-note">
                    Ни у одного из устройств нет интерфейсов — связь будет создана
                    без привязки к портам.
                </div>
            )}
        </SchemaModal>
    );
};