import React from 'react';
import { Plus, X } from 'lucide-react';

export const IPAddressList: React.FC<{
    iface: any;
    canEdit: boolean;
    onAdd: () => void;
    onRemove: (ip: any) => void;
}> = ({ iface, canEdit, onAdd, onRemove }) => (
    <div className="ip-addresses">
        {(iface.ip_addresses || []).map((ip: any) => (
            <div key={ip.id} className="ip-pill">
                <span className="mono">{ip.address}</span>
                <span className="muted">{ip.subnet_cidr}</span>
                {ip.is_primary && <span className="badge badge--primary">primary</span>}
                {canEdit && (
                    <button
                        className="ip-pill__remove"
                        onClick={() => onRemove(ip)}
                        title="Отвязать"
                    ><X size={12} /></button>
                )}
            </div>
        ))}
        {canEdit && (
            <button className="btn-ghost" onClick={onAdd}>
                <Plus size={14} /> Назначить IP
            </button>
        )}
    </div>
);