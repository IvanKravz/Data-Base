// sections/NetworkInfo.tsx
import React, { useMemo } from 'react';
import { Network } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';

interface NetworkInfoProps {
  equipment: Equipment;
  searchTerm?: string;
}

const SECURITY_LABELS: Record<string, string> = {
  public: 'Открытая',
  confidential: 'Конфиденциальная',
  secret: 'Секретная',
  top_secret: 'Сов. секретная',
};

const SECURITY_MODIFIERS: Record<string, string> = {
  public: 'eqnet-security--public',
  confidential: 'eqnet-security--confidential',
  secret: 'eqnet-security--secret',
  top_secret: 'eqnet-security--top-secret',
};

const getSecurityLabel = (level: string) => SECURITY_LABELS[level] || level || '—';
const getSecurityModifier = (level: string) =>
  SECURITY_MODIFIERS[level] || 'eqnet-security--public';

export function NetworkInfo({ equipment, searchTerm = '' }: NetworkInfoProps) {
  const memberships = equipment.network_memberships || [];

  const filteredMemberships = useMemo(() => {
    if (!searchTerm.trim()) return memberships;
    const lower = searchTerm.toLowerCase().trim();
    return memberships.filter((m) =>
      m.network.name.toLowerCase().includes(lower) ||
      (m.network.network_class || '').toLowerCase().includes(lower) ||
      (m.network.ip_range || '').toLowerCase().includes(lower) ||
      (m.network.protocol || '').toLowerCase().includes(lower) ||
      (m.network.security_level || '').toLowerCase().includes(lower),
    );
  }, [memberships, searchTerm]);

  if (memberships.length === 0) return null;
  if (filteredMemberships.length === 0) return null;

  return (
    <Section title="Сети связи">
      <div className="eqnet-card">
        <div className="eqnet-card__head">
          <div className="eqnet-card__title">
            <Network size={16} className="eqnet-card__title-icon" />
            <span>Подключения</span>
            <span className="eqnet-chip">{filteredMemberships.length}</span>
          </div>
        </div>

        <div className="eqnet-card__scroll">
          <table className="eqnet-table">
            <thead>
              <tr>
                <th className="eqnet-th eqnet-th--name">Название сети</th>
                <th className="eqnet-th eqnet-th--class">Класс</th>
                <th className="eqnet-th eqnet-th--security">Безопасность</th>
                <th className="eqnet-th eqnet-th--ip">IP-диапазон</th>
                <th className="eqnet-th eqnet-th--throughput">Пропускная способность</th>
                <th className="eqnet-th eqnet-th--protocol">Протокол</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemberships.map((m) => (
                <tr key={m.id} className="eqnet-row">
                  <td className="eqnet-td eqnet-td--name">
                    <span className="eqnet-name">{m.network.name}</span>
                  </td>
                  <td className="eqnet-td eqnet-td--class">
                    {m.network.network_class ? (
                      <span className="eqnet-class-badge">
                        {m.network.network_class} класс
                      </span>
                    ) : (
                      <span className="eqnet-muted">Не указан</span>
                    )}
                  </td>
                  <td className="eqnet-td eqnet-td--security">
                    <span
                      className={`eqnet-security ${getSecurityModifier(m.network.security_level)}`}
                    >
                      {getSecurityLabel(m.network.security_level)}
                    </span>
                  </td>
                  <td className="eqnet-td eqnet-td--ip">
                    {m.network.ip_range ? (
                      <code className="eqnet-code">{m.network.ip_range}</code>
                    ) : (
                      <span className="eqnet-muted">—</span>
                    )}
                  </td>
                  <td className="eqnet-td eqnet-td--throughput">
                    {m.network.throughput ? (
                      <span className="eqnet-throughput">
                        {m.network.throughput}
                        <span className="eqnet-throughput__unit">Mbps</span>
                      </span>
                    ) : (
                      <span className="eqnet-muted">—</span>
                    )}
                  </td>
                  <td className="eqnet-td eqnet-td--protocol">
                    {m.network.protocol ? (
                      <span className="eqnet-protocol">{m.network.protocol}</span>
                    ) : (
                      <span className="eqnet-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}