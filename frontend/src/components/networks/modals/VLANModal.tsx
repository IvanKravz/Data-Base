import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { VLAN } from '../../../types';
import './Modal.css';

interface VLANModalProps {
  vlan: VLAN | null;
  onSave: (vlanData: Omit<VLAN, 'id'>) => void;
  onClose: () => void;
}

const VLANModal: React.FC<VLANModalProps> = ({ vlan, onSave, onClose }) => {
  const [vlanId, setVlanId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (vlan) {
      setVlanId(vlan.vlan_id.toString());
      setName(vlan.name);
      setDescription(vlan.description || '');
    } else {
      setVlanId('');
      setName('');
      setDescription('');
    }
  }, [vlan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vlanId || !name) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }
    onSave({
      vlan_id: parseInt(vlanId),
      name,
      description
    });
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{vlan ? 'Редактировать VLAN' : 'Добавить VLAN'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="vlanId">VLAN ID *</label>
            <input
              type="number"
              id="vlanId"
              value={vlanId}
              onChange={(e) => setVlanId(e.target.value)}
              min="1"
              max="4094"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Название *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

export default VLANModal;