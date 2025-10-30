// NetworksTable.tsx
import React, { useState, useMemo } from 'react';
import './NetworksTable.css';
import { Network } from '../../../types';
import { useNavigate, useLocation } from 'react-router-dom'; // Добавляем useLocation
import { Pencil, Filter, X, Search, Trash2 } from 'lucide-react';

interface NetworksTableProps {
  networks: Network[];
  onSelect: (network: Network) => void;
  selectedNetwork: Network | null;
  divisionId?: string;
  divisions?: Array<{ id: string; name: string }>;
  onDelete?: (networkId: string) => void;
  canEdit?: boolean;
}

const NetworksTable: React.FC<NetworksTableProps> = ({
  networks,
  onSelect,
  selectedNetwork,
  divisionId,
  divisions = [],
  onDelete,
  canEdit = false
}) => {
  const navigate = useNavigate();
  const location = useLocation(); // Добавляем useLocation
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    division: '',
    securityLevel: '',
    networkClass: '',
    protocol: '',
    search: ''
  });

  const handleEdit = (e: React.MouseEvent, networkId: string) => {
    e.stopPropagation();

    // Определяем базовый путь в зависимости от наличия divisionId
    const basePath = divisionId
      ? `/divisions/${divisionId}/networks/communication-networks/edit/${networkId}`
      : `/networks/edit/${networkId}`;

    // Передаем состояние навигации для корректного возврата
    navigate(basePath, {
      state: {
        from: location.pathname + location.search, // Сохраняем текущий путь с параметрами
        divisionId: divisionId
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, networkId: string) => {
    e.stopPropagation();
    onDelete?.(networkId);
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

  // Функция для применения фильтров
  const filteredNetworks = useMemo(() => {
    return networks.filter(network => {
      // Фильтр по подразделению
      if (filters.division && network.division_id !== filters.division) {
        return false;
      }

      // Фильтр по уровню секретности
      if (filters.securityLevel && network.security_level !== filters.securityLevel) {
        return false;
      }

      // Фильтр по классу сети
      if (filters.networkClass && network.network_class !== filters.networkClass) {
        return false;
      }

      // Фильтр по протоколу
      if (filters.protocol && network.protocol !== filters.protocol) {
        return false;
      }

      // Поиск по названию
      if (filters.search && !network.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [networks, filters]);

  const clearFilters = () => {
    setFilters({
      division: '',
      securityLevel: '',
      networkClass: '',
      protocol: '',
      search: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="nt-container">
      {/* Панель поиска и фильтров - без изменений */}
      <div className="nt-search-filters-panel">
        <div className="nt-search-container">
          <div className="nt-search-input-wrapper">
            <Search className="nt-search-icon" size={18} />
            <input
              type="text"
              className="nt-search-input"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Поиск по названию сети..."
            />
          </div>
          
          <div className="nt-search-actions">
            <button 
              className={`nt-filters-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Показать фильтры"
            >
              <Filter size={18} />
              {hasActiveFilters && <span className="nt-active-filters-dot"></span>}
            </button>
            
            {hasActiveFilters && (
              <button className="nt-clear-filters" onClick={clearFilters} title="Очистить фильтры">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Расширенные фильтры - без изменений */}
        {showFilters && (
          <div className="nt-filters-content">
            {/* Фильтр по подразделению */}
            {divisions.length > 0 && (
              <div className="nt-filter-group">
                <label className="nt-filter-label">Подразделение</label>
                <select
                  className="nt-filter-select"
                  value={filters.division}
                  onChange={(e) => setFilters(prev => ({ ...prev, division: e.target.value }))}
                >
                  <option value="">Все подразделения</option>
                  {divisions.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Фильтр по уровню секретности */}
            <div className="nt-filter-group">
              <label className="nt-filter-label">Уровень секретности</label>
              <select
                className="nt-filter-select"
                value={filters.securityLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, securityLevel: e.target.value }))}
              >
                <option value="">Все уровни</option>
                <option value="public">Открытая</option>
                <option value="confidential">Конфиденциальная</option>
                <option value="secret">Секретная</option>
                <option value="top_secret">Сов. секретная</option>
              </select>
            </div>

            {/* Фильтр по классу сети */}
            <div className="nt-filter-group">
              <label className="nt-filter-label">Класс сети</label>
              <select
                className="nt-filter-select"
                value={filters.networkClass}
                onChange={(e) => setFilters(prev => ({ ...prev, networkClass: e.target.value }))}
              >
                <option value="">Все классы</option>
                <option value="1">1 класс</option>
                <option value="2">2 класс</option>
              </select>
            </div>

            {/* Фильтр по протоколу */}
            <div className="nt-filter-group">
              <label className="nt-filter-label">Протокол</label>
              <select
                className="nt-filter-select"
                value={filters.protocol}
                onChange={(e) => setFilters(prev => ({ ...prev, protocol: e.target.value }))}
              >
                <option value="">Все протоколы</option>
                <option value="TCP/IP">TCP/IP</option>
                <option value="UDP">UDP</option>
                <option value="MPLS">MPLS</option>
                <option value="Other">Другой</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Таблица - без изменений */}
      <div className="nt-wrapper">
        <table className="nt-table">
          <thead>
            <tr>
              <th className="nt-header">Название</th>
              <th className="nt-header">Класс</th>
              <th className="nt-header">Секретность</th>
              <th className="nt-header">Протокол</th>
              <th className="nt-header">IP диапазон</th>
              {canEdit && <th className="nt-header">Действия</th>}
            </tr>
          </thead>
          <tbody>
            {filteredNetworks?.map(network => (
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
                {canEdit && (
                  <td className="nt-cell">
                    <div className="nt-actions-container">
                      <button 
                        className="nt-edit-button"
                        onClick={(e) => handleEdit(e, network.id)}
                        title="Редактировать сеть"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        className="nt-delete-button"
                        onClick={(e) => handleDelete(e, network.id)}
                        title="Удалить сеть"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredNetworks.length === 0 && (
          <div className="nt-empty-state">
            {networks.length === 0 ? 'Нет доступных сетей' : 'Сети не найдены по заданным фильтрам'}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworksTable;