// NetworksTable.tsx
import React, { useState, useMemo } from 'react';
import './NetworksTable.css';
import { Network } from '../../../types';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Pencil, Filter, X, Search, Trash2,
  ChevronDown, ChevronRight,
  Building2, ShieldAlert, Layers, Network as NetIcon,
} from 'lucide-react';

export const SECURITY_LABELS: Record<string, string> = {
  public: 'Открытая',
  confidential: 'Конфиденциальная',
  secret: 'Секретная',
  top_secret: 'Сов. секретная',
};

const SECURITY_CLASSES: Record<string, string> = {
  public: 'nt-security-public',
  confidential: 'nt-security-confidential',
  secret: 'nt-security-secret',
  top_secret: 'nt-security-top-secret',
};

interface NetworksTableProps {
  networks: Network[];
  divisionId?: string;
  divisions?: Array<{ id: string; name: string }>;
  onDelete?: (networkId: string) => void;
  canEdit?: boolean;
  expandedNetworkId?: string | null;
  renderedNetworkId?: string | null;
  onExpandedNetworkChange?: (networkId: string | null) => void;
  renderExpanded?: (network: Network) => React.ReactNode;
}

const NetworksTable: React.FC<NetworksTableProps> = ({
  networks,
  divisionId,
  divisions = [],
  onDelete,
  canEdit,
  expandedNetworkId: controlledExpandedId,
  renderedNetworkId: controlledRenderedId,
  onExpandedNetworkChange,
  renderExpanded,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [internalExpandedId, setInternalExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    division: '',
    securityLevel: '',
    networkClass: '',
    protocol: '',
    search: '',
  });

  const isControlled = controlledExpandedId !== undefined;
  const expandedNetworkId = isControlled ? controlledExpandedId : internalExpandedId;
  const effectiveRenderedId =
    controlledRenderedId !== undefined ? controlledRenderedId : expandedNetworkId;

  const handleRowClick = (network: Network) => {
    const isExpanded = String(expandedNetworkId) === String(network.id);
    const next: string | null = isExpanded ? null : String(network.id);
    if (isControlled) {
      onExpandedNetworkChange?.(next);
    } else {
      setInternalExpandedId(next);
    }
  };

  const handleEdit = (e: React.MouseEvent, networkId: string) => {
    e.stopPropagation();
    const basePath = divisionId
      ? `/divisions/${divisionId}/networks/communication-networks/edit/${networkId}`
      : `/networks/communication-networks/edit/${networkId}`;
    navigate(basePath, {
      state: { from: location.pathname + location.search, divisionId },
    });
  };

  const handleDelete = (e: React.MouseEvent, networkId: string) => {
    e.stopPropagation();
    onDelete?.(networkId);
  };

  const filteredNetworks = useMemo(() => {
    return networks.filter((network) => {
      if (filters.division && (network as any).division_id !== filters.division) return false;
      if (filters.securityLevel && network.security_level !== filters.securityLevel) return false;
      if (filters.networkClass && network.network_class !== filters.networkClass) return false;
      if (filters.protocol && network.protocol !== filters.protocol) return false;
      if (filters.search && !network.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [networks, filters]);

  // Счётчик активных фильтров (без поиска — он отдельно)
  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.division) n++;
    if (filters.securityLevel) n++;
    if (filters.networkClass) n++;
    if (filters.protocol) n++;
    return n;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0 || filters.search !== '';

  const clearFilters = () =>
    setFilters({ division: '', securityLevel: '', networkClass: '', protocol: '', search: '' });

  const resetFilter = (key: keyof typeof filters) =>
    setFilters((prev) => ({ ...prev, [key]: '' }));

  const columnsCount = canEdit ? 7 : 6;

  return (
    <div className="nt-container">
      <div className="nt-search-filters-panel">
        {/* ===== Поиск + кнопки ===== */}
        <div className="nt-search-container">
          <div className="nt-search-input-wrapper">
            <Search className="nt-search-icon" size={18} />
            <input
              type="text"
              className="nt-search-input"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Поиск по названию сети..."
            />
            {filters.search && (
              <button
                type="button"
                className="nt-search-clear"
                onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                title="Очистить поиск"
                aria-label="Очистить поиск"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="nt-search-actions">
            <button
              type="button"
              className={`nt-filters-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters((v) => !v)}
              title={showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
            >
              <Filter size={16} />
              <span>Фильтры</span>
              {activeFiltersCount > 0 && (
                <span className="nt-filters-count">{activeFiltersCount}</span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="nt-clear-filters"
                onClick={clearFilters}
                title="Сбросить все фильтры"
              >
                <X size={14} />
                <span>Сбросить</span>
              </button>
            )}
          </div>
        </div>

        {/* ===== Панель фильтров ===== */}
        {showFilters && (
          <div className="nt-filters-content">
            {divisions.length > 0 && (
              <div className="nt-filter-group">
                <label className="nt-filter-label">
                  <Building2 className="nt-filter-label-icon" />
                  Подразделение
                </label>
                <div className="nt-filter-field">
                  <select
                    className={`nt-filter-select ${filters.division ? 'nt-filter-select--active' : ''}`}
                    value={filters.division}
                    onChange={(e) => setFilters((prev) => ({ ...prev, division: e.target.value }))}
                  >
                    <option value="">Все подразделения</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                  {filters.division && (
                    <button
                      type="button"
                      className="nt-filter-reset"
                      onClick={() => resetFilter('division')}
                      title="Сбросить"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="nt-filter-group">
              <label className="nt-filter-label">
                <ShieldAlert className="nt-filter-label-icon" />
                Уровень секретности
              </label>
              <div className="nt-filter-field">
                <select
                  className={`nt-filter-select ${filters.securityLevel ? 'nt-filter-select--active' : ''}`}
                  value={filters.securityLevel}
                  onChange={(e) => setFilters((prev) => ({ ...prev, securityLevel: e.target.value }))}
                >
                  <option value="">Все уровни</option>
                  <option value="public">Открытая</option>
                  <option value="confidential">Конфиденциальная</option>
                  <option value="secret">Секретная</option>
                  <option value="top_secret">Сов. секретная</option>
                </select>
                {filters.securityLevel && (
                  <button
                    type="button"
                    className="nt-filter-reset"
                    onClick={() => resetFilter('securityLevel')}
                    title="Сбросить"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            <div className="nt-filter-group">
              <label className="nt-filter-label">
                <Layers className="nt-filter-label-icon" />
                Класс сети
              </label>
              <div className="nt-filter-field">
                <select
                  className={`nt-filter-select ${filters.networkClass ? 'nt-filter-select--active' : ''}`}
                  value={filters.networkClass}
                  onChange={(e) => setFilters((prev) => ({ ...prev, networkClass: e.target.value }))}
                >
                  <option value="">Все классы</option>
                  <option value="1">1 класс</option>
                  <option value="2">2 класс</option>
                </select>
                {filters.networkClass && (
                  <button
                    type="button"
                    className="nt-filter-reset"
                    onClick={() => resetFilter('networkClass')}
                    title="Сбросить"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            <div className="nt-filter-group">
              <label className="nt-filter-label">
                <NetIcon className="nt-filter-label-icon" />
                Протокол
              </label>
              <div className="nt-filter-field">
                <select
                  className={`nt-filter-select ${filters.protocol ? 'nt-filter-select--active' : ''}`}
                  value={filters.protocol}
                  onChange={(e) => setFilters((prev) => ({ ...prev, protocol: e.target.value }))}
                >
                  <option value="">Все протоколы</option>
                  <option value="TCP/IP">TCP/IP</option>
                  <option value="UDP">UDP</option>
                  <option value="MPLS">MPLS</option>
                  <option value="Other">Другой</option>
                </select>
                {filters.protocol && (
                  <button
                    type="button"
                    className="nt-filter-reset"
                    onClick={() => resetFilter('protocol')}
                    title="Сбросить"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== Строка «найдено N из M» ===== */}
        {hasActiveFilters && (
          <div className="nt-filter-summary">
            Найдено: <strong>{filteredNetworks.length}</strong>
            {' '}из{' '}
            <strong>{networks.length}</strong>
            <button
              type="button"
              className="nt-filter-summary__clear"
              onClick={clearFilters}
            >
              Сбросить всё
            </button>
          </div>
        )}
      </div>

      {/* ===== Таблица ===== */}
      <div className="nt-wrapper">
        <table className="nt-table">
          <thead>
            <tr>
              <th className="nt-header nt-header-index">№ п/п</th>
              <th className="nt-header">Название</th>
              <th className="nt-header">Класс</th>
              <th className="nt-header">Секретность</th>
              <th className="nt-header">Протокол</th>
              <th className="nt-header">IP диапазон</th>
              {canEdit && <th className="nt-header">Действия</th>}
            </tr>
          </thead>
          <tbody>
            {filteredNetworks.map((network, idx) => {
              const isExpanded =
                expandedNetworkId != null &&
                String(expandedNetworkId) === String(network.id);
              const isRendering =
                isExpanded ||
                (effectiveRenderedId != null &&
                  String(effectiveRenderedId) === String(network.id));

              return (
                <React.Fragment key={network.id}>
                  <tr
                    className={`nt-row ${isExpanded ? 'expanded selected' : ''}`}
                    onClick={() => handleRowClick(network)}
                  >
                    <td className="nt-cell nt-cell-index">
                      <span className="nt-expand-toggle">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                      <span className="nt-index-num">{idx + 1}</span>
                    </td>
                    <td className="nt-cell nt-cell-name">{network.name}</td>
                    <td className="nt-cell">
                      <span className="nt-class-cell">{network.network_class}</span>
                    </td>
                    <td className="nt-cell">
                      <span className={SECURITY_CLASSES[network.security_level] || ''}>
                        {SECURITY_LABELS[network.security_level] || network.security_level}
                      </span>
                    </td>
                    <td className="nt-cell">{network.protocol}</td>
                    <td className="nt-cell">{network.ip_range || '-'}</td>
                    {canEdit && (
                      <td className="nt-cell nt-cell-actions">
                        <div className="nt-actions-container">
                          <button
                            type="button"
                            className="nt-edit-btn"
                            onClick={(e) => handleEdit(e, network.id)}
                            title="Редактировать сеть"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="nt-delete-btn"
                            onClick={(e) => handleDelete(e, network.id)}
                            title="Удалить сеть"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>

                  <tr className={`nt-details-row ${isExpanded ? 'open' : ''}`}>
                    <td colSpan={columnsCount}>
                      <div className="nt-details-panel">
                        <div className="nt-details-inner">
                          {isRendering && (
                            <>
                              {network.description && (
                                <div className="nt-details-description">
                                  {network.description}
                                </div>
                              )}
                              {renderExpanded?.(network)}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filteredNetworks.length === 0 && (
          <div className="nt-empty-state">
            {networks.length === 0
              ? 'Нет доступных сетей'
              : 'Сети не найдены по заданным фильтрам'}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworksTable;