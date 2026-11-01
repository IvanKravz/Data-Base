// src/components/networks/management/VLANManagement/VLANManagement.tsx
import React, { useState, useEffect } from 'react';
import { VLAN } from '../../../types';
import VLANModal from '../modals/VLANModal';
import '../ManagementPanel.css';
import { networksApi } from '../../../api/networksApi';

interface VLANManagementProps {
  token: string | null;
}

const VLANManagement: React.FC<VLANManagementProps> = ({ token }) => {
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVlan, setEditingVlan] = useState<VLAN | null>(null);

  useEffect(() => {
    if (token) {
      fetchVLANs();
    }
  }, [token]);

  const fetchVLANs = async () => {
    try {
      setLoading(true);
      const data = await networksApi.getVlans(token!);
      setVlans(data);
    } catch (err) {
      setError('Ошибка при загрузке VLAN');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingVlan(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vlan: VLAN) => {
    setEditingVlan(vlan);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот VLAN?')) {
      try {
        await networksApi.deleteVlan(token!, id);
        setVlans(vlans.filter(v => v.id !== id));
      } catch (err) {
        setError('Ошибка при удалении VLAN');
        console.error(err);
      }
    }
  };

  const handleSave = async (vlanData: Omit<VLAN, 'id'>) => {
    try {
      if (editingVlan) {
        const updated = await networksApi.updateVlan(token!, editingVlan.id, vlanData);
        setVlans(vlans.map(v => v.id === editingVlan.id ? updated : v));
      } else {
        const newVlan = await networksApi.createVlan(token!, vlanData);
        setVlans([...vlans, newVlan]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(`Ошибка при ${editingVlan ? 'обновлении' : 'создании'} VLAN`);
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="management-panel">
      <div className="panel-header">
        <button className="btn-primary" onClick={handleCreate}>
          Добавить VLAN
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 54 }}>№</th>
              <th style={{ width: 100 }}>VLAN ID</th>
              <th>Название</th>
              <th>Описание</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {vlans.map((vlan, idx) => (
              <tr key={vlan.id}>
                <td className="data-cell-num">{idx + 1}</td>
                <td className="data-cell-center"><b>{vlan.vlan_id}</b></td>
                <td>{vlan.name}</td>
                <td>{vlan.description || '—'}</td>
                <td className="data-cell-center">
                  <button className="btn-edit" onClick={() => handleEdit(vlan)}>
                    Редактировать
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(vlan.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {vlans.length === 0 && (
              <tr>
                <td colSpan={5} className="nt-empty-state">
                  VLAN не созданы. Нажмите «Добавить VLAN».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <VLANModal
          vlan={editingVlan}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default VLANManagement;