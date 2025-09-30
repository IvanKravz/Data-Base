// NetworkInfo.tsx
import React from 'react';
import { Wifi, Network, HardDrive, Shield, Cpu, Globe } from 'lucide-react';
import { Equipment } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import '.././style.css'

interface NetworkInfoProps {
    equipment: Equipment;
}

// Функция для получения класса безопасности
const getSecurityBadgeClass = (securityLevel: string) => {
    switch (securityLevel) {
        case 'public': return 'security-badge security-public';
        case 'confidential': return 'security-badge security-confidential';
        case 'secret': return 'security-badge security-secret';
        case 'top_secret': return 'security-badge security-top_secret';
        default: return 'security-badge security-public';
    }
};

// Функция для получения читаемого названия уровня безопасности
const getSecurityLabel = (securityLevel: string) => {
    switch (securityLevel) {
        case 'public': return 'Открытая';
        case 'confidential': return 'Конфиденциальная';
        case 'secret': return 'Секретная';
        case 'top_secret': return 'Сов. секретная';
        default: return securityLevel;
    }
};

export function NetworkInfo({ equipment }: NetworkInfoProps) {
    const networkMemberships = equipment.network_memberships || [];

    return (
        <div className="network-info-full-width">
            <InfoCard title="Сети связи" className="network-config-card">
                <div className="network-section-header">
                    <Network className="network-section-icon" />
                    <span className="network-count">{networkMemberships.length}</span>
                </div>
                <div className="network-config-content">

                    {/* Сети связи */}
                    <div className="network-section">
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
                                    {networkMemberships.map((membership) => (
                                        <tr key={membership.id} className="network-row">
                                            <td>
                                                <div className="network-name-cell">
                                                    <span className="network-name">{membership.network.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="class-badge">
                                                    {membership.network.network_class || 'Не указан'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getSecurityBadgeClass(membership.network.security_level)}>
                                                    {getSecurityLabel(membership.network.security_level)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="ip-range">
                                                    {membership.network.ip_range || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="throughput">
                                                    {membership.network.throughput ? `${membership.network.throughput} Mbps` : '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="protocol">
                                                    {membership.network.protocol || 'TCP/IP'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </InfoCard>
        </div>
    );
}