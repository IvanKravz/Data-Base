// NetworkInfo.tsx
import React from 'react';
import { Network } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';

const getSecurityBadgeClass = (level: string) => {
  switch (level) {
    case 'public': return 'security-badge security-public';
    case 'confidential': return 'security-badge security-confidential';
    case 'secret': return 'security-badge security-secret';
    case 'top_secret': return 'security-badge security-top_secret';
    default: return 'security-badge security-public';
  }
};

const getSecurityLabel = (level: string) => {
  switch (level) {
    case 'public': return 'Открытая';
    case 'confidential': return 'Конфиденциальная';
    case 'secret': return 'Секретная';
    case 'top_secret': return 'Сов. секретная';
    default: return level;
  }
};

export function NetworkInfo({ equipment }: { equipment: Equipment }) {
  const memberships = equipment.network_memberships || [];
  if (memberships.length === 0) return null;

  return (
    <Section title="Сети связи">
      <div className="network-section">
        <div className="network-section-header">
          <Network className="network-section-icon" />
          <span className="network-count">{memberships.length}</span>
        </div>
        <div className="networks-table-container">
          <table className="networks-table">
            <thead>
              <tr>
                <th>Название сети</th>
                <th>Класс</th>
                <th>Безопасность</th>
                <th>IP диапазон</th>
                <th>Пропускная способность</th>
                <th>Протокол</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map(m => (
                <tr key={m.id} className="network-row">
                  <td>
                    <div className="network-name-cell">
                      <span className="network-name">{m.network.name}</span>
                    </div>
                  </td>
                  <td><span className="class-badge">{m.network.network_class || 'Не указан'}</span></td>
                  <td><span className={getSecurityBadgeClass(m.network.security_level)}>{getSecurityLabel(m.network.security_level)}</span></td>
                  <td><span className="ip-range">{m.network.ip_range || '—'}</span></td>
                  <td><span className="throughput">{m.network.throughput ? `${m.network.throughput} Mbps` : '—'}</span></td>
                  <td><span className="protocol">{m.network.protocol || 'TCP/IP'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}