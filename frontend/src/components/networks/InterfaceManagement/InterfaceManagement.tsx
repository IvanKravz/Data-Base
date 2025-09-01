import React, { useState, useEffect } from 'react';
import { NetworkInterface, Equipment, VLAN } from '../../types';
import InterfaceModal from '../modals/InterfaceModal';
import '../ManagementPanel.css';
import { networksApi } from '../../../api/networksApi';

interface InterfaceManagementProps {
  token: string | null;
}

const InterfaceManagement: React.FC<InterfaceManagementProps> = ({ token }) => {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [vlanList, setVlanList] = useState<VLAN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterface, setEditingInterface] = useState<NetworkInterface | null>(null);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [interfacesData, equipmentData, vlansData] = await Promise.all([
        networksApi.getNetworkInterfaces(token!),
        networksApi.getEquipment(token!), // Предполагается, что такой метод есть в API
        networksApi.getVlans(token!)
      ]);
      
      setInterfaces(interfacesData);
      setEquipmentList(equipmentData);
      setVlanList(vlansData);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingInterface(null);
    setIsModalOpen(true);
  };

  const handleEdit = (intf: NetworkInterface) => {
    setEditingInterface(intf);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот интерфейс?')) {
      try {
        await networksApi.deleteNetworkInterface(token!, id);
        setInterfaces(interfaces.filter(i => i.id !== id));
      } catch (err) {
        setError('Ошибка при удалении интерфейса');
        console.error(err);
      }
    }
  };

  const handleSave = async (interfaceData: Omit<NetworkInterface, 'id'>) => {
    try {
      if (editingInterface) {
        const updated = await networksApi.updateNetworkInterface(token!, editingInterface.id, interfaceData);
        setInterfaces(interfaces.map(i => i.id === editingInterface.id ? updated : i));
      } else {
        const newInterface = await networksApi.createNetworkInterface(token!, interfaceData);
        setInterfaces([...interfaces, newInterface]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(`Ошибка при ${editingInterface ? 'обновлении' : 'создании'} интерфейса`);
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="management-panel">
      <div className="panel-header">
        <h2>Управление сетевыми интерфейсами</h2>
        <button className="btn-primary" onClick={handleCreate}>
          Добавить интерфейс
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Оборудование</th>
              <th>Название</th>
              <th>Тип</th>
              <th>Состояние</th>
              <th>VLAN</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {interfaces.map(intf => (
              <tr key={intf.id}>
                <td>{intf.equipment?.name || 'Не указано'}</td>
                <td>{intf.name}</td>
                <td>{intf.interface_type}</td>
                <td>{intf.enabled ? 'Включен' : 'Выключен'}</td>
                <td>{intf.vlan?.name || 'Не указан'}</td>
                <td>
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(intf)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(intf.id)}
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
        <InterfaceModal
          interface={editingInterface}
          equipmentList={equipmentList}
          vlanList={vlanList}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default InterfaceManagement;