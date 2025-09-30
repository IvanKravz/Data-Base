// NetworksTable.tsx
import React from 'react';
import './NetworksTable.css';
import { Network } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';

interface NetworksTableProps {
  networks: Network[];
  onSelect: (network: Network) => void;
  selectedNetwork: Network | null;
  divisionId?: string; 
}

const NetworksTable: React.FC<NetworksTableProps> = ({
  networks,
  onSelect,
  selectedNetwork,
  divisionId
}) => {
  const navigate = useNavigate();

  const handleEdit = (e: React.MouseEvent, networkId: string) => {
    e.stopPropagation();
    navigate(`/divisions/${divisionId}/networks/communication-networks/edit/${networkId}`);
  };

  const getSecurityClass = (level: Network['security_level']): string => {
    const securityClasses = {
      'public': 'nt-security-public',
      'confidential': 'nt-security-confidential',
      'secret': 'nt-security-secret',
      'top_secret': 'nt-security-top-secret',
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
    <div className="nt-wrapper">
      <table className="nt-table">
        <thead>
          <tr>
            <th className="nt-header">Название</th>
            <th className="nt-header">Класс</th>
            <th className="nt-header">Секретность</th>
            <th className="nt-header">Протокол</th>
            <th className="nt-header">IP диапазон</th>
            <th className="nt-header">Действия</th>
          </tr>
        </thead>
        <tbody>
          {networks?.map(network => (
            <tr
              key={network.id}
              className={`nt-row ${selectedNetwork?.id === network.id ? 'selected' : ''}`}
              onClick={() => onSelect(network)}
            >
              <td className="nt-cell nt-name-cell">{network.name}</td>
              <td className="nt-cell">
                <span className="nt-class-cell">
                  {network.network_class}
                </span>
              </td>
              <td className="nt-cell">
                <span className={`${getSecurityClass(network.security_level)}`}>
                  {getSecurityDisplay(network.security_level)}
                </span>
              </td>
              <td className="nt-cell">{network.protocol}</td>
              <td className="nt-cell">{network.ip_range || '-'}</td>
              <td className="nt-cell">
                <button 
                  className="nt-edit-button"
                  onClick={(e) => handleEdit(e, network.id)}
                  title="Редактировать сеть"
                >
                  <Pencil />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NetworksTable;