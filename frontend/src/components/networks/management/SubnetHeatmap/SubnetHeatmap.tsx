// src/components/networks/management/SubnetHeatmap/SubnetHeatmap.tsx
import React, { useMemo } from 'react';
import { SubnetHost, IPStatus } from '../../../../types';
import './SubnetHeatmap.css';

interface SubnetLike {
  prefix_length: number;
  host_count: number;
  cidr: string;
  network_address: string;
}

interface Props {
  subnet: SubnetLike;
  hosts: SubnetHost[];
  /** Клик по клетке — родитель откроет модалку редактирования */
  onCellClick: (address: string) => void;
}

const STATUS_LABEL: Record<IPStatus, string> = {
  free: 'Свободен',
  reserved: 'Зарезервирован',
  in_use: 'Используется',
  deprecated: 'Устарел',
};

/** Разворачивает network_address/prefix_length в массив «хостовых» адресов */
function generateHostAddresses(networkAddress: string, prefixLength: number): string[] {
  const parts = networkAddress.split('.').map(n => parseInt(n, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return [];
  const [a, b, c, d] = parts;
  const base = ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
  const total = Math.pow(2, 32 - prefixLength);
  const start = prefixLength === 31 ? 0 : 1;
  const end = prefixLength === 31 ? total : total - 1;
  const result: string[] = [];
  for (let i = start; i < end; i++) {
    const n = (base + i) >>> 0;
    result.push(`${n >>> 24}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`);
  }
  return result;
}

const EMPTY_HOST = (address: string): SubnetHost => ({
  address,
  ip_id: null,
  status: 'free',
  hostname: '',
  purpose: '',
  assigned_to: '',
  description: '',
  is_primary: false,
  interface_id: null,
  interface_name: null,
  equipment_name: null,
});

/** Возвращает последний октет: '192.168.10.42' → '42' */
function lastOctet(address: string): string {
  const idx = address.lastIndexOf('.');
  return idx >= 0 ? address.slice(idx + 1) : address;
}

const SubnetHeatmap: React.FC<Props> = ({ subnet, hosts, onCellClick }) => {
  const addresses = useMemo(
    () => generateHostAddresses(subnet.network_address, subnet.prefix_length),
    [subnet.network_address, subnet.prefix_length],
  );

  const hostsMap = useMemo(() => {
    const m = new Map<string, SubnetHost>();
    hosts.forEach(h => m.set(h.address, h));
    return m;
  }, [hosts]);

  return (
    <div className="shm">
      <div className="shm-grid">
        {addresses.map(addr => {
          const host = hostsMap.get(addr) ?? EMPTY_HOST(addr);
          const status = host.status;
          const label = lastOctet(addr);

          let title = `${addr} · ${STATUS_LABEL[status]}`;
          if (host.hostname) title += ` · ${host.hostname}`;
          if (host.assigned_to) title += ` · ${host.assigned_to}`;
          if (host.purpose) title += ` · ${host.purpose}`;
          title += ' — клик, чтобы редактировать';

          return (
            <button
              key={addr}
              type="button"
              className={`shm-cell shm-cell-${status}`}
              title={title}
              aria-label={title}
              onClick={() => onCellClick(addr)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="shm-legend">
        <span><i className="shm-dot shm-cell-free" /> Свободен</span>
        <span><i className="shm-dot shm-cell-reserved" /> Зарезервирован</span>
        <span><i className="shm-dot shm-cell-in_use" /> Используется</span>
        <span><i className="shm-dot shm-cell-deprecated" /> Устарел</span>
      </div>
    </div>
  );
};

export default SubnetHeatmap;