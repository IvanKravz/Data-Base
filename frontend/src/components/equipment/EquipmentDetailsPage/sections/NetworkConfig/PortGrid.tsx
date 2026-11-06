import React, { useMemo } from 'react';
import { Tooltip } from 'antd';

interface IfaceLike {
    id: string;
    name: string;
    port_number: number | null;
    enabled: boolean;
    mode: 'access' | 'trunk' | 'general' | 'hybrid';
    is_trunk: boolean;
    access_vlan_name?: string | null;
    native_vlan_name?: string | null;
    vlan_configurations?: Array<{ vlan: string }>;
    ip_addresses?: Array<{ address: string; hostname?: string }>;
}

interface Props {
    interfaces: IfaceLike[];
    totalPorts?: number | null;
    selectedPort?: number | null;
    onSelect: (iface: IfaceLike, portNumber: number) => void;
    onCreateAtPort: (portNumber: number) => void;
}

const PORT_MIN = 1;
const PORT_MAX_FALLBACK = 24;

export const PortGrid: React.FC<Props> = ({
    interfaces,
    totalPorts,
    selectedPort,
    onSelect,
    onCreateAtPort,
}) => {
    const { byPort, withoutPort } = useMemo(() => {
        const map = new Map<number, IfaceLike>();
        const without: IfaceLike[] = [];
        for (const i of interfaces) {
            if (i.port_number != null && i.port_number > 0) map.set(i.port_number, i);
            else without.push(i);
        }
        return { byPort: map, withoutPort: without };
    }, [interfaces]);

    const portCount = useMemo(() => {
        if (totalPorts && totalPorts > 0) return totalPorts;
        const maxUsed = Math.max(0, ...Array.from(byPort.keys()));
        return Math.max(PORT_MAX_FALLBACK, maxUsed, interfaces.length);
    }, [totalPorts, byPort, interfaces.length]);

    if (interfaces.length === 0 && !totalPorts) {
        return (
            <div className="portgrid">
                <div className="portgrid-empty">
                    Интерфейсы ещё не созданы. Укажите «Всего портов» или нажмите «Добавить»,
                    чтобы создать первый порт.
                </div>
            </div>
        );
    }

    const ports = Array.from({ length: portCount }, (_, idx) => idx + PORT_MIN);

    return (
        <div className="portgrid">
            {ports.map((port) => {
                const iface = byPort.get(port);
                const isSelected = selectedPort === port;

                if (!iface) {
                    return (
                        <Tooltip
                            key={`empty-${port}`}
                            title={`Порт ${port} — свободен. Кликните, чтобы создать интерфейс`}
                        >
                            <div
                                className={`portgrid-tile portgrid-tile--empty ${isSelected ? 'portgrid-tile--selected' : ''}`}
                                onClick={() => onCreateAtPort(port)}
                            >
                                <span className="portgrid-tile__name">{port}</span>
                            </div>
                        </Tooltip>
                    );
                }

                const isTrunk = iface.mode === 'trunk' || iface.is_trunk;
                const hasIp = (iface.ip_addresses?.length || 0) > 0;
                const cls = [
                    'portgrid-tile',
                    iface.enabled ? 'portgrid-tile--up' : 'portgrid-tile--down',
                    isSelected ? 'portgrid-tile--selected' : '',
                ].filter(Boolean).join(' ');

                const tip = (
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                        <div><b>{iface.name}</b> · {iface.enabled ? 'Up' : 'Down'}</div>
                        <div>Порт: {iface.port_number}</div>
                        <div>Режим: {iface.mode}{isTrunk ? ' (trunk)' : ''}</div>
                        {iface.access_vlan_name && <div>Access: {iface.access_vlan_name}</div>}
                        {iface.native_vlan_name && <div>Native: {iface.native_vlan_name}</div>}
                        {(iface.vlan_configurations?.length || 0) > 0 && (
                            <div>Tagged: {iface.vlan_configurations!.length} VLAN</div>
                        )}
                        {hasIp && (
                            <div>IP: {iface.ip_addresses!.map(ip => ip.address).join(', ')}</div>
                        )}
                    </div>
                );

                return (
                    <Tooltip key={iface.id} title={tip} mouseEnterDelay={0.15}>
                        <div className={cls} onClick={() => onSelect(iface, port)}>
                            {isTrunk && <span className="portgrid-tile__badge portgrid-tile__badge--trunk">T</span>}
                            {hasIp && <span className="portgrid-tile__badge portgrid-tile__badge--ip">•</span>}
                            <span className="portgrid-tile__name">{port}</span>
                        </div>
                    </Tooltip>
                );
            })}

            {withoutPort.length > 0 && (
                <div className="portgrid-extra">
                    <div className="portgrid-extra__label">Без номера порта:</div>
                    {withoutPort.map(i => (
                        <div
                            key={i.id}
                            className="portgrid-tile portgrid-tile--empty portgrid-tile--noport"
                            onClick={() => onSelect(i, -1)}
                            title={`${i.name} — порт не задан`}
                        >
                            <span className="portgrid-tile__name">—</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};