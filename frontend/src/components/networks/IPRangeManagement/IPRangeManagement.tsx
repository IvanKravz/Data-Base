import React, { useState, useEffect } from 'react';
import { IPRange, VLAN, Equipment } from '../../types';
import IPRangeModal from '../modals/IPRangeModal';
import '../ManagementPanel.css';
import { networksApi } from '../../../api/networksApi';

interface IPRangeManagementProps {
  token: string | null;
}

const IPRangeManagement: React.FC<IPRangeManagementProps> = ({ token }) => {
  const [ipRanges, setIPRanges] = useState<IPRange[]>([]);
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<IPRange | null>(null);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rangesData, vlansData, equipmentData] = await Promise.all([
        networksApi.getIPRanges(token!),
        networksApi.getVlans(token!),
        networksApi.getEquipment(token!)
      ]);
      
      setIPRanges(rangesData);
      setVlans(vlansData);
      setEquipmentList(equipmentData);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRange(null);
    setIsModalOpen(true);
  };

  const handleEdit = (range: IPRange) => {
    setEditingRange(range);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот диапазон IP?')) {
      try {
        await networksApi.deleteIPRange(token!, id);
        setIPRanges(ipRanges.filter(range => range.id !== id));
      } catch (err) {
        setError('Ошибка при удалении диапазона IP');
        console.error(err);
      }
    }
  };

  const handleSave = async (rangeData: Omit<IPRange, 'id'>) => {
    try {
      if (editingRange) {
        const updated = await networksApi.updateIPRange(token!, editingRange.id, rangeData);
        setIPRanges(ipRanges.map(range => range.id === editingRange.id ? updated : range));
      } else {
        const newRange = await networksApi.createIPRange(token!, rangeData);
        setIPRanges([...ipRanges, newRange]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(`Ошибка при ${editingRange ? 'обновлении' : 'создании'} диапазона IP`);
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="management-panel">
      <div className="panel-header">
        <button className="btn-primary" onClick={handleCreate}>
          Добавить диапазон IP
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Сеть</th>
              <th>Описание</th>
              <th>VLAN</th>
              <th>Устройства</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {ipRanges.map(range => (
              <tr key={range.id}>
                <td>{range.network}</td>
                <td>{range.description}</td>
                <td>{range.vlan?.name || 'Не указан'}</td>
                <td>{range.devices?.length || 0} устройств</td>
                <td>
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(range)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(range.id)}
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
        <IPRangeModal
          ipRange={editingRange}
          vlans={vlans}
          equipmentList={equipmentList}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default IPRangeManagement;