// src/components/networks/management/IPAddressManagement/IPAddressManagement.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IPAddress, IPStatus, Subnet, SubnetHost } from '../../../types';
import '../ManagementPanel.css';
import { networksApi } from '../../../api/networksApi';
import QuickAddIPModal from '../modals/QuickAddIPModal';

interface IPAddressManagementProps {
  token: string | null;
  onNavigateToSubnets?: (subnetId: string) => void;
}

const STATUS_LABEL: Record<IPStatus, string> = {
  free: 'Свободен',
  reserved: 'Зарезервирован',
  in_use: 'Используется',
  deprecated: 'Устарел',
};

const IPAddressManagement: React.FC<IPAddressManagementProps> = ({
  token,
  onNavigateToSubnets,
}) => {
  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>([]);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subnetFilter, setSubnetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<IPStatus | ''>('');
  const [search, setSearch] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const [ipData, subnetsData] = await Promise.all([
        networksApi.getIPAddresses(token),
        networksApi.getSubnets(token),
      ]);
      setIPAddresses(ipData);
      setSubnets(subnetsData);
    } catch (err) {
      console.error(err);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return ipAddresses.filter(ip => {
      if (subnetFilter && ip.subnet !== subnetFilter) return false;
      if (statusFilter && ip.status !== statusFilter) return false;
      if (search) {
        const f = search.toLowerCase();
        if (
          !ip.address.includes(f) &&
          !ip.hostname.toLowerCase().includes(f) &&
          !ip.purpose.toLowerCase().includes(f) &&
          !ip.assigned_to.toLowerCase().includes(f)
        ) return false;
      }
      return true;
    });
  }, [ipAddresses, subnetFilter, statusFilter, search]);

  const handleGoToSubnet = (ip: IPAddress) => {
    if (!onNavigateToSubnets) return;
    if (!ip.subnet) {
      setError('У этого IP-адреса не указана подсеть');
      return;
    }
    onNavigateToSubnets(String(ip.subnet));
  };

  const handleDelete = async (ip: IPAddress) => {
    if (!token) return;
    if (!window.confirm(`Удалить IP ${ip.address}?`)) return;
    try {
      await networksApi.deleteIPAddress(token, ip.id);
      setIPAddresses(prev => prev.filter(x => x.id !== ip.id));
    } catch (err) {
      console.error(err);
      setError('Ошибка удаления IP');
    }
  };

  const handleQuickAdd = async (subnetId: string, hostData: Partial<SubnetHost>) => {
    if (!token) return;
    await networksApi.saveSubnetHosts(token, subnetId, [hostData]);
    setAddModalOpen(false);
    fetchData();
  };

  if (loading) return <div className="loading">Загрузка…</div>;

  return (
    <div className="management-panel">
      <div className="panel-header">
        <div className="ip-filters">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setAddModalOpen(true)}
          >
            + Добавить IP-адрес
          </button>
          <input
            className="ip-filter-input"
            placeholder="Поиск по IP / hostname / кому…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="ip-filter-select"
            value={subnetFilter}
            onChange={e => setSubnetFilter(e.target.value)}
          >
            <option value="">Все подсети</option>
            {subnets.map(s => (
              <option key={s.id} value={s.id}>
                {s.cidr} {s.purpose ? `— ${s.purpose}` : ''}
              </option>
            ))}
          </select>
          <select
            className="ip-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as IPStatus | '')}
          >
            <option value="">Все статусы</option>
            <option value="free">Свободен</option>
            <option value="reserved">Зарезервирован</option>
            <option value="in_use">Используется</option>
            <option value="deprecated">Устарел</option>
          </select>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 54 }}>№</th>
              <th>IP-адрес</th>
              <th>Подсеть</th>
              <th>Статус</th>
              <th>Hostname</th>
              <th>Назначение</th>
              <th>Кому/чему</th>
              <th>Интерфейс</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ip, idx) => (
              <tr key={ip.id}>
                <td className="data-cell-num">{idx + 1}</td>
                <td><code>{ip.address}</code></td>
                <td>{ip.subnet_cidr || '—'}</td>
                <td className="data-cell-center">
                  <span className={`ip-status ip-status-${ip.status}`}>
                    {STATUS_LABEL[ip.status]}
                  </span>
                </td>
                <td>{ip.hostname || '—'}</td>
                <td>{ip.purpose || '—'}</td>
                <td>{ip.assigned_to || '—'}</td>
                <td>
                  {ip.interface_name ? `${ip.equipment_name} / ${ip.interface_name}` : '—'}
                </td>
                <td className="data-cell-center">
                  {onNavigateToSubnets && (
                    <button
                      className="btn-edit"
                      onClick={() => handleGoToSubnet(ip)}
                      title="Открыть эту подсеть во вкладке «Подсети»"
                    >
                      Открыть в подсетях
                    </button>
                  )}
                  <button className="btn-delete" onClick={() => handleDelete(ip)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="nt-empty-state">
                  {ipAddresses.length === 0
                    ? 'Нет занятых IP-адресов. Нажмите «+ Добавить IP-адрес» или создайте подсеть.'
                    : 'Ничего не найдено по фильтрам.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addModalOpen && (
        <QuickAddIPModal
          token={token!}
          subnets={subnets}
          onSave={handleQuickAdd}
          onClose={() => setAddModalOpen(false)}
        />
      )}
    </div>
  );
};

export default IPAddressManagement;