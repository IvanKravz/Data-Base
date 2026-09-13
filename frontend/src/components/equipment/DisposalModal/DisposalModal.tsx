// components/equipment/DisposalModal/DisposalModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DisposalInfo } from '../../../types';
import './DisposalModal.css';

interface DisposalModalProps {
  onConfirm: (disposalInfo: DisposalInfo) => void;
  onCancel: () => void;
}

export function DisposalModal({ onConfirm, onCancel }: DisposalModalProps) {
  const [formData, setFormData] = useState<DisposalInfo>({
    actNumber: '',
    actDate: '',
    disposalCertNumber: '',
    disposalCertDate: '',
    comments: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="disposal-modal-overlay">
      <div className="disposal-modal">
        <div className="disposal-modal-header">
          <h2 className="disposal-modal-title">Списание техники</h2>
          <button onClick={onCancel} className="disposal-modal-close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="disposal-modal-form">
          <div className="disposal-modal-body">
            <div className="disposal-field">
              <label className="disposal-label">№ акта списания *</label>
              <input
                type="text"
                required
                value={formData.actNumber}
                onChange={(e) => setFormData({ ...formData, actNumber: e.target.value })}
                className="disposal-input"
                placeholder="Введите номер акта"
              />
            </div>
            <div className="disposal-field">
              <label className="disposal-label">Дата акта *</label>
              <input
                type="date"
                required
                value={formData.actDate}
                onChange={(e) => setFormData({ ...formData, actDate: e.target.value })}
                className="disposal-input"
              />
            </div>
            <div className="disposal-field">
              <label className="disposal-label">№ справки о ликвидации *</label>
              <input
                type="text"
                required
                value={formData.disposalCertNumber}
                onChange={(e) => setFormData({ ...formData, disposalCertNumber: e.target.value })}
                className="disposal-input"
                placeholder="Введите номер справки"
              />
            </div>
            <div className="disposal-field">
              <label className="disposal-label">Дата справки *</label>
              <input
                type="date"
                required
                value={formData.disposalCertDate}
                onChange={(e) => setFormData({ ...formData, disposalCertDate: e.target.value })}
                className="disposal-input"
              />
            </div>
            <div className="disposal-field">
              <label className="disposal-label">Комментарии</label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="disposal-textarea"
                rows={3}
                placeholder="Дополнительная информация о списании"
              />
            </div>
          </div>
          <div className="disposal-modal-footer">
            <button type="button" onClick={onCancel} className="disposal-btn disposal-btn-secondary">
              Отмена
            </button>
            <button type="submit" className="disposal-btn disposal-btn-danger">
              Списать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}