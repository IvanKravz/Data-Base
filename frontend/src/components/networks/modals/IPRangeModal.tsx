import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IPRange, VLAN, Equipment } from '../../../types';
import './Modal.css';

interface IPRangeModalProps {
  ipRange: IPRange | null;
  vlans: VLAN[];
  equipmentList: Equipment[];
  onSave: (rangeData: Omit<IPRange, 'id'>) => void;
  onClose: () => void;
}

const IPRangeModal: React.FC<IPRangeModalProps> = ({
  ipRange,
  vlans,
  equipmentList,
  onSave,
  onClose
}) => {
  const [network, setNetwork] = useState('');
  const [description, setDescription] = useState('');
  const [vlanId, setVlanId] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  useEffect(() => {
    if (ipRange) {
      setNetwork(ipRange.network);
      setDescription(ipRange.description);
      setVlanId(ipRange.vlan?.id || '');
      setSelectedDevices(ipRange.devices?.map(d => d.id) || []);
    } else {
      setNetwork('');
      setDescription('');
      setVlanId('');
      setSelectedDevices([]);
    }
  }, [ipRange]);

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!network) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }
    onSave({
      network,
      description,
      vlan: vlanId || null,
      devices: selectedDevices
    });
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{ipRange ? 'Редактировать диапазон IP' : 'Добавить диапазон IP'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="network">Сеть *</label>
            <input
              type="text"
              id="network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              placeholder="например, 192.168.1.0/24"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vlan">VLAN</label>
            <select
              id="vlan"
              value={vlanId}
              onChange={(e) => setVlanId(e.target.value)}
            >
              <option value="">Выберите VLAN</option>
              {vlans.map(vlan => (
                <option key={vlan.id} value={vlan.id}>{vlan.name} (VLAN {vlan.vlan_id})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Устройства</label>
            <div className="devices-list">
              {equipmentList.map(device => (
                <label key={device.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={() => handleDeviceToggle(device.id)}
                  />
                  {device.name}
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default IPRangeModal;