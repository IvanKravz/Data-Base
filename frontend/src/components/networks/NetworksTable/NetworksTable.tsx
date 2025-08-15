import React from 'react';
import './NetworksTable.css';
import { Network } from '../../../types';

interface NetworksTableProps {
  networks: Network[];
  onSelect: (network: Network) => void;
  selectedNetwork: Network | null;
}

const NetworksTable: React.FC<NetworksTableProps> = ({
  networks,
  onSelect,
  selectedNetwork
}) => {
  const getSecurityClass = (level: Network['security_level']): string => {
    const securityClasses = {
      'public': 'security-public',
      'confidential': 'security-confidential',
      'secret': 'security-secret',
      'top_secret': 'security-top-secret',
    };
    return securityClasses[level] || '';
  };

  const getSecurityDisplay = (level: Network['security_level']): string => {
    const securityDisplay = {
      'public': 'Открытая',
      'confidential': 'Конфиденциальная',
      'secret': 'Секретная',
      'top_secret': 'Сов. секретная',
    };
    return securityDisplay[level] || level;
  };

  return (
    <div className="networks-table-wrapper">
      <table className="networks-table">
        <thead>
          <tr>
            <th className="network-table-header">Название</th>
            <th className="network-table-header">Класс</th>
            <th className="network-table-header">Секретность</th>
            <th className="network-table-header">Протокол</th>
            <th className="network-table-header">IP диапазон</th>
          </tr>
        </thead>
        <tbody>
          {networks?.map(network => (
            <tr
              key={network.id}
              className={`table-row ${selectedNetwork?.id === network.id ? 'selected' : ''}`}
              onClick={() => onSelect(network)}
            >
              <td className="table-cell name-cell">{network.name}</td>
              <td className="table-cell">
                <span className="class-cell">
                  {network.network_class}
                </span>
              </td>
              <td className="table-cell">
                <span className={`${getSecurityClass(network.security_level)}`}>
                  {getSecurityDisplay(network.security_level)}
                </span>
              </td>
              <td className="table-cell">{network.protocol}</td>
              <td className="table-cell">{network.ip_range || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NetworksTable;