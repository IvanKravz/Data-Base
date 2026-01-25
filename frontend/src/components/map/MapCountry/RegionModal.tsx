import React from 'react';
import Modal from './Modal';
import './Modal.css';
import { isAdmin } from '../../../api/utils/permissions';

interface OfficeData {
  id?: string;
  name: string;
  region: string;
  address: string;
  phone_operator: string;
  phone_communication: string;
  fax?: string;
  email?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface RegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: string | null;
  editingData: OfficeData | null;
  isEditing: boolean;
  isLoading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: (field: keyof OfficeData, value: string) => void;
}

export const RegionModal: React.FC<RegionModalProps> = ({
  isOpen,
  onClose,
  selectedRegion,
  editingData,
  isEditing,
  isLoading,
  onEdit,
  onSave,
  onCancel,
  onInputChange,
}) => {
  
  if (!isOpen || !selectedRegion || !editingData) {
    return null;
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="map-modal-title">{editingData.name}</h2>
      
      {isLoading ? (
        <div className="map-modal-loading">Загрузка...</div>
      ) : isEditing ? (
        <div className="map-modal-edit-form">
          <div className="map-modal-form-group">
            <label className="map-modal-label">Наименование органа:</label>
            <input
              type="text"
              className="map-modal-input"
              value={editingData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
            />
          </div>
          <div className="map-modal-form-group">
            <label className="map-modal-label">Регион:</label>
            <input
              type="text"
              className="map-modal-input"
              value={editingData.region}
              onChange={(e) => onInputChange('region', e.target.value)}
              disabled
            />
          </div>
          <div className="map-modal-form-group">
            <label className="map-modal-label">Адрес:</label>
            <textarea
              className="map-modal-textarea"
              value={editingData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              rows={3}
            />
          </div>
          <div className="map-modal-form-group">
            <label className="map-modal-label">Телефон оперативного дежурного:</label>
            <input
              type="text"
              className="map-modal-input"
              value={editingData.phone_operator}
              onChange={(e) => onInputChange('phone_operator', e.target.value)}
              placeholder="+79999999999"
            />
          </div>
          <div className="map-modal-form-group">
            <label className="map-modal-label">Телефон дежурного по связи:</label>
            <input
              type="text"
              className="map-modal-input"
              value={editingData.phone_communication}
              onChange={(e) => onInputChange('phone_communication', e.target.value)}
              placeholder="+79999999999"
            />
          </div>
          <div className="map-modal-form-group">
            <label className="map-modal-label">Факс:</label>
            <input
              type="text"
              className="map-modal-input"
              value={editingData.fax || ''}
              onChange={(e) => onInputChange('fax', e.target.value)}
              placeholder="+79999999999"
            />
          </div>
          <div className="map-modal-form-group">
            <label className="map-modal-label">Email:</label>
            <input
              type="email"
              className="map-modal-input"
              value={editingData.email || ''}
              onChange={(e) => onInputChange('email', e.target.value)}
              placeholder="example@domain.com"
            />
          </div>
          <div className="map-modal-form-group">
            <label className="map-modal-label">Дополнительная информация:</label>
            <textarea
              className="map-modal-textarea"
              value={editingData.description || ''}
              onChange={(e) => onInputChange('description', e.target.value)}
              rows={4}
              placeholder="Дополнительная информация об органе..."
            />
          </div>
          <div className="map-modal-actions">
            <button 
              onClick={onSave} 
              className="map-modal-save-btn" 
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button onClick={onCancel} className="map-modal-cancel-btn">
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className="map-modal-region-info">
          <div className="map-modal-info-section">
            <h3 className="map-modal-section-title">Основная информация</h3>
            <p className="map-modal-info-item">
              <strong className="map-modal-info-label">Наименование:</strong> 
              {editingData.name || "Не указано"}
            </p>
            <p className="map-modal-info-item">
              <strong className="map-modal-info-label">Регион:</strong> 
              {editingData.region || "Не указано"}
            </p>
            <p className="map-modal-info-item">
              <strong className="map-modal-info-label">Адрес:</strong> 
              {editingData.address || "Не указан"}
            </p>
          </div>

          <div className="map-modal-info-section">
            <h3 className="map-modal-section-title">Контактная информация</h3>
            <p className="map-modal-info-item">
              <strong className="map-modal-info-label">Телефон оперативного дежурного:</strong> 
              {editingData.phone_operator || "Не указан"}
            </p>
            <p className="map-modal-info-item">
              <strong className="map-modal-info-label">Телефон дежурного по связи:</strong> 
              {editingData.phone_communication || "Не указан"}
            </p>
            <p className="map-modal-info-item">
              <strong className="map-modal-info-label">Факс:</strong> 
              {editingData.fax || "Не указан"}
            </p>
            <p className="map-modal-info-item">
              <strong className="map-modal-info-label">Email:</strong> 
              {editingData.email || "Не указан"}
            </p>
          </div>

          {editingData.description && (
            <div className="map-modal-info-section">
              <h3 className="map-modal-section-title">Дополнительная информация</h3>
              <p className="map-modal-info-item">
                {editingData.description}
              </p>
            </div>
          )}

          <div className="map-modal-actions">
            {/* Показываем кнопку редактирования только для администратора */}
            {isAdmin() && (
              <button onClick={onEdit} className="map-modal-edit-btn">
                Редактировать
              </button>
            )}
            <button onClick={onClose} className="map-modal-close-btn">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};