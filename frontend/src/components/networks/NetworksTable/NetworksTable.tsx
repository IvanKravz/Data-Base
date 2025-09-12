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
            <th className="network-table-header">Действия</th>
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
              <td className="table-cell">
                <button 
                  className="edit-button"
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