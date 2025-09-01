import React, { useState, useEffect } from 'react';
import { IPAddress, NetworkInterface } from '../../types';
// import { networksApi } from '../../api/networksApi';
import IPAddressModal from '../modals/IPAddressModal';
import '../ManagementPanel.css';
import { networksApi } from '../../../api/networksApi';

interface IPAddressManagementProps {
  token: string | null;
}

const IPAddressManagement: React.FC<IPAddressManagementProps> = ({ token }) => {
  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>([]);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIP, setEditingIP] = useState<IPAddress | null>(null);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ipData, interfacesData] = await Promise.all([
        networksApi.getIPAddresses(token!),
        networksApi.getNetworkInterfaces(token!)
      ]);
      
      setIPAddresses(ipData);
      setInterfaces(interfacesData);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingIP(null);
    setIsModalOpen(true);
  };

  const handleEdit = (ip: IPAddress) => {
    setEditingIP(ip);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот IP-адрес?')) {
      try {
        await networksApi.deleteIPAddress(token!, id);
        setIPAddresses(ipAddresses.filter(ip => ip.id !== id));
      } catch (err) {
        setError('Ошибка при удалении IP-адреса');
        console.error(err);
      }
    }
  };

  const handleSave = async (ipData: Omit<IPAddress, 'id'>) => {
    try {
      if (editingIP) {
        const updated = await networksApi.updateIPAddress(token!, editingIP.id, ipData);
        setIPAddresses(ipAddresses.map(ip => ip.id === editingIP.id ? updated : ip));
      } else {
        const newIP = await networksApi.createIPAddress(token!, ipData);
        setIPAddresses([...ipAddresses, newIP]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(`Ошибка при ${editingIP ? 'обновлении' : 'создании'} IP-адреса`);
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="management-panel">
      <div className="panel-header">
        <h2>Управление IP-адресами</h2>
        <button className="btn-primary" onClick={handleCreate}>
          Добавить IP-адрес
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>IP-адрес</th>
              <th>Маска/префикс</th>
              <th>Версия</th>
              <th>Основной</th>
              <th>Интерфейс</th>
              <th>Оборудование</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {ipAddresses.map(ip => (
              <tr key={ip.id}>
                <td>{ip.address}</td>
                <td>{ip.netmask}</td>
                <td>{ip.version}</td>
                <td>{ip.is_primary ? 'Да' : 'Нет'}</td>
                <td>{ip.interface?.name || 'Не указан'}</td>
                <td>{ip.interface?.equipment?.name || 'Не указано'}</td>
                <td>
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(ip)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(ip.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <IPAddressModal
          ipAddress={editingIP}
          interfaces={interfaces}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default IPAddressManagement;